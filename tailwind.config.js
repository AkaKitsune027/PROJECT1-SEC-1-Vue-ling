import daisyui from 'daisyui'
import typography from '@tailwindcss/typography'
const { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sigmar: ['"Sigmar one"', ...fontFamily.sans]
      }
    }
  },
  plugins: [daisyui, typography]
}
