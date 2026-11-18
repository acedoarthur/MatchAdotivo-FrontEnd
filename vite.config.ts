import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

// O proxy evita CORS em desenvolvimento: o navegador chama /api e o Vite repassa à API (que não habilita CORS).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
