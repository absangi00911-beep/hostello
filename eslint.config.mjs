import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".code-review-graph/**",
      ".cursor/**",
      ".impeccable-live/**",
      ".kiro/**",
      ".next/**",
      ".superpowers/**",
      ".venv/**",
      ".vscode/**",
      ".worktrees/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Allow explicit `any` in rare cases — prefer to suppress inline with a comment
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars are errors — catch dead code early
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Prefer const
      "prefer-const": "error",
      // No console.log in production (console.error is fine)
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // Allow bare quotes in JSX text — safer than HTML entities for apostrophes
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["e2e/**/*.ts", "scripts/**/*.{ts,js,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: [
      "src/lib/cron-utils.ts",
      "src/lib/price-alerts.ts",
      "src/lib/sms.ts",
      "src/lib/typesense.ts",
      "src/lib/typesense-sync.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
