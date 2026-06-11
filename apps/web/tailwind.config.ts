import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — flip between light/dark via CSS vars
        surface:    "rgb(var(--surface) / <alpha-value>)",
        "surface-2":"rgb(var(--surface-2) / <alpha-value>)",
        "surface-3":"rgb(var(--surface-3) / <alpha-value>)",
        fg:         "rgb(var(--fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-dim":   "rgb(var(--fg-dim) / <alpha-value>)",
        line:       "rgb(var(--line) / <alpha-value>)",

        // Stadium Night palette
        ink: {
          DEFAULT: "#05060A",
          900: "#05060A",
          800: "#0B0D14",
          700: "#11141D",
          600: "#1A1F2B",
        },
        pitch: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          900: "#064e3b",
        },
        neon: {
          lime: "#C6FF3D",
          cyan: "#22D3EE",
          magenta: "#F472B6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(198,255,61,0.35), 0 8px 40px -8px rgba(198,255,61,0.35)",
        ring: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "pitch-lines":
          "repeating-linear-gradient(90deg, rgb(var(--line) / 0.18) 0 1px, transparent 1px 56px)",
        "stadium-radial":
          "radial-gradient(80% 50% at 50% 0%, rgb(var(--glow-a) / 0.18), transparent 60%), radial-gradient(60% 40% at 80% 100%, rgb(var(--glow-b) / 0.14), transparent 60%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
