import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

import { createApp } from '../server/app/create-app.js'

async function sourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? sourceFiles(join(root, entry.name))
        : Promise.resolve([join(root, entry.name)]),
    ),
  )
  return nested.flat()
}

const app = createApp()
const routes = app.router.stack
if (!Array.isArray(routes) || routes.length === 0) {
  throw new Error('Express application has no registered middleware')
}

for (const file of await sourceFiles('server')) {
  if (extname(file) !== '.ts' || file.endsWith('.test.ts')) continue
  if (/from ['"]@shared\//.test(await readFile(file, 'utf8')))
    throw new Error(`Vercel server entry must not use @shared path aliases: ${file}`)
}

console.info('Server entry check passed')
