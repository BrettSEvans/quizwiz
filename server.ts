import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import { logger } from './src/lib/logger/system-log'
import path from 'path'
import fs from 'fs'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

// Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Ensure logs directory exists
const logsDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true)
    handle(req, res, parsedUrl)
  })

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
    },
  })

  // Socket event handlers will be added in Phase 1
  io.on('connection', (socket) => {
    logger.logEvent('socket:connected', { socketId: socket.id })
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.logEvent('sigterm:received', { timestamp: new Date().toISOString() })

    // Close socket connections
    io.disconnectSockets()

    // Flush logger queue
    await logger.flush()

    // Close server
    server.close(() => {
      logger.logEvent('server:shutdown', { status: 'complete' })
      process.exit(0)
    })

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.logError('server:shutdown:timeout', new Error('Shutdown timeout'))
      process.exit(1)
    }, 10000)
  })

  // Health check endpoint
  server.on('request', (req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
    }
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    logger.logEvent('server:started', { port, hostname, nodeEnv: process.env.NODE_ENV })
  })
})
