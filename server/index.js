import express from 'express';
import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import exphbs from 'express-handlebars';
import passport from 'passport';
import { findOrCreateUser } from './auth.js';
import AzureAdOAuth2Strategy from 'passport-azure-ad-oauth2';

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

    const app = express();

    passport.use(new AzureAdOAuth2Strategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.REDIRECT_URL
    },
        /**
         * 
         * @param {string} _accessToken 
         * @param {string} _refreshToken 
         * @param {{id_token: string}} params 
         * @param {{provider: string}} _data 
         * @param {StrategyCallback} done 
         */
        async function (_accessToken, _refreshToken, params, _data, done) {
            try {
                const token = params.id_token;
                const profile = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
                done(null, await findOrCreateUser(db, {outlook_id: profile.oid, email: profile.upn, name: profile.name, type: 1}));
            } catch (e) {
                done(e, null);
            }
        }
    ));

    findOrCreateUser(db, {outlook_id: "a", email: "a", name: "a", type: 0});

    app.engine("handlebars", exphbs());
    app.use(express.urlencoded({extended: false}));
    app.set("views", join(dir, "../views"));
    app.set("view engine", "handlebars");

    app.use(passport.initialize());
    app.use(passport.session());

    app.get("/", (req, res) => {
        res.render("signin", {layout: "panel"});
    });

    app.get("/welcome", (req, res) => {
        res.render("welcome", {layout: "panel"});
    });
    
    app.get('/login',
        passport.authenticate('azure_ad_oauth2', {
            failureRedirect: '/',
        }),
        function(req, res) {
            res.redirect('/');
        }
    );

    app.get('/auth/openid/return',
        passport.authenticate('azure_ad_oauth2', {failureRedirect: "/"}),
        function(req, res) {
            res.redirect('/');
        }
    );

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    });

    app.use(express.static(join(dir, "../public")));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

startServer();
