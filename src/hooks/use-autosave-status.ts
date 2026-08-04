import { useCardStore } from '@/app/card-store'

export function useAutosaveStatus() {
  const { saveNow, saveStatus } = useCardStore()
  return { saveStatus, retry: saveNow }
}
