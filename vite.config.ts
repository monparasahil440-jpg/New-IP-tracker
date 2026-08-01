import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/New-IP-tracker/', // GitHub Pages repository name
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
});
