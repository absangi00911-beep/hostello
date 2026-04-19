import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
    },
  },
];

export default eslintConfig;
