import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/todos': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
})