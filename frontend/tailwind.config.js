/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./index.html",            // Include the main HTML file
    "./src/**/*.{js,jsx,ts,tsx}", // Include all JS, JSX, TS, and TSX files in src/
  ],
  theme: {
    extend: {
      animation: {
        float: 'float 3s ease-in-out infinite',
        slideDown: 'slideDown 0.5s ease-out',
        glowPulse: 'glowPulse 2.5s ease-in-out infinite',
        gradientMove: 'gradientMove 5s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideDown: {
          '0%': {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        glowPulse: {
          '0%': {
            boxShadow: '0 0 5px #3b82f6',
          },
          '50%': {
            boxShadow: '0 0 20px #3b82f6, 0 0 30px #06b6d4',
          },
          '100%': {
            boxShadow: '0 0 5px #3b82f6',
          },
        },
        gradientMove: {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
      },
    },
  },
  plugins: [],
};
