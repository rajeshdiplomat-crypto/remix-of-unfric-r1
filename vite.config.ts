import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: "unfric",
        short_name: "unfric",
        description: "Your personal mind and life manager",
        start_url: "/diary",
        display: "standalone",
        orientation: "portrait-primary",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // By default, Workbox will only cache what is specifically matched here.
        // It will NOT cache any requests to external hosts (like Supabase API) 
        // unless explicitly defined in runtimeCaching.
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-chart';
            if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('@supabase') || id.includes('@tanstack') || id.includes('idb-keyval')) return 'vendor-data';
            if (id.includes('lucide-react') || id.includes('date-fns')) return 'vendor-ui';
          }
        }
      }
    }
  },
}));

