import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so the built site works at https://<user>.github.io/<repo>/
  // regardless of the repo name \u2014 no need to edit this.
  base: "./"
});
