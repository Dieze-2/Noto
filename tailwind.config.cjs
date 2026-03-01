/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Ajout de la couleur phare de ton UI
        menthe: "#00ffa3", 
      },
      // Ajout des animations pour le "fade-in" de ton AppShell
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        in: "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [],
};