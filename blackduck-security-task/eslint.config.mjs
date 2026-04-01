import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  js.configs.recommended,
  // flat/recommended is the ESLint 9 flat config API for @typescript-eslint v8
  // Avoids spreading rules inline which triggers structuredClone (requires Node 17+)
  ...tseslint.configs["flat/recommended"],
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-async-promise-executor": "off",
      // TypeScript handles undefined references better than ESLint's no-undef
      "no-undef": "off",
    },
  },
];