import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
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

