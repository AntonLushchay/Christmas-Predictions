import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/Christmas-Predictions/',
    server: {
        port: 3000,
        host: true,
        strictPort: true,
    },
    build: {
        sourcemap: false,
        minify: 'esbuild',
    },
});
