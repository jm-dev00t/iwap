import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        "surface-soft": "var(--surface-soft)",
        "surface-card": "var(--surface-card)",
        "surface-plain": "var(--surface-plain)",
        "surface-dark": "var(--surface-dark)",
        "surface-dark-elevated": "var(--surface-dark-elevated)",
        primary: "var(--primary)",
        "primary-active": "var(--primary-active)",
        teal: "var(--accent-teal)",
        amber: "var(--accent-amber)",
        ink: "var(--ink)",
        body: "var(--body)",
        muted: "var(--muted)",
        hairline: "var(--hairline)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        soft: "0 1px 3px rgba(20, 20, 19, 0.08)"
      }
    },
  },
  plugins: [],
};

export default config;
