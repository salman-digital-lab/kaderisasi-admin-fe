import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "dist/**",
      "tests/browser/dist/**",
      "tests/browser/vite.config.ts",
      "vite.config.ts",
      "eslint.config.mjs",
    ],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:prettier/recommended",
  ),
  ...compat.env({
    browser: true,
    es2021: true,
  }),
  ...compat.plugins("react-hooks", "react-refresh"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": "off",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          // React Router's navigate() only returns a promise in framework mode.
          allowForKnownSafeCalls: [
            {
              from: "package",
              name: "NavigateFunction",
              package: "react-router",
            },
            {
              from: "package",
              name: "NavigateFunction",
              package: "react-router-dom",
            },
          ],
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
