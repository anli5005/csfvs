// @ts-nocheck
// We'll turn on typechecking later

import express from 'express';
import session from 'express-session';
import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import exphbs from 'express-handlebars';
import passport from 'passport';
import { findOrCreateUser, registerSerialization } from './auth.js';
import { formatAuthors, getProjectById, getUserProjects, userOwnsProject, updateProject } from './projects.js';
import { getAllCriteria, createReview, getUserReview, getReviewCriteria, getProjectReviews, processReviews, deleteReview } from './reviews.js';
import { OAuth2Strategy } from 'passport-google-oauth';
import { getSidebarDetails } from './sidebar.js';
import { lightColor, validateColor } from './color.js';
import { getAllUsers, changeUserType } from './users.js';
import { exportReviews } from './export.js';
import ConnectPGSimple from 'connect-pg-simple';

config();

/**
 * @callback StrategyCallback
 * @param {any} error
 * @param {any} result
 * @returns {void}
 */

const { Pool } = pg;

const dir = dirname(fileURLToPath(import.meta.url));
const pgSession = ConnectPGSimple(session);

async function startServer() {
    const db = new Pool();
    db.connect();
    registerSerialization(passport, db);

    const app = express();

    passport.use(new OAuth2Strategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: process.env.REDIRECT_URL,
            scope: ["profile", "openid", "email"]
        },
        /**
         * 
         * @param {string} _accessToken 
         * @param {string} _refreshToken 
         * @param {any} params 
         * @param {StrategyCallback} done 
         */
        async function (_accessToken, _refreshToken, params, done) {
            try {
                done(null, await findOrCreateUser(db, {outlook_id: params.id, email: params.emails[0].value, name: params.displayName, type: "default"}));
            } catch (e) {
                done(e, null);
            }
        }
    ));

    app.engine("handlebars", exphbs({
        helpers: {
            isequal(a, b) { return a === b; },
            or(a, b) { return a || b; }
        }
    }));
    app.use(express.urlencoded({extended: false}));
    app.set("views", join(dir, "../views"));
    app.set("view engine", "handlebars");

    app.use(session({
        store: new pgSession({pool: db}),
        secret: process.env.SESSION_SECRET || "EDWARD CHANGE ME",
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        res.render("home", {
            user: req.user,
            projects: await getUserProjects(db, req.user),
            sidebar: await getSidebarDetails(db, req.user),
            home: true
        });
    });

    app.get("/login", (req, res) => {
        res.render("signin", {layout: "panel"});
    });

    app.get("/welcome", (req, res) => {
        res.render("welcome", {layout: "panel"});
    });
    
    app.get('/auth/google',
        passport.authenticate('google', {failureRedirect: '/login',}),
        function(req, res) {
            res.redirect('/');
        }
    );

    app.get('/auth/openid/return',
        passport.authenticate('google', {failureRedirect: "/login"}),
        function(req, res) {
            res.redirect("/");
        }
    );

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.use("/projects/:id", async (req, res, next) => {
        try {
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(req.params.id)) {
                return res.sendStatus(404);
            }
            res.locals.project = await getProjectById(db, req.params.id);
            if (!res.locals.project) return res.sendStatus(404);
            next();
        } catch (e) {
            next(e);
        }
    });

    app.get("/projects/:id", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        let review, judged, reviews;
        let showReviews = false;
        let lockReviews = false;
        let criteria = await getAllCriteria(db);
        const owns = await userOwnsProject(db, req.user, res.locals.project);
        const canEdit = req.user.type === "admin" || owns;
        const unrestrictedCriteria = criteria.filter(c => {
            // we could do a SQL query but this is easier
            return !c.restricted
        });
        const judgedCriteria = req.user.type === "admin" ? criteria : unrestrictedCriteria;

        if (canEdit) {
            if (req.user.type === "admin" || !process.env.LOCK_VIEWING) {
                showReviews = true;
                judged = processReviews(await getProjectReviews(db, res.locals.project, "judge"), judgedCriteria);
                reviews = processReviews(await getProjectReviews(db, res.locals.project, "default"), unrestrictedCriteria);
            } else {
                lockReviews = true;
            }
        }

        if (!owns) {
            review = await getUserReview(db, req.user, res.locals.project);
            criteria = (req.user.type === "admin" || req.user.type === "judge") ? criteria : unrestrictedCriteria;
            if (review) {
                const xref = await getReviewCriteria(db, review);
                criteria = criteria.map(c => {
                    const response = xref.find(el => el.criteria_id === c.criteria_id);
                    return { ...c, response };
                });
            }
        }

        res.render("project", {
            user: req.user,
            sidebar: await getSidebarDetails(db, req.user),
            project: res.locals.project,
            authors: formatAuthors(res.locals.project),
            emails: res.locals.project.emails.join(", "),
            votingCriteria: criteria,
            judgedCriteria, 
            otherCriteria: unrestrictedCriteria,
            judged,
            review,
            reviews,
            showReviews,
            color: validateColor((res.locals.project).color) && lightColor((res.locals.project).color),
            canEdit,
            lock: process.env.LOCK_VOTING,
            lockReviews,
            owns
        });
    });

    app.get("/projects/:id/edit", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        const canEdit = req.user.type === "admin" || await userOwnsProject(db, req.user, res.locals.project);

        if (!canEdit) {
            return res.sendStatus(403);
        }

        res.render("projectedit", {
            user: req.user,
            project: res.locals.project,
            color: validateColor((res.locals.project).color) || "#FFFFFF",
            layout: "simple"
        });
    });

    app.post("/projects/:id/edit", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        const canEdit = req.user.type === "admin" || await userOwnsProject(db, req.user, res.locals.project);

        if (!canEdit) {
            return res.sendStatus(403);
        }

        if (typeof req.body.name !== "string") return res.status(400).send("A name is required.");
        if (typeof req.body.description !== "string" && typeof req.body.description !== "undefined") return res.status(400).send("Description must be a string.");
        if (typeof req.body.image !== "string" && typeof req.body.image !== "undefined") return res.status(400).send("Image must be a string.");
        if (typeof req.body.github !== "string" && typeof req.body.github !== "undefined") return res.status(400).send("GitHub must be a string.");
        if (typeof req.body.url !== "string" && typeof req.body.url !== "undefined") return res.status(400).send("URL must be a string.");
        if (typeof req.body.color !== "string" && typeof req.body.color !== "undefined") return res.status(400).send("Color must be a string.");
        if (typeof req.body.platform !== "string" && typeof req.body.platform !== "undefined") return res.status(400).send("Platform must be a string");

        await updateProject(db, res.locals.project, {
            name: req.body.name,
            description: req.body.description,
            image: req.body.image,
            github: req.body.github,
            url: req.body.url,
            color: validateColor(req.body.color),
            platform: req.body.platform
        });

        res.redirect(`/projects/${res.locals.project.project_id}`);
    });

    app.delete("/reviews/:id", async (req, res) => {
        if (!req.user) {
            return res.sendStatus(401);
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        await deleteReview(db, req.params.id);

        res.redirect(`/projects/${res.locals.project.project_id}`);
    });

    app.post("/projects/:id/vote", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (process.env.LOCK_VOTING) {
            return res.status(400).send("It is not time to vote yet");
        }

        const criteria = await getAllCriteria(db);
        
        if (await userOwnsProject(db, req.user, res.locals.project)) {
            return res.status(400).send("You can't vote on your own project!");
        }

        if (await getUserReview(db, req.user, res.locals.project)) {
            return res.status(400).send("Already voted");
        }

        let isBad = false;
        const responses = criteria.map(c => {
            if (c.restricted && (req.user.type !== "admin" && req.user.type !== "judge")) {
                return;
            }
            if (c.type === "free") {
                if (c.required && req.body[c.criteria_id].length === 0) {
                    isBad = true;
                }
                return {criteria_id: c.criteria_id, description: req.body[c.criteria_id]};
            } else if (c.type === "scale") {
                const val = parseInt(req.body[c.criteria_id]);
                if (isNaN(val) || (val < 1 || val > 5)) {
                    isBad = true;
                    return {criteria_id: c.criteria_id};
                }
                return {criteria_id: c.criteria_id, val};
            }
        }).filter(c => c);
        if (isBad) {
            return res.sendStatus(400);
        }
        await createReview(db, req.user, res.locals.project, responses);
        res.redirect(`/projects/${res.locals.project.project_id}`);
    });

    app.get("/admin/users", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        res.render("users", {
            user: req.user,
            sidebar: await getSidebarDetails(db, req.user),
            userManagement: true,
            users: await getAllUsers(db)
        });
    });

    app.post("/admin/users", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        const users = await getAllUsers(db);
        const selectedUsers = users.filter(({user_id}) => req.body[`user-${user_id}`]);

        if (req.body.action === "make-judge") {
            for (let user of selectedUsers) {
                await changeUserType(db, user, "judge");
            }
        } else if (req.body.action === "make-default") {
            for (let user of selectedUsers) {
                await changeUserType(db, user, "default");
            }
        } else if (req.body.action === "make-admin") {
            for (let user of selectedUsers) {
                await changeUserType(db, user, "admin");
            }
        } else {
            return res.sendStatus(400);
        }

        if ((req.body.action === "make-judge" || req.body.action === "make-default") && req.body[`user-${req.user.user_id}`]) {
            res.redirect("/")
        } else {
            res.redirect("/admin/users");
        }
    });

    app.get("/admin/dump", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        res.render("dump", {
            user: req.user,
            sidebar: await getSidebarDetails(db, req.user),
            dump: true,
            random: Math.random().toString()
        });
    });

    app.get("/admin/reviews.csv", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        const csv = await exportReviews(db);
        res.attachment("reviews.csv").send(csv);
    });

    app.get("/admin/criteria", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        if (req.user.type !== "admin") {
            return res.sendStatus(403);
        }

        res.render("criteria", {
            user: req.user,
            sidebar: await getSidebarDetails(db, req.user),
            criteria: await getAllCriteria(db)
        });
    });

    app.use(express.static(join(dir, "../public")));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

startServer();
