import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = 'Christmas-Predictions';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
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
