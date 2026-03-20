import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    allowedHosts: true, // Allow ngrok/tunnel domains
    port: 3000,
    proxy: {
      '/status': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: (req, res, options) => {
          if (req.headers.accept?.indexOf('html') !== -1) {
            return '/index.html';
          }
        }
      },
      '/models': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/history': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
