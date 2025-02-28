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
        background: 'var(--background-color)',
        text: 'var(--text-color)',
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