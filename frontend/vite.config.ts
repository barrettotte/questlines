import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = (mode === 'browseronly' && env.GITHUB_DEPLOY === 'true')
             ? `${process.env.GITHUB_REPO_NAME || 'questlines'}`
             : '/';

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    base: base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: mode == 'production' || mode == 'browseronly',
    }
  }
});
