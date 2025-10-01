import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#e2edff",
          200: "#bfd6ff",
          300: "#92b5ff",
          400: "#6690ff",
          500: "#4d71ff",
          600: "#3b55db",
          700: "#2d3fb7",
          800: "#1f2b8f",
          900: "#121c6c"
        }
      }
    }
  },
  plugins: []
};

export default config;
