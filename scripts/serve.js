"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PORT = 4173;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function resolveRequestPath(root, requestUrl) {
  const parsed = new URL(requestUrl, "http://localhost");
  const decoded = decodeURIComponent(parsed.pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

function createStaticServer(root = ROOT) {
  return http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      send(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
      return;
    }

    const filePath = resolveRequestPath(root, req.url);
    if (!filePath) {
      send(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        send(res, err.code === "ENOENT" ? 404 : 500, err.code === "ENOENT" ? "Not Found" : "Server Error");
        return;
      }

      const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store",
      });
      if (req.method === "HEAD") res.end();
      else res.end(data);
    });
  });
}

function listen(port = Number(process.env.PORT) || DEFAULT_PORT) {
  const server = createStaticServer();
  server.listen(port, () => {
    const address = server.address();
    const actualPort = typeof address === "object" && address ? address.port : port;
    console.log(`Nebula Command running at http://localhost:${actualPort}`);
  });
  return server;
}

if (require.main === module) listen();

module.exports = { createStaticServer, listen };
