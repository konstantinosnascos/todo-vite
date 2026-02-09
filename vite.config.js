import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        proxy: {
            '/todos': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})