/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      gridTemplateColumns: {
        '25': 'auto repeat(24, minmax(40px, 1fr))',
      },
    },
  },
  plugins: [],
};
