/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        "tablet-landscape": {
          raw: "(min-width: 1024px) and (orientation: landscape) and (hover: none) and (pointer: coarse)",
        },
      },
      boxShadow: {
        panel: "0 18px 45px rgb(15 23 42 / 10%)",
      },
    },
  },
  plugins: [],
};
