import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          bg: '#EEF2F8',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: { card: '16px' },
      boxShadow: { card: '0 4px 14px rgba(15, 43, 70, 0.08)' },
    },
  },
  plugins: [],
} satisfies Config;
