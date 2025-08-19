import path from "path"
import fs from "fs"

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(
            mode === 'development' ? '2003.10.13200000' : packageJson.version
        ),
    },
    base: './', // Use relative paths for assets so Electron can load them
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            // this is a proxy for the backend during development
            // it will forward requests from /api to the backend server
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                // strip the /api prefix
                // rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
}))
