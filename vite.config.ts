/* vite.config.ts */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import basicSsl from '@vitejs/plugin-basic-ssl'; // 🎯 Import the SSL helper

export default defineConfig({
  plugins: [
    react(),
    // basicSsl() // 🚀 Forces Vite to generate a local trusted SSL certificate on the fly
  ],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
    proxy: {
      // 🎯 TARGET A: Route Weather JIT compilation & Shopify Sync actions straight to server.js
      "/api/sync-weather": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api/subscribe": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api/webhooks": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      // 🎯 TARGET B: Route your relational Product Catalog parameters directly to the PG database API
      "/api/products": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});