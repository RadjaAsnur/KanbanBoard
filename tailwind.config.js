/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Priority badge color palette (WCAG AA compliant)
      colors: {
        priority: {
          high: {
            bg: '#fee2e2',   // red-100
            text: '#991b1b', // red-800
            border: '#fca5a5',
          },
          medium: {
            bg: '#fef3c7',   // amber-100
            text: '#92400e', // amber-800
            border: '#fcd34d',
          },
          low: {
            bg: '#d1fae5',   // emerald-100
            text: '#065f46', // emerald-800
            border: '#6ee7b7',
          },
        },
      },
      // Min tap target 44×44px per PRD UX requirements
      minHeight: {
        'tap': '44px',
      },
      minWidth: {
        'tap': '44px',
      },
    },
  },
  plugins: [],
}

