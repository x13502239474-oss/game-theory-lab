/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F8F7F3',
        panel: '#FFFFFF',
        ink: '#12203A',
        'ink-2': '#33415C',
        muted: '#6E7C93',
        line: '#E4E1D8',
        'line-2': '#D3CFC3',
        copper: '#9A6B33',
        'copper-soft': '#C69A63',
        navy: '#14213D',
        'navy-2': '#1E2F52',
        slateblue: '#7E8DA6',
        tint: '#F1EFE9',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans SC"', 'sans-serif'],
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', '"Songti SC"', '"Noto Serif SC"', 'serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        label: '0.16em',
        wide2: '0.24em',
      },
      maxWidth: {
        page: '900px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,32,58,0.04), 0 8px 24px -18px rgba(18,32,58,0.25)',
        lift: '0 18px 40px -28px rgba(18,32,58,0.45)',
      },
    },
  },
  plugins: [],
};
