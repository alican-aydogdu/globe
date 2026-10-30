import { defineConfig } from "vite";

// Site kendi deposunda (alican-aydogdu/globe) yayınlanıyor: kullanıcı sitesinin /globe/ alt yolu.
export default defineConfig({
  base: "/globe/",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
});
