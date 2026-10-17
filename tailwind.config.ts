import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-be-vietnam)", "system-ui", "sans-serif"],
        hanzi: ["var(--font-hanzi)", "serif"],
      },
      // Colours are CSS variables (RGB channels) set in app/globals.css, so the
      // theme picker can switch accent and dark mode at runtime.
      colors: {
        brand: {
          ...Object.fromEntries(
            [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [
              n,
              `rgb(var(--brand-${n}) / <alpha-value>)`,
            ]),
          ),
          // Brand-coloured text on the page, and the primary button's hover fill.
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          hover: "rgb(var(--brand-hover) / <alpha-value>)",
        },
        // Text on a brand-600 fill (white, or dark ink on the gold default).
        "on-brand": "rgb(var(--on-brand) / <alpha-value>)",
        ink: Object.fromEntries(
          [50, 500, 700, 800, 900].map((n) => [n, `rgb(var(--ink-${n}) / <alpha-value>)`]),
        ),
        surface: "rgb(var(--surface) / <alpha-value>)",
        page: "rgb(var(--page) / <alpha-value>)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
