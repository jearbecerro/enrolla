import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index'

const port = Number((globalThis as { process?: { env?: { PORT?: string } } }).process?.env?.PORT || 8787)
const frontendUrl = (globalThis as { process?: { env?: { FRONTEND_URL?: string } } }).process?.env?.FRONTEND_URL || 'http://localhost:3000'
serve({ fetch: app.fetch, port })
console.log(`Hono (node) listening on http://127.0.0.1:${port}`)
console.log(`Frontend URL: ${frontendUrl}`)
