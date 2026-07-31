import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 确保没有引用 @tailwindcss/oxide
  // 如果有 tailwindcss 配置，用标准的 @tailwindcss/vite 插件
})