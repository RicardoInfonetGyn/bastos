// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3008,
    allowedHosts: ['cadastro.ntsinformatica.com.br'],
    proxy: {
      '/api': {
        target: 'http://localhost:3080',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
