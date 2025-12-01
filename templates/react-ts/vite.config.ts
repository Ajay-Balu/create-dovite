import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { Proxy } from "@domoinc/ryuu-proxy";
import manifest from "./public/manifest.json";
import tailwindcss from "@tailwindcss/vite";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const config = { manifest };
const proxy = new Proxy(config);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "ryuu-proxy",
      configureServer(server) {
        // Patch the `res` object to add `status` and `send` methods
        server.middlewares.use((_req: any, res: any, next: any) => {
          res.status = function (code: number) {
            this.statusCode = code;
            return this;
          };
          res.send = function (body: string) {
            this.setHeader("Content-Type", "text/plain");
            this.end(body);
          };
          next();
        });

        // Use the proxy middleware
        server.middlewares.use(proxy.express());
      },
    },
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
