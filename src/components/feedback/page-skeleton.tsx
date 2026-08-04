export function PageSkeleton() {
  return (
    <main className="app-shell owner-mobile-content animate-pulse" aria-label="Загрузка">
      <div className="my-6 h-8 w-36 rounded-lg bg-[var(--surface-secondary)]" />
      <div className="grid gap-3">
        <div className="h-28 rounded-2xl bg-[var(--surface-secondary)]" />
        <div className="h-48 rounded-2xl bg-[var(--surface-secondary)]" />
        <div className="h-12 rounded-xl bg-[var(--surface-secondary)]" />
      </div>
    </main>
  )
}
