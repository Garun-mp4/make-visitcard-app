import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { clientEnv } from '@/config/client-env'

const resources = {
  ru: {
    translation: {
      nav: { card: 'Визитка', editor: 'Редактор', stats: 'Статистика', profile: 'Профиль' },
      common: {
        save: 'Сохранить',
        saved: 'Сохранено',
        saving: 'Сохраняем…',
        retry: 'Повторить',
        preview: 'Предпросмотр',
        continue: 'Продолжить',
        back: 'Назад',
        add: 'Добавить',
        delete: 'Удалить',
        publish: 'Опубликовать',
        share: 'Поделиться',
        copy: 'Скопировать',
      },
      editor: {
        title: 'Редактор',
        basic: 'Основное',
        contacts: 'Контакты',
        skills: 'Навыки',
        services: 'Услуги',
        projects: 'Проекты',
        appearance: 'Оформление',
        publication: 'Публикация',
      },
      states: {
        offline: 'Нет подключения к сети',
        error: 'Что-то пошло не так',
        notFound: 'Страница не найдена',
        openTelegram: 'Откройте Cardly в Telegram, чтобы управлять визиткой.',
      },
    },
  },
  en: {
    translation: {
      nav: { card: 'Card', editor: 'Editor', stats: 'Statistics', profile: 'Profile' },
      common: {
        save: 'Save',
        saved: 'Saved',
        saving: 'Saving…',
        retry: 'Retry',
        preview: 'Preview',
        continue: 'Continue',
        back: 'Back',
        add: 'Add',
        delete: 'Delete',
        publish: 'Publish',
        share: 'Share',
        copy: 'Copy',
      },
      editor: {
        title: 'Editor',
        basic: 'Basic',
        contacts: 'Contacts',
        skills: 'Skills',
        services: 'Services',
        projects: 'Projects',
        appearance: 'Appearance',
        publication: 'Publication',
      },
      states: {
        offline: 'You are offline',
        error: 'Something went wrong',
        notFound: 'Page not found',
        openTelegram: 'Open Cardly in Telegram to manage your card.',
      },
    },
  },
} as const

const storedLocale = localStorage.getItem('cardly-locale')
const browserLocale = navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ru'

void i18n.use(initReactI18next).init({
  resources,
  lng:
    storedLocale === 'en' || storedLocale === 'ru'
      ? storedLocale
      : browserLocale || clientEnv.defaultLocale,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language.startsWith('en') ? 'en' : 'ru'

export function changeLocale(locale: 'ru' | 'en') {
  localStorage.setItem('cardly-locale', locale)
  document.documentElement.lang = locale
  return i18n.changeLanguage(locale)
}

export default i18n
