import { toBuffer } from 'qrcode'

export async function renderQrPng(value: string): Promise<Buffer> {
  return toBuffer(value, {
    type: 'png',
    errorCorrectionLevel: 'H',
    width: 1024,
    margin: 4,
    color: {
      dark: '#183d2e',
      light: '#ffffffff',
    },
  })
}
