import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Noto/", // Indispensable pour GitHub Pages
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // On laisse le plugin gérer le manifest pour éviter les conflits
      manifest: {
        name: "NOTO",
        short_name: "Noto",
        start_url: "/Noto/",
        scope: "/Noto/",
        display: "standalone",
        background_color: "#1a2222", // Minéral
        theme_color: "#6c8976",      // Sauge
        icons: [
          {
            src: "icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "icons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes("supabase.co"),
            handler: "NetworkOnly" // On ne cache pas la DB pour éviter les données périmées
          }
        ]
      }
    })
  ]
});