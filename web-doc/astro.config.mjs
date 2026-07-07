import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yarcrasy.github.io",
  base: "/deepseek-copilot",
  output: "static",
  outDir: "../docs",
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
