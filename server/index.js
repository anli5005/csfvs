import express from 'express';
import { config } from 'dotenv';
import pg from 'pg';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import exphbs from 'express-handlebars';

const { Client } = pg;

const dir = dirname(fileURLToPath(import.meta.url));

config();

async function startServer() {
    const db = new Client();

    const app = express();

    app.engine("handlebars", exphbs());
    app.set("views", join(dir, "../views"));
    app.set("view engine", "handlebars");

    app.get("/", (req, res) => {
        res.render("signin", {layout: "panel"});
    });

    app.get("/welcome", (req, res) => {
        res.render("welcome", {layout: "panel"});
    });

    app.use(express.static(join(dir, "../public")));

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(port);
    console.log(`Listening on port ${port}`);
}

startServer();
