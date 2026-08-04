import { createHmac, timingSafeEqual } from 'node:crypto'

import { telegramUserSchema } from '@shared/schemas'
import type { TelegramUser } from '@shared/types'
import { AppError } from '../utils/app-error.js'

export interface TelegramValidationResult {
  user: TelegramUser
  authDate: number
  queryId?: string
  startParam?: string
}

export function secureCompareHex(expected: string, actual: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(expected) || !/^[a-f0-9]{64}$/i.test(actual)) return false
  const left = Buffer.from(expected, 'hex')
  const right = Buffer.from(actual, 'hex')
  return left.length === right.length && timingSafeEqual(left, right)
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): TelegramValidationResult {
  if (!initData || initData.length > 16_384)
    throw new AppError(400, 'invalid_init_data', 'Некорректные данные Telegram')
  const params = new URLSearchParams(initData)
  const hash = params.get('hash') ?? ''
  params.delete('hash')
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  if (!secureCompareHex(expectedHash, hash))
    throw new AppError(401, 'invalid_telegram_signature', 'Не удалось подтвердить подпись Telegram')
  const authDate = Number(params.get('auth_date'))
  if (
    !Number.isInteger(authDate) ||
    authDate <= 0 ||
    authDate > nowSeconds + 30 ||
    nowSeconds - authDate > maxAgeSeconds
  )
    throw new AppError(401, 'expired_init_data', 'Сессия Telegram устарела')
  const rawUser = params.get('user')
  if (!rawUser)
    throw new AppError(400, 'missing_telegram_user', 'В данных Telegram отсутствует пользователь')
  let userValue: unknown
  try {
    userValue = JSON.parse(rawUser)
  } catch {
    throw new AppError(400, 'malformed_telegram_user', 'Некорректный профиль Telegram')
  }
  const user = telegramUserSchema.safeParse(userValue)
  if (!user.success)
    throw new AppError(400, 'malformed_telegram_user', 'Некорректный профиль Telegram')
  return {
    user: user.data,
    authDate,
    queryId: params.get('query_id') ?? undefined,
    startParam: params.get('start_param') ?? undefined,
  }
}
