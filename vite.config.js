import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'https://sr-game-backend-32667b36f309.herokuapp.com',
      '/rooms': 'https://sr-game-backend-32667b36f309.herokuapp.com',
      '/api':   'https://sr-game-backend-32667b36f309.herokuapp.com',
      '/users': 'https://sr-game-backend-32667b36f309.herokuapp.com',
    }
  }
})
