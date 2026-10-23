/** Identidade visual RDF Consultoria: verde-floresta + dourado sobre marfim */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        marfim: "#f7f6f1",
        papel: "#ffffff",
        linha: "#e2e1d8",
        tinta: "#16261f",
        suave: "#5f6b64",
        verde: { DEFAULT: "#0b3d2c", 700: "#0f4d38", 50: "#e5efe9", 100: "#cfe2d7" },
        ouro: { DEFAULT: "#c0934f", 600: "#a87a36", 50: "#f6eddf" },
        alerta: { DEFAULT: "#b23a2e", 50: "#f9e4e1" },
        cinza: { DEFAULT: "#6c7570", 50: "#eeefeb" },
        azul: { DEFAULT: "#2c5e8a", 50: "#e3ecf4" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
