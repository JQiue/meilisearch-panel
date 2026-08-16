import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
  },
  rules: {
    "eslint/no-unused-vars": "error",
  },
  plugins: ["typescript", "unicorn", "oxc"],
  env: {
    builtin: true,
  },
});
