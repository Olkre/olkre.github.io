import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds into the site's public folder so Astro serves it at olkre.com/ai_bench/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../../public/ai_bench",
    emptyOutDir: true,
  },
});
