import { readFile } from 'node:fs/promises'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let environment: RulesTestEnvironment

describe('Firestore rules', () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'cardly-test',
      firestore: { rules: await readFile('firestore.rules', 'utf8') },
    })
  })
  beforeEach(() => environment.clearFirestore())
  afterAll(() => environment.cleanup())

  it('allows an owner to read and write their draft', async () => {
    const db = environment.authenticatedContext('owner-a').firestore()
    const card = doc(db, 'cards/owner-a')
    await assertSucceeds(setDoc(card, { ownerUid: 'owner-a', profile: {} }))
    await assertSucceeds(getDoc(card))
    await assertSucceeds(deleteDoc(card))
  })

  it('denies another user access to a draft', async () => {
    await environment.withSecurityRulesDisabled((context) =>
      setDoc(doc(context.firestore(), 'cards/owner-a'), { ownerUid: 'owner-a' }),
    )
    await assertFails(
      getDoc(doc(environment.authenticatedContext('owner-b').firestore(), 'cards/owner-a')),
    )
  })

  it('denies client writes to public, stats and rate limits', async () => {
    const db = environment.authenticatedContext('owner-a').firestore()
    await assertFails(setDoc(doc(db, 'publicCards/alexey'), { profile: {} }))
    await assertFails(setDoc(doc(db, 'cardStats/owner-a'), { totalViews: 1 }))
    await assertFails(setDoc(doc(db, 'rateLimits/key'), { count: 1 }))
  })

  it('lets owners read only their leads and denies unknown paths', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'leads/a'), { ownerUid: 'owner-a' })
      await setDoc(doc(context.firestore(), 'leads/b'), { ownerUid: 'owner-b' })
    })
    const db = environment.authenticatedContext('owner-a').firestore()
    await assertSucceeds(getDoc(doc(db, 'leads/a')))
    await assertFails(getDoc(doc(db, 'leads/b')))
    await assertFails(getDoc(doc(db, 'unknown/value')))
  })
})
