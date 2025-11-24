import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com',
      '/rooms': 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com',
      '/api': 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com',
      '/users': 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com',
    }
  }
})
