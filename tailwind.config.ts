import type { Config } from 'tailwindcss';

/**
 * Explicit config so tooling (including shadcn preflight) can detect Tailwind.
 * Sources are scanned; styles use `@tailwindcss/vite` via `vite.config.ts` + `@import "tailwindcss"`.
 */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
} satisfies Config;

export default config;
