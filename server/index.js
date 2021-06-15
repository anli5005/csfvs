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
import { formatAuthors, getProjectById, getUserProjects, userOwnsProject } from './projects.js';
import { getAllCriteria, createReview, getUserReview, getReviewCriteria, getProjectReviews, processReviews } from './reviews.js';
import { OAuth2Strategy } from 'passport-google-oauth';
import { getSidebarDetails } from './sidebar.js';
import { lightColor, validateColor } from './color.js';
import { getAllUsers, updateUserType } from './users.js';
import { exportReviews } from './export.js';

config();

/**
 * @callback StrategyCallback
 * @param {any} error
 * @param {any} result
 * @returns {void}
 */

const { Client } = pg;

const dir = dirname(fileURLToPath(import.meta.url));

async function startServer() {
    const db = new Client();
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
            isequal(a, b) { return a === b; }
        }
    }));
    app.use(express.urlencoded({extended: false}));
    app.set("views", join(dir, "../views"));
    app.set("view engine", "handlebars");

    app.use(session({ secret: "EDWARD CHANGE ME" }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        res.render("home", {
            user: req.user,
            projects: await getUserProjects(db, req.user),
            sidebar: await getSidebarDetails(db),
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

    app.get("/projects/:id", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        const project = getProjectById(db, req.params.id);
        let review, judged, reviews;
        let showReviews = false;
        let criteria = await getAllCriteria(db);

        if (req.user.type === "admin" || await userOwnsProject(db, req.user, await project)) {
            showReviews = true;
            judged = processReviews(await getProjectReviews(db, await project, "judge"), criteria);
            reviews = processReviews(await getProjectReviews(db, await project, "default"), criteria);
        } else {
            review = await getUserReview(db, req.user, await project);
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
            sidebar: await getSidebarDetails(db),
            project: await project,
            authors: formatAuthors(await project),
            criteria: criteria,
            judged,
            review,
            reviews,
            showReviews,
            color: validateColor((await project).color) && lightColor((await project).color) 
        });
    });

    app.post("/projects/:id/vote", async (req, res) => {
        if (!req.user) {
            return res.redirect("/login");
        }

        const criteria = await getAllCriteria(db);
        const project = await getProjectById(db, req.params.id);
        
        if (await userOwnsProject(db, req.user, project)) {
            return res.status(400).send("You can't vote on your own project!");
        }

        if (await getUserReview(db, req.user, project)) {
            return res.status(400).send("Already voted");
        }

        const responses = criteria.map(c => {
            if (c.type === "free") {
                return {criteria_id: c.criteria_id, description: req.body[c.criteria_id]};
            } else if (c.type === "scale") {
                const val = parseInt(req.body[c.criteria_id]);
                if (isNaN(val)) return {criteria_id: c.criteria_id};
                return {criteria_id: c.criteria_id, val};
            }
        });
        await createReview(db, req.user, project, responses);
        res.redirect(`/projects/${project.project_id}`);
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
            sidebar: await getSidebarDetails(db),
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

        console.log(req.body.action);

        const users = await getAllUsers(db);
        const selectedUsers = users.filter(({user_id}) => req.body[`user-${user_id}`]);

        if (req.body.action === "make-judge") {
            for (let user of selectedUsers) {
                await updateUserType(db, user, "judge");
            }
        } else if (req.body.action === "make-default") {
            for (let user of selectedUsers) {
                await updateUserType(db, user, "default");
            }
        } else {
            return res.sendStatus(400);
        }

        res.redirect("/admin/users");
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
            sidebar: await getSidebarDetails(db),
            dump: true
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

    app.use(express.static(join(dir, "../public")));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

startServer();
