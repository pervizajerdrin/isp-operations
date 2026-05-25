/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          500: '#64748b',
          700: '#334155',
          900: '#0f172a',
        },
      },
      boxShadow: {
        line: '0 0 0 1px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
