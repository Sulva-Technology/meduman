import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { app } from './server';

// Routes owned by the local Express server (server.ts). Everything else under
// /api is proxied to the NestJS backend, so this list must stay exhaustive.
const LOCAL_API_ROUTES = ['/api/send-waitlist-email'];

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (pathname && LOCAL_API_ROUTES.includes(pathname)) {
          app(req as any, res as any, next);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Third arg '' loads unprefixed vars too (API_PROXY_TARGET is server-side only).
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    server: {
      host: '0.0.0.0',
      port: 3001,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '')
        }
      }
    }
  };
});
