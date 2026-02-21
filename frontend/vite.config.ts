
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // 서브패스 배포 시: VITE_BASE_PATH=/thesis-advisor/ npm run build
  // 독립 배포 시: 기본값 /
  base: process.env.VITE_BASE_PATH || '/',
})
