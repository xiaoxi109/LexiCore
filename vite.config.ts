import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径，适配 GitHub Pages 项目页 / 自定义域，无需硬编码仓库名
  base: './',
  server: {
    host: true,
    port: 5173,
  },
})
