import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"],
  },
  // Regole ufficiali di Next.js: includono react, react-hooks e le verifiche
  // specifiche del framework, già tarate sul nuovo transform JSX.
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintPluginPrettierRecommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // `next/image` richiede di dichiarare gli host remoti in fase di build,
      // mentre l'indirizzo dell'API è configurabile a runtime tramite
      // NEXT_PUBLIC_API_URL: le copertine e i badge restano quindi `<img>`.
      "@next/next/no-img-element": "off",
    },
  },
];
