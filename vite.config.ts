/* vite.config.ts */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import basicSsl from '@vitejs/plugin-basic-ssl'; // 🎯 Preserving your SSL helper signature

export default defineConfig({
  plugins: [
    react(),
    // basicSsl() 
  ],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],

    // 🎯 RECONCILE THE NGROK WEBSOCKET DISRUPTION
    // Forces Vite's browser synchronization loop to utilize secure WebSockets (wss://) via the tunnel wrapper
    hmr: {
      host: 'bogged-nanometer-criteria.ngrok-free.dev',
      protocol: 'wss',
      clientPort: 443,
    },

    proxy: {
      // 🎯 TARGET B: Relational Product Catalog rules MUST sit at the top.
      // Because Vite evaluates proxy targets sequentially, this intercepts catalog searches and routes them to your PG database API
      "/api/products": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },

      // 🎯 TARGET A: Catch-all routing fallback for all other backend configurations
      // Since this sits below your specific product rule, it safely captures /api/sync-weather, /api/subscribe, 
      // /api/webhooks, /api/tokens/redeem, and /api/download-secure-guide and hands them off to your server.js engine
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});