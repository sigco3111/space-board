/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8"
        },
        accent: {
          primary: "#38bdf8",
          secondary: "#f472b6"
        },
        success: "#4ade80",
        warning: "#fb923c",
        error: "#f43f5e"
      }
    },
  },
  plugins: [],
}

