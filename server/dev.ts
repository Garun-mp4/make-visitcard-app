import { app } from './app/create-app.js'

const port = Number(process.env.PORT ?? 8787)
const server = app.listen(port, '127.0.0.1', () => {
  console.info(JSON.stringify({ level: 'info', message: 'Cardly API listening', port }))
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
