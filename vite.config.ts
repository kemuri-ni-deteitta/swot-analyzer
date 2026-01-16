import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    watch: {
      // Игнорируем node_modules для уменьшения нагрузки на file watchers
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
  },
  base: './',
})
