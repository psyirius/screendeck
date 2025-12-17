import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const UPSTREAM_SERVER = 'http://127.0.0.1:3001';

export default defineConfig({
    main: {
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'electron/legacy/main.ts'),
                },
            },
        },
    },
    preload: {
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'electron/preload/index.ts'),
                },
            },
        },
    },
    renderer: {
        publicDir: resolve(__dirname, 'static'),
        root: 'src/renderer',
        server: {
            host: '0.0.0.0',
            port: 9123,
            proxy: {
                '/api/': {
                    target: UPSTREAM_SERVER,
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => {
                        console.log('[Vite::Api]:', path)
                        return path
                    },
                },
                '/socket.io/': {
                    target: UPSTREAM_SERVER,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                    rewrite: (path) => {
                        console.log('[Vite::Socket.io]:', path);
                        return path
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src/renderer/src'),
            },
        },
        build: {
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/renderer/index.html'),
                },
            },
        },
        plugins: [react(), tailwindcss()],
    },
})
