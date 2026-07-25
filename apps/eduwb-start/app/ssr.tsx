import { createServerEntry } from '@tanstack/react-start/server-entry'
import { createRouter } from './router'

export default createServerEntry({
  createRouter,
})
