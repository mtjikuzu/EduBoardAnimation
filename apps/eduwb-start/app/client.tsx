import { StartClient } from '@tanstack/react-start'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { createRouter } from './router'
import './styles/index.css'

const router = createRouter()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <StartClient router={router} />)
} else {
  createRoot(rootElement).render(<StartClient router={router} />)
}
