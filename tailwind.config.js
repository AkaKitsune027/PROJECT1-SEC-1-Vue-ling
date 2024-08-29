import daisyui from 'daisyui';
const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sigmar: [
          '"Sigmar one"',
          ...fontFamily.sans,
        ],
      },
    }
  },
  plugins: [daisyui]
}

