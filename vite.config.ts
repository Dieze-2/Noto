import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Noto/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "NOTO",
        short_name: "Noto",
        start_url: "/Noto/",
        scope: "/Noto/",
        display: "standalone",
        background_color: "#1a2222",
        theme_color: "#6c8976",
        icons: [
          { src: "icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],

  // IMPORTANT: force Vite to prebundle these deps correctly
  optimizeDeps: {
    include: ["recharts", "react-is"],
  },

  resolve: {
    // IMPORTANT: avoid duplicate copies / weird resolution in CI
    dedupe: ["react", "react-dom", "react-is"],
  },

  build: {
    outDir: "dist",
    commonjsOptions: {
      // Some recharts deps can be mixed; this makes rollup more tolerant
      transformMixedEsModules: true,
    },
  },
});
