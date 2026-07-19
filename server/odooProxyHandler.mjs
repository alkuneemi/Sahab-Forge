// Forwards a POST body to {X-Odoo-Base-Url header}/jsonrpc and pipes the
// response back, with permissive CORS. Framework-agnostic: works as a Vite
// dev middleware (see vite.config.ts) and inside a plain node:http server
// (see odoo-proxy.mjs) since it only touches the standard req/res objects.
import http from "node:http";
import https from "node:https";

export function handleOdooProxyRequest(req, res, { allowedOrigin = "*" } = {}) {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Odoo-Base-Url, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const baseUrl = req.headers["x-odoo-base-url"];
  if (typeof baseUrl !== "string" || !baseUrl) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "missing X-Odoo-Base-Url header" }));
    return;
  }

  let target;
  try {
    target = new URL("/jsonrpc", baseUrl);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "invalid X-Odoo-Base-Url" }));
    return;
  }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("error", (err) => {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `request_read_failed: ${String(err)}` }));
  });
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const client = target.protocol === "https:" ? https : http;
    const upstream = client.request(
      target,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": body.length },
      },
      (upRes) => {
        res.writeHead(upRes.statusCode || 200, { "Content-Type": "application/json" });
        upRes.pipe(res);
      }
    );
    upstream.on("error", (err) => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `upstream_odoo_unreachable: ${String(err)}` }));
    });
    upstream.end(body);
  });
}
