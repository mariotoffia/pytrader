import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayPort = env.VITE_GATEWAY_URL?.match(/:(\d+)/)?.[1] || '4000';

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '4003', 10),
      proxy: {
        '/api': {
          target: `http://localhost:${gatewayPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
