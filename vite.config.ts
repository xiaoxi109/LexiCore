import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 项目页路径：https://xiaoxi109.github.io/LexiCore/
  base: '/LexiCore/',
  server: {
    host: true,
    port: 5173,
  },
})
