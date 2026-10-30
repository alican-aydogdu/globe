import { defineConfig } from "vite";

// Site, alican-aydogdu.github.io deposunun /globe/ alt yolunda yayınlanıyor.
export default defineConfig({
  base: "/globe/",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
});
