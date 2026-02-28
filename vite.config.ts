import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Indique à Vite que l'app est dans le sous-dossier /Noto/
  base: "./", 
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "NOTO",
        short_name: "Noto",
        start_url: "/Noto/",
        scope: "/Noto/",
        display: "standalone",
        background_color: "#1a2222",
        theme_color: "#6c8976",
        icons: [
          {
            src: "icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});