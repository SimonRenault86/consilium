import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
    plugins: [
        tailwindcss(),
        vue()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./front', import.meta.url)),
            '@components': fileURLToPath(new URL('./front/components', import.meta.url)),
            '@styles': fileURLToPath(new URL('./front/styles', import.meta.url)),
            '@assets': fileURLToPath(new URL('./front/assets', import.meta.url))
        }
    },
    publicDir: false,
    build: {
        outDir: 'public/dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'front/main.js',
            output: {
                entryFileNames: 'main.js',
                assetFileNames: '[name].[ext]'
            }
        }
    }
});
