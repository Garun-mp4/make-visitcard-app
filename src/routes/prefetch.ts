export function prefetchOwnerRoutes(): void {
  void Promise.allSettled([
    import('@/pages/owner-home-page'),
    import('@/pages/editor/editor-index-page'),
    import('@/pages/editor/basic-editor-page'),
    import('@/pages/editor/contacts-editor-page'),
    import('@/pages/stats-page'),
    import('@/pages/profile-page'),
  ])
}
