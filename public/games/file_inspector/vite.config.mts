import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";      // ⬅️ use this
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
