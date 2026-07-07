import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const srcRoot = path.resolve(__dirname, '../..');

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
  server: {
    cors: true,
    hmr: {
      host: 'localhost',
      port: 5175,
      protocol: 'ws',
    },
  },
  resolve: {
    alias: {
      '@': srcRoot,
      '@webview': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: '../../../dist/webview',
    emptyOutDir: true,
  },
});
