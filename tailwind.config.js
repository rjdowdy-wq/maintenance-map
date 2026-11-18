/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#16222E',
        mist: '#EEF1F4',
        line: '#D8DEE5',
        accent: '#1F4FD8',
      },
      boxShadow: { sheet: '0 -8px 30px rgba(10, 20, 30, 0.28)' },
    },
  },
  plugins: [],
}
