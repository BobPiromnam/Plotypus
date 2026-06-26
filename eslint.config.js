import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "app.js",
      "tests/smoke-output",
      "tests/visual-output",
      "artifacts",
      "handoff",
      "assets/vendor/*.js"
    ]
  },
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts"],
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
      globals: globals.browser
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  }
);
