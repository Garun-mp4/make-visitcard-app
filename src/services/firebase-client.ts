import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

import { assertFirebaseClientConfig, clientEnv } from '@/config/client-env'

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  storage: FirebaseStorage
}

let services: FirebaseServices | null = null
let emulatorsConnected = false

export function getFirebaseServices(): FirebaseServices {
  if (services) return services
  assertFirebaseClientConfig()
  const app = getApps().length > 0 ? getApp() : initializeApp(clientEnv.firebase)
  services = { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) }

  if (clientEnv.useFirebaseEmulators && !emulatorsConnected) {
    connectAuthEmulator(services.auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(services.db, '127.0.0.1', 8080)
    connectStorageEmulator(services.storage, '127.0.0.1', 9199)
    emulatorsConnected = true
  }
  return services
}
