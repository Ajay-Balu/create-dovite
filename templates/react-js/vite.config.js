import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { Proxy } from "@domoinc/ryuu-proxy";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// manifest.json drives both the Domo app definition and the local dev proxy.
const manifest = JSON.parse(
  readFileSync(new URL("./public/manifest.json", import.meta.url), "utf-8")
);

// Proxies /domo/*, /data/*, /sql/* calls to your Domo instance during `yarn dev`.
// Requires `domo login` first. AppDB/Workflows/Code Engine also need
// `proxyId` in manifest.json (see CLAUDE.md).
const proxy = new Proxy({ manifest });

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "ryuu-proxy",
      configureServer(server) {
        // Express-style helpers some ryuu-proxy error paths expect.
        server.middlewares.use((_req, res, next) => {
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.send = (body) => {
            res.setHeader("Content-Type", "text/plain");
            res.end(body);
          };
          next();
        });
        server.middlewares.use(proxy.express());
      },
    },
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
  },
});
