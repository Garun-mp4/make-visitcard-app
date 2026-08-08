import { useTranslation } from 'react-i18next'

export function useLocaleText() {
  const { i18n } = useTranslation()
  return (ru: string, en: string) => (i18n.language.startsWith('en') ? en : ru)
}
