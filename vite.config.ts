import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const productionDemo = mode === 'production' && env.VITE_DEMO_MODE === 'true'

  if (productionDemo) {
    throw new Error('VITE_DEMO_MODE=true is forbidden for production builds')
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': 'http://127.0.0.1:8787',
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            if (moduleId.includes('node_modules/firebase')) return 'firebase'
            if (moduleId.includes('node_modules/react')) return 'react'
            return undefined
          },
        },
      },
    },
  }
})
