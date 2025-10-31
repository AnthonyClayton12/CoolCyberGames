/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "mff-blue": "#0b5fff",
        "mff-muted": "#6b7280",
        "mff-foam": "#f6fbff", // page background (light)
        "mff-ink": "#0f172a",  // text (light)
        "mff-safe": "#10b981",
        "mff-suspicious": "#f59e0b",
        "mff-bad": "#ef4444",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
