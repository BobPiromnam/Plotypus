import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist/react",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "react-entry": "react-entry.html",
        "react-vanilla-bridge": "react-vanilla-bridge.html"
      }
    }
  },
  publicDir: false,
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "tests/smoke-output", "tests/visual-output"]
  }
});
