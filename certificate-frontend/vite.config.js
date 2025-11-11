import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}:3001` : 'http://localhost:3001')
    ),
    'import.meta.env.VITE_BASE_URL': JSON.stringify(
      process.env.VITE_BASE_URL || 
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')
    ),
    'import.meta.env.VITE_ALCHEMY_API_KEY': JSON.stringify(
      process.env.ALCHEMY_API_KEY || process.env.VITE_ALCHEMY_API_KEY || ''
    )
  }
})
