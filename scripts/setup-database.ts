import { ensureDatabaseSchema } from '../server/db/client.js'

await ensureDatabaseSchema()
console.info('Neon database schema is ready')
