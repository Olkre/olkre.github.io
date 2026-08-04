// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://olkre.com",
  integrations: [react()],
  build: {
    // Match original static URLs: /cv.html not /cv/
    format: "file",
  },
});
