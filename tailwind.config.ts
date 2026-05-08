import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f5f0ea",
        lavender: {
          50: "#f5f0ea",
          100: "#e8dde8",
          200: "#d4c2dc",
          300: "#b89dd1",
          400: "#a78bca",
          500: "#9678b5",
          600: "#7a5d8e",
          700: "#5d4470",
          800: "#3d2a4d",
          900: "#1a1422",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        sans: ['"Lora"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
