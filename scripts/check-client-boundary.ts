import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'

async function files(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(join(root, entry.name))
        : Promise.resolve([join(root, entry.name)]),
    ),
  )
  return nested.flat()
}

for (const file of await files('src')) {
  if (!['.ts', '.tsx'].includes(extname(file))) continue
  const source = await readFile(file, 'utf8')
  if (/from ['"](?:\.\.\/)+server|from ['"]@server/.test(source)) {
    throw new Error(`Server-only import found in client source: ${file}`)
  }
}

for (const file of await files('dist')) {
  if (extname(file) !== '.js') continue
  const bundle = await readFile(file, 'utf8')
  if (
    /BEGIN PRIVATE KEY|DATABASE_URL|SESSION_SECRET|BLOB_READ_WRITE_TOKEN|TELEGRAM_BOT_TOKEN/.test(
      bundle,
    )
  ) {
    throw new Error(`Server secret marker found in client bundle: ${file}`)
  }
}
console.info('Client/server boundary check passed')
