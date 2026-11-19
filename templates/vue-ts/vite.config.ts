import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { Proxy } from "@domoinc/ryuu-proxy";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// manifest.json drives both the Domo app definition and the local dev proxy.
// Read it with fs (instead of a JSON import) so it works on every TS/Node version.
const manifest = JSON.parse(
  readFileSync(new URL("./public/manifest.json", import.meta.url), "utf-8")
);

// Proxies /domo/*, /data/*, /sql/* calls to your Domo instance during `yarn dev`.
// Requires `domo login` first. AppDB/Workflows/Code Engine also need
// `proxyId` in manifest.json (see CLAUDE.md).
const proxy = new Proxy({ manifest });

type DevResponse = ServerResponse & {
  status?: (code: number) => DevResponse;
  send?: (body: string) => void;
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: "ryuu-proxy",
      configureServer(server) {
        // Express-style helpers some ryuu-proxy error paths expect.
        server.middlewares.use(
          (_req: IncomingMessage, res: DevResponse, next: () => void) => {
            res.status = (code: number) => {
              res.statusCode = code;
              return res;
            };
            res.send = (body: string) => {
              res.setHeader("Content-Type", "text/plain");
              res.end(body);
            };
            next();
          }
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        server.middlewares.use(proxy.express() as any);
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
