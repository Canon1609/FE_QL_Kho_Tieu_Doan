import react from '@vitejs/plugin-react'
import { createServer } from 'node:http'
import { defineConfig } from 'vite'

function preservePort80Access() {
  return {
    name: 'preserve-port-80-access',
    configureServer(vite) {
      const legacyServer = createServer((req, res) => {
        const host = (req.headers.host || '').split(':')[0].toLowerCase()
        if (!['localhost', '127.0.0.1', '192.168.1.14'].includes(host)) {
          res.writeHead(403).end('Forbidden')
          return
        }
        res.writeHead(302, { Location: `http://${host}:5173${req.url || '/'}` }).end()
      })
      legacyServer.listen(80, '0.0.0.0')
      vite.httpServer?.once('close', () => legacyServer.close())
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preservePort80Access() ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
