import type {Config} from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './contentlayer/generated/**/*.mdx'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6C5CE7',
          dark: '#4834D4',
          light: '#A29BFE'
        }
      }
    }
  },
  plugins: [typography]
};

export default config;
