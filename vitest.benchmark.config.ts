import { fileURLToPath } from "node:url";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// The benchmark needs the same credentials the server uses. Loading them here
// keeps them out of shell history and terminal output.
const env = loadEnv("", process.cwd(), "");

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["benchmark/**/*.bench.ts"],
    // One evaluation per case per run, sequentially, against a live model.
    testTimeout: 1_800_000,
    env,
  },
});
