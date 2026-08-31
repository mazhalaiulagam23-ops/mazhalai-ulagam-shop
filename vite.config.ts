// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Load all env vars into process.env for server-side code (server routes and
// server functions). VITE_* client injection stays handled by the shared
// config — never add these to a client define block.
const serverEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        // React Email's htmlparser2 needs entities v4.5.0; newer nested
        // copies removed ./lib/decode.js, so pin imports to the hoisted
        // v4.5.0 copy. Regexes (not string keys) so subpath imports like
        // `entities/escape` map to lib/<name>.js instead of a missing file.
        {
          find: /^entities\/lib\/(decode|encode)\.js$/,
          replacement: path.resolve(__dirname, "node_modules/entities/lib/$1.js"),
        },
        {
          find: /^entities\/(.+)$/,
          replacement: path.resolve(__dirname, "node_modules/entities/lib/$1.js"),
        },
        {
          find: /^entities$/,
          replacement: path.resolve(__dirname, "node_modules/entities"),
        },
      ],
    },
  },
});
