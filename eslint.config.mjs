import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
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
    },
  },
];

export default eslintConfig;
