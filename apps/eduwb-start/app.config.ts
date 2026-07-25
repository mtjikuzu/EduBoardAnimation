import { createApp } from 'vinxi'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default createApp({
  name: 'eduwb-start',
  root: __dirname,
  routers: [
    {
      name: 'client',
      type: 'client',
      handler: './app/client.tsx',
      target: 'browser',
      plugins: () => [
        tanstackStart({
          srcDirectory: 'app',
        }),
      ],
      base: '/',
    },
    {
      name: 'ssr',
      type: 'http',
      handler: './app/ssr.tsx',
      target: 'server',
      plugins: () => [
        tanstackStart({
          srcDirectory: 'app',
        }),
      ],
      base: '/',
    },
    {
      name: 'public',
      type: 'static',
      dir: './public',
      base: '/',
    },
  ],
})
