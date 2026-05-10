/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Dynamic grid columns used by homepage builder responsive settings
    { pattern: /^grid-cols-[1-6]$/ },
    { pattern: /^md:grid-cols-[1-6]$/ },
    { pattern: /^lg:grid-cols-[1-6]$/ },
    // Device visibility classes used by homepage blocks
    'max-[767px]:hidden',
    'min-[768px]:max-[1023px]:hidden',
    'min-[1024px]:hidden',
  ],
  theme: {
    extend: {
      screens: {
        'kiosk': '2160px',
        'kiosk-portrait': { 'raw': '(orientation: portrait) and (min-height: 1500px)' },
        'kiosk-landscape': { 'raw': '(orientation: landscape) and (min-width: 2160px)' },
      },
      colors: {
        primary: {
          DEFAULT: '#0e604a',
          50: '#e6f2ef',
          100: '#cce5df',
          200: '#99cbbf',
          300: '#66b19f',
          400: '#33977f',
          500: '#0e604a',
          600: '#0b4d3c',
          700: '#083a2d',
          800: '#06271f',
          900: '#031410',
        },
        secondary: {
          DEFAULT: '#f7bd20',
          50: '#fef9e7',
          100: '#fef3cf',
          200: '#fde79f',
          300: '#fcdb6f',
          400: '#fbcf3f',
          500: '#f7bd20',
          600: '#c69719',
          700: '#947113',
          800: '#634c0c',
          900: '#312606',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'none': '0px',
        DEFAULT: '0px',
      },
    },
  },
  plugins: [],
}
