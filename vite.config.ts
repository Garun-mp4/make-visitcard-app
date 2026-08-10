import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function demoContactEndpoint(enabled: boolean): Plugin {
  return {
    name: 'cardly-demo-contact-endpoint',
    configureServer(server) {
      if (!enabled) return
      server.middlewares.use((request, response, next) => {
        const match = request.url?.match(/^\/api\/public\/cards\/([^/]+)\/contact\.vcf$/)
        if (!match) {
          next()
          return
        }
        const slug = decodeURIComponent(match[1] ?? '')
        if (slug !== 'alexey') {
          response.statusCode = 404
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ code: 'card_not_found' }))
          return
        }
        const origin = `http://${request.headers.host ?? '127.0.0.1:5173'}`
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/vcard; charset=utf-8')
        response.setHeader('Content-Disposition', `attachment; filename="cardly-${slug}.vcf"`)
        response.end(
          [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:Алексей Волков',
            'N:;Алексей Волков;;;',
            'TITLE:Product designer и frontend-разработчик',
            `item1.URL:${origin}/c/${slug}`,
            'item1.X-ABLabel:Cardly',
            'END:VCARD',
            '',
          ].join('\r\n'),
        )
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const productionDemo = mode === 'production' && env.VITE_DEMO_MODE === 'true'

  if (productionDemo) {
    throw new Error('VITE_DEMO_MODE=true is forbidden for production builds')
  }

  return {
    plugins: [demoContactEndpoint(env.VITE_DEMO_MODE === 'true'), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': `${import.meta.dirname}/src`,
        '@shared': `${import.meta.dirname}/shared`,
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
            if (moduleId.includes('node_modules/react')) return 'react'
            return undefined
          },
        },
      },
    },
  }
})
