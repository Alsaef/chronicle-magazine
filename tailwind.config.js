/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Merriweather', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        editorialLight: {
          "primary": "#1e293b",
          "secondary": "#991b1b",
          "accent": "#d97706",
          "neutral": "#262626",
          "base-100": "#fbfbfb",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          "info": "#0284c7",
          "success": "#16a34a",
          "warning": "#d97706",
          "error": "#dc2626",
        },
      },
      "luxury",
      "corporate",
      "dark",
      "light",
    ],
    darkTheme: "luxury",
    base: true,
    styled: true,
    utils: true,
  },
};

