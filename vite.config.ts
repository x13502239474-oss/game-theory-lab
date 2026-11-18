import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base: './' + HashRouter —— 可直接部署到 GitHub Pages 任意子路径
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
