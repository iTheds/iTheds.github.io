import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://itheds.github.io",
  output: "static",
  markdown: {
    shikiConfig: {
      theme: "github-light"
    }
  }
});
