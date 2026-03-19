import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 핫스팟/다른 기기에서 접속 가능 (0.0.0.0 바인딩)
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
})
