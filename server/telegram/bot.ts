import { requireServerEnv } from '../config/server-env.js'

export function escapeTelegramHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function notifyLeadOwner(input: {
  telegramId: string
  slug: string
  name: string
  contact: string
  message: string
  createdAt: string
}) {
  const { TELEGRAM_BOT_TOKEN } = requireServerEnv('TELEGRAM_BOT_TOKEN')
  const text = [
    `<b>Новая заявка · ${escapeTelegramHtml(input.slug)}</b>`,
    `<b>Имя:</b> ${escapeTelegramHtml(input.name)}`,
    `<b>Контакт:</b> ${escapeTelegramHtml(input.contact)}`,
    `<b>Сообщение:</b> ${escapeTelegramHtml(input.message)}`,
    `<b>Дата:</b> ${escapeTelegramHtml(input.createdAt)}`,
  ].join('\n')
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: input.telegramId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(4500),
  })
  if (!response.ok) throw new Error(`Telegram Bot API returned ${response.status}`)
}
