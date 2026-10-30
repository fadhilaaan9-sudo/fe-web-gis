import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Pisahkan library dari kode aplikasi, supaya kunjungan ulang
        // tidak mengunduh ulang React/Leaflet yang tidak berubah hanya
        // karena kode aplikasi berubah — browser bisa memakai cache
        // chunk vendor dari deploy sebelumnya.
        // Bentuk fungsi, bukan objek, karena tipe Vite 8 di sini hanya
        // menerima fungsi untuk manualChunks (bentuk objek ditolak tsc).
        manualChunks(id) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/leaflet')
          ) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
