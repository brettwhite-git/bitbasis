import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "supabase/functions/**",
    "tailwind.config.js",
  ]),
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Only allow 'any' types in Chart.js utility files where it's genuinely needed
    files: ["lib/utils/chart-tooltip-config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
]);
