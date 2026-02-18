/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e604a',
          50: '#e8f5f1',
          100: '#c1e4d9',
          200: '#9ad3c1',
          300: '#73c2a9',
          400: '#4cb191',
          500: '#0e604a',
          600: '#0b4d3c',
          700: '#083a2d',
          800: '#06271f',
          900: '#031410',
        },
        secondary: {
          DEFAULT: '#f7bd20',
          50: '#fef9e7',
          100: '#fdf0bf',
          200: '#fbe797',
          300: '#fade6f',
          400: '#f9d547',
          500: '#f7bd20',
          600: '#c59719',
          700: '#947113',
          800: '#624c0c',
          900: '#312606',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
      },
    },
  },
  plugins: [],
}
