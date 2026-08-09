import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

let productionTemplate: Promise<string> | null = null

async function readTemplate(): Promise<string> {
  try {
    return await readFile(resolve(process.cwd(), 'dist/index.html'), 'utf8')
  } catch (productionError) {
    if (process.env.APP_ENV === 'production') throw productionError
    return readFile(resolve(process.cwd(), 'index.html'), 'utf8')
  }
}

export function loadPublicCardTemplate(): Promise<string> {
  productionTemplate ??= readTemplate().catch((error: unknown) => {
    productionTemplate = null
    throw error
  })
  return productionTemplate
}
