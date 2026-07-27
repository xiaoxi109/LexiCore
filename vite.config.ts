import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TARGET=android → 相对路径（APK 需要）
// TARGET=web / 默认 → GitHub Pages 路径
const TARGET = process.env.TARGET || 'web'
const base = TARGET === 'android' ? './' : '/LexiCore/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: true,
    port: 5173,
  },
})
