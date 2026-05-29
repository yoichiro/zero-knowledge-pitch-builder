/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-bright": "#31394d",
        "surface-container-high": "#222a3d",
        "on-secondary-fixed": "#002113",
        "error-container": "#93000a",
        "surface-container-lowest": "#060e20",
        "outline-variant": "#464554",
        "tertiary": "#ffb2b7",
        "inverse-on-surface": "#283044",
        "on-tertiary": "#67001b",
        "secondary-container": "#00a572",
        "on-surface-variant": "#c7c4d7",
        "on-primary-fixed-variant": "#2f2ebe",
        "on-error-container": "#ffdad6",
        "primary": "#6366f1", // Stitch override
        "on-tertiary-fixed": "#40000d",
        "tertiary-fixed": "#ffdadb",
        "primary-fixed-dim": "#c0c1ff",
        "on-secondary": "#003824",
        "outline": "#908fa0",
        "primary-container": "#8083ff",
        "on-surface": "#dae2fd",
        "surface-container-low": "#131b2e",
        "secondary": "#10b981", // Stitch override
        "inverse-surface": "#dae2fd",
        "surface-tint": "#c0c1ff",
        "on-error": "#690005",
        "on-primary-container": "#0d0096",
        "surface-container-highest": "#2d3449",
        "surface": "#0b1326",
        "background": "#0b1326",
        "on-background": "#dae2fd",
        "secondary-fixed": "#6ffbbe",
        "surface-dim": "#0b1326",
        "error": "#ffb4ab",
        "on-tertiary-fixed-variant": "#92002a",
        "on-tertiary-container": "#5b0017",
        "tertiary-fixed-dim": "#ffb2b7",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-container": "#00311f",
        "on-secondary-fixed-variant": "#005236",
        "surface-variant": "#2d3449",
        "primary-fixed": "#e1e0ff",
        "on-primary": "#1000a9",
        "on-primary-fixed": "#07006c",
        "inverse-primary": "#494bd6",
        "surface-container": "#171f33",
        "tertiary-container": "#ff516a"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "section-padding": "64px",
        "stack-md": "16px",
        "stack-sm": "8px",
        "gutter": "24px",
        "unit": "4px",
        "container-margin": "32px",
        "stack-lg": "24px"
      },
      fontFamily: {
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: [],
}
