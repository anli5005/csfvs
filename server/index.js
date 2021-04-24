import express from 'express';
import { config } from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import exphbs from 'express-handlebars';

const dir = dirname(fileURLToPath(import.meta.url));

config();

const app = express();

app.engine("handlebars", exphbs());
app.set("views", join(dir, "../views"));
app.set("view engine", "handlebars");

app.use("/", (req, res) => {
    res.render("index");
});

app.use(express.static(join(dir, "../public")));

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(port);
console.log(`Listening on port ${port}`);