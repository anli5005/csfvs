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
import { OAuth2Strategy } from 'passport-google-oauth';

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

    app.engine("handlebars", exphbs());
    app.use(express.urlencoded({extended: false}));
    app.set("views", join(dir, "../views"));
    app.set("view engine", "handlebars");

    app.use(session({ secret: "EDWARD CHANGE ME" }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/", (req, res) => {
        res.render("signin", {layout: "panel"});
    });

    app.get("/welcome", (req, res) => {
        res.render("welcome", {layout: "panel"});
    });
    
    app.get('/login',
        passport.authenticate('google', {failureRedirect: '/',}),
        function(req, res) {
            res.redirect('/');
        }
    );

    app.get('/auth/openid/return',
        passport.authenticate('google', {failureRedirect: "/"}),
        function(req, res) {
            res.redirect("/projects");
        }
    );

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.get("/projects", (req, res) => {
        res.render("projects", {
            user: req.user,
            projects: [{project_id: "f", name: "This is a project"}]
        })
    });

    app.get("/projects/:id", (req, res) => {
        res.render("project", {
            user: req.user,
            projects: [{ project_id: "f", name: "This is a project" }],
            project: {project_id: "f", name: "sdf"}
        })
    });

    app.use(express.static(join(dir, "../public")));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

startServer();
