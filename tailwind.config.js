/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all your React files
  ],
  theme: {
    extend: {
      fontFamily: {
        // LOGIC: Use Inter first. If character is missing (like Malayalam), use Manjari.
        sans: ['Inter', 'Manjari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};