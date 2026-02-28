/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 自定义主题色
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a6',
          300: '#f6bb6e',
          400: '#f19535',
          500: '#ee7a13',
          600: '#df5f09',
          700: '#b9470a',
          800: '#93390f',
          900: '#773110',
        },
        // 便签颜色
        note: {
          yellow: '#fef3c7',
          pink: '#fce7f3',
          blue: '#dbeafe',
          green: '#dcfce7',
          purple: '#f3e8ff',
          orange: '#ffedd5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'note': '2px 2px 8px rgba(0, 0, 0, 0.1)',
        'note-hover': '4px 4px 12px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}

