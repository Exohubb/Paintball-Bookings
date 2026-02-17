import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        xploit: {
          primary: '#00ff88',
          glow: '#00ff8844',
        },
        ecell: {
          primary: '#00d4ff',
          glow: '#00d4ff44',
        },
        neon: {
          pink: '#ff006e',
          purple: '#8338ec',
        },
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(131, 56, 236, 0.5)',
      },
    },
  },
  plugins: [],
}
export default config
