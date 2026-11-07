// Tailwind v4's PostCSS plugin already adds vendor prefixes, so autoprefixer
// is not needed.
const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default postcssConfig;
