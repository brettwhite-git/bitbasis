import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Only allow 'any' types in Chart.js utility files where it's genuinely needed
    files: ["lib/utils/chart-tooltip-config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

export default eslintConfig;
