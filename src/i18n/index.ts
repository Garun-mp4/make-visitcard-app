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
        mainNavigation: 'Основная навигация',
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
      home: {
        title: 'Визитка',
        draft: 'Черновик',
        published: 'Опубликовано',
        open: 'Открыть',
        edit: 'Изменить',
        next: 'Следующий шаг',
        nextDescription:
          'Добавьте ещё один проект или проверьте публикацию перед отправкой ссылки.',
        projects: 'Открыть проекты',
      },
      profile: {
        title: 'Профиль',
        telegramId: 'Telegram ID',
        language: 'Язык',
        premium: 'Premium',
        platform: 'Платформа',
        interfaceLanguage: 'Язык интерфейса',
        notifications: 'Уведомления',
        publicCard: 'Публичная визитка',
        copyLink: 'Скопировать ссылку',
        privacy:
          'Telegram ID и данные авторизации видны только вам. Публичные контакты настраиваются отдельно.',
        on: 'Вкл.',
        off: 'Выкл.',
      },
      feedback: {
        copied: 'Ссылка скопирована',
        shareOpened: 'Окно отправки открыто',
        copyBlocked: 'Копирование заблокировано браузером. Выделите ссылку вручную.',
        close: 'Закрыть',
        saveError: 'Не удалось сохранить изменения',
      },
      validation: {
        name: 'Проверьте имя',
        contact: 'Укажите Telegram или email',
        message: 'Напишите минимум 5 символов',
        unsafeUrl: 'Введите безопасную ссылку HTTPS, email или телефон',
      },
      publicCard: {
        skills: 'Навыки',
        services: 'Услуги',
        projects: 'Проекты',
        contacts: 'Контакты',
        discuss: 'Есть задача?',
        discussDescription: 'Оставьте короткую заявку — форма займёт меньше минуты.',
        write: 'Написать',
        close: 'Закрыть',
        formTitle: 'Обсудим задачу?',
        usuallyReplies: 'Обычно {{name}} отвечает в течение рабочего дня.',
        name: 'Имя',
        contact: 'Контакт',
        message: 'Сообщение',
        submit: 'Отправить заявку',
        submitting: 'Отправляем…',
        sent: 'Заявка отправлена',
        received: '{{name}} получил сообщение и сможет ответить по указанному контакту.',
        sendAgain: 'Отправить ещё одну',
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
        mainNavigation: 'Main navigation',
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
      home: {
        title: 'Card',
        draft: 'Draft',
        published: 'Published',
        open: 'Open',
        edit: 'Edit',
        next: 'Next step',
        nextDescription: 'Add another project or review publication before sharing the link.',
        projects: 'Open projects',
      },
      profile: {
        title: 'Profile',
        telegramId: 'Telegram ID',
        language: 'Language',
        premium: 'Premium',
        platform: 'Platform',
        interfaceLanguage: 'Interface language',
        notifications: 'Notifications',
        publicCard: 'Public card',
        copyLink: 'Copy link',
        privacy:
          'Your Telegram ID and authentication data are visible only to you. Public contacts are configured separately.',
        on: 'On',
        off: 'Off',
      },
      feedback: {
        copied: 'Link copied',
        shareOpened: 'Share dialog opened',
        copyBlocked: 'Copying is blocked by the browser. Select the link manually.',
        close: 'Close',
        saveError: 'Could not save changes',
      },
      validation: {
        name: 'Check the name',
        contact: 'Enter a Telegram username or email',
        message: 'Write at least 5 characters',
        unsafeUrl: 'Enter a safe HTTPS link, email, or phone number',
      },
      publicCard: {
        skills: 'Skills',
        services: 'Services',
        projects: 'Projects',
        contacts: 'Contacts',
        discuss: 'Have a project?',
        discussDescription: 'Leave a short request — it takes less than a minute.',
        write: 'Contact me',
        close: 'Close',
        formTitle: 'Discuss your project?',
        usuallyReplies: '{{name}} usually replies within one business day.',
        name: 'Name',
        contact: 'Contact',
        message: 'Message',
        submit: 'Send request',
        submitting: 'Sending…',
        sent: 'Request sent',
        received: '{{name}} received your message and can reply using the contact provided.',
        sendAgain: 'Send another',
      },
    },
  },
} as const

const storedLocale =
  typeof localStorage === 'undefined' ? null : localStorage.getItem('cardly-locale')
const browserLocale =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')
    ? 'en'
    : 'ru'

void i18n.use(initReactI18next).init({
  resources,
  lng:
    storedLocale === 'en' || storedLocale === 'ru'
      ? storedLocale
      : browserLocale || clientEnv.defaultLocale,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined')
  document.documentElement.lang = i18n.language.startsWith('en') ? 'en' : 'ru'

export function changeLocale(locale: 'ru' | 'en') {
  if (typeof localStorage !== 'undefined') localStorage.setItem('cardly-locale', locale)
  if (typeof document !== 'undefined') document.documentElement.lang = locale
  return i18n.changeLanguage(locale)
}

export default i18n
