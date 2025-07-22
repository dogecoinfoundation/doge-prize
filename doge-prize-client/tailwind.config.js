/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'tablet': {'max': '768px'},
        'mobile': {'max': '420px'},
      },
    },
  },
  plugins: [],
}

