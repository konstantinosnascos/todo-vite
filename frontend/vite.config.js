import { defineConfig } from 'vite'

export default defineConfig({
    base: process.env.VITE_BASE_PATH || "/",
    server: {
        proxy: {
            '/todos': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/test/setup.js'
    }
})