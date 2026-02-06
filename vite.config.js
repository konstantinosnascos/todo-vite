import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    server: {
        proxy: {
            '/todos': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    plugins: [
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.js',
        })
    ]
})