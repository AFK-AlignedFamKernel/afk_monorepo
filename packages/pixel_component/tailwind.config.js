/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        'public-pixel': ['Public-Pixel', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Enable native support
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Important to handle both web and native
  corePlugins: {
    preflight: false,
  }
} 