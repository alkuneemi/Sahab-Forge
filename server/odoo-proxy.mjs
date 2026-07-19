// Standalone production Odoo proxy — no hardcoded tenant, no extra deps.
// Run:  node server/odoo-proxy.mjs
// Env:  PORT (default 8787), ALLOWED_ORIGIN (default "*")
//
// Then either:
//   a) reverse-proxy "/odoo-proxy" on your app's domain to this server, or
//   b) deploy this on its own domain and set VITE_ODOO_PROXY_URL to it
//      before `npm run build` (e.g. https://proxy.example.com).
import http from "node:http";
import { handleOdooProxyRequest } from "./odooProxyHandler.mjs";

const PORT = process.env.PORT || 8787;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const server = http.createServer((req, res) => {
  if (!req.url?.startsWith("/jsonrpc") && !req.url?.startsWith("/odoo-proxy/jsonrpc")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }
  handleOdooProxyRequest(req, res, { allowedOrigin: ALLOWED_ORIGIN });
});

server.listen(PORT, () => {
  console.log(`Odoo proxy listening on :${PORT} (allowed origin: ${ALLOWED_ORIGIN})`);
});
