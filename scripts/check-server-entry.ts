import { createApp } from '../server/app/create-app.js'

const app = createApp()
const routes = app.router.stack
if (!Array.isArray(routes) || routes.length === 0) {
  throw new Error('Express application has no registered middleware')
}
console.info('Server entry check passed')
