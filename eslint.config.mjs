import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginSecurity from "eslint-plugin-security";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      security: eslintPluginSecurity,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "readonly",
      },
    },
    rules: {
      // Security rules
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",

      // General rules
      "no-console": "off",
      "no-control-regex": "off",
      "no-empty": "warn",
      "no-case-declarations": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".bun/**",
      "**/~/.bun/**",
      "~/.bun/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "public/**",
      "prisma/**",
    ],
  },
);
