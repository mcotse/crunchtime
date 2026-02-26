import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = parsePort(env.API_PORT ?? env.PORT, 3000)
  const clientPort = parsePort(env.CLIENT_PORT, 5173)
  const apiTarget = env.API_TARGET ?? `http://localhost:${apiPort}`

  return {
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: 'Crunchtime',
          short_name: 'Crunchtime',
          description: 'Group expense tracker',
          theme_color: '#111827',
          background_color: '#111827',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
    server: {
      port: clientPort,
      strictPort: true,
      proxy: {
        '/api': apiTarget,
      },
    },
    build: {
      outDir: 'dist/client',
    },
  }
})
