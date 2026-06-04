/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,vue}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#FF8C42',
        secondary: '#4CAF50',
        background: '#FFF8E7',
        surface: '#FFFFFF',
        text: '#3E2723',
      },
      fontFamily: {
        title: ['ZCOOL KuaiLe', 'cursive'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
