import { readFile } from 'node:fs/promises'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { afterAll, beforeAll, describe, it } from 'vitest'

let environment: RulesTestEnvironment
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

describe('Storage rules', () => {
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: 'cardly-test',
      storage: { rules: await readFile('storage.rules', 'utf8') },
    })
  })
  afterAll(() => environment.cleanup())

  it('allows the owner to upload and delete supported images', async () => {
    const storage = environment.authenticatedContext('owner-a').storage()
    const image = ref(storage, 'users/owner-a/avatar/photo.jpg')
    await assertSucceeds(uploadBytes(image, jpeg, { contentType: 'image/jpeg' }))
    await assertSucceeds(deleteObject(image))
  })

  it('denies another UID, SVG, oversized and unknown paths', async () => {
    const storage = environment.authenticatedContext('owner-a').storage()
    await assertFails(
      uploadBytes(ref(storage, 'users/owner-b/avatar/photo.jpg'), jpeg, {
        contentType: 'image/jpeg',
      }),
    )
    await assertFails(
      uploadBytes(ref(storage, 'users/owner-a/avatar/icon.svg'), jpeg, {
        contentType: 'image/svg+xml',
      }),
    )
    await assertFails(
      uploadBytes(
        ref(storage, 'users/owner-a/project/large.jpg'),
        new Uint8Array(5 * 1024 * 1024 + 1),
        {
          contentType: 'image/jpeg',
        },
      ),
    )
    await assertFails(
      uploadBytes(ref(storage, 'other/photo.jpg'), jpeg, { contentType: 'image/jpeg' }),
    )
  })
})
