/* vite.config.ts */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
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