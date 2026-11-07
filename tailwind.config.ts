import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#213843',
          80: '#2d4a57',
          60: '#4b6671',
          darker: '#182b34',
        },
        primary: {
          DEFAULT: '#468D8B',
          hover: '#3a7a78',
          light: '#5aa3a1',
        },
        accent: {
          DEFAULT: '#74B3A8',
          hover: '#61a397',
          light: '#a1cfc7',
        },
        surface: {
          DEFAULT: '#F6DAC0',
          soft: '#FBEBDA',
          line: '#E8C9AA',
        },
        warning: {
          DEFAULT: '#FEAF76',
          soft: 'rgba(254,175,118,0.25)',
        },
        danger: {
          DEFAULT: '#DA6D58',
          soft: 'rgba(218,109,88,0.2)',
        },
      },
      borderRadius: {
        'card': '20px',
        'btn': '999px',
        'input': '14px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(33,56,67,0.12)',
        'card-hover': '0 12px 32px rgba(33,56,67,0.18)',
        'glow': '0 0 20px rgba(116,179,168,0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

