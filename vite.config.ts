import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { handleOdooProxyRequest } from "./server/odooProxyHandler.mjs";

/**
 * Dev-time equivalent of server/odoo-proxy.mjs, sharing the exact same
 * handler. NOTE: Vite's declarative `server.proxy` option is backed by the
 * plain `http-proxy` package, which has no per-request dynamic target
 * ("router" is an http-proxy-middleware feature it doesn't support) — using
 * it here silently ignored the real Odoo URL and always hit a dead
 * placeholder host, which is what caused the 500s. A middleware plugin
 * gives us full control over the request instead.
 */
function odooProxyPlugin(): Plugin {
  return {
    name: "sahab-odoo-proxy",
    configureServer(server) {
      server.middlewares.use("/odoo-proxy/jsonrpc", (req, res) => {
        handleOdooProxyRequest(req, res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), odooProxyPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
