/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        surface: '#FFFFFF',
        line: '#E6E3DC',
        ink: '#1B1A17',
        muted: '#726E66',
        faint: '#A7A399',
        pine: {
          DEFAULT: '#35513F',
          dark: '#243829',
          soft: '#E8EDE7',
        },
        ochre: { DEFAULT: '#B8863B', soft: '#F3E9D8' },
        brick: { DEFAULT: '#A33B2E', soft: '#F5E3E0' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
