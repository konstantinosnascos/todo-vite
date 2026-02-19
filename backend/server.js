//server.js
import jsonServer from "json-server";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const server = jsonServer.create();
server.disable('etag');

const router = jsonServer.router("./db.json");
const middlewares = jsonServer.defaults({
    static: "public",
    logger: true
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Cache-Control middleware
server.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=8");
    res.removeHeader("Pragma");
    res.setHeader("Expires", new Date(Date.now() + 60000).toUTCString());
    next();
});

// --------- Custom endpoints ---------
server.get("/health", (_req, res) => {
    res.json({ ok: true });
});

// --------- json-server router ---------
router.render = (req, res) => {
    const data = res.locals.data;
    const etag = crypto
        .createHash("md5")
        .update(JSON.stringify(data))
        .digest("hex");

    res.setHeader("ETag", etag);

    const clientEtag = req.headers["if-none-match"];

    if (clientEtag === etag) {
        res.status(304).end();
        return;
    }

    res.json(data);
};

server.use(router);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`\njson-server running on http://localhost:${port}`);
});