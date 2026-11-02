import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/node_modules\/(?:leaflet|react-leaflet)\//.test(id)) return "map-vendor";
          if (/\/node_modules\/(?:react|react-dom|scheduler)\//.test(id)) return "react-vendor";
        },
      },
    },
  },
});
