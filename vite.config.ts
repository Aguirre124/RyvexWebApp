import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "lated-regardlessly-harland.ngrok-free.dev"
    ],
    hmr: {
      protocol: 'wss',
      host: 'lated-regardlessly-harland.ngrok-free.dev'
    }
  }
})
