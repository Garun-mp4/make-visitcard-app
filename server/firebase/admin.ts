import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

import { getServerEnv, normalizePrivateKey, requireServerEnv } from '../config/server-env.js'

function initializeAdminApp(): App {
  if (getApps().length > 0) return getApp()
  const env = getServerEnv()
  if (env.USE_FIREBASE_EMULATORS === 'true') {
    process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099'
    process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199'
    return initializeApp({
      credential: applicationDefault(),
      projectId: env.FIREBASE_ADMIN_PROJECT_ID ?? 'cardly-demo',
      storageBucket: env.FIREBASE_ADMIN_STORAGE_BUCKET ?? 'cardly-demo.appspot.com',
    })
  }
  const required = requireServerEnv(
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_ADMIN_STORAGE_BUCKET',
  )
  return initializeApp({
    credential: cert({
      projectId: required.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: required.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(required.FIREBASE_ADMIN_PRIVATE_KEY),
    }),
    projectId: required.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: required.FIREBASE_ADMIN_STORAGE_BUCKET,
  })
}

export function getAdminServices() {
  const app = initializeAdminApp()
  return { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) }
}
