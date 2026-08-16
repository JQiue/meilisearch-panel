import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: ["*.md", "*.json", "pnpm-workspace.yaml"],

  tabWidth: 2,
  sortTailwindcss: true,
  sortPackageJson: true,
  sortImports: {
    groups: ["builtin", "external", "parent", "sibling", "type", "unknown"],
  },
});
