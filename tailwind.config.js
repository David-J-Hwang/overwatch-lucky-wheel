/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 18px 45px rgb(15 23 42 / 10%)",
      },
    },
  },
  plugins: [],
};
