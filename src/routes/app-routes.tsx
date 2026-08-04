import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { clientEnv } from '@/config/client-env'
import { telegram } from '@/lib/telegram'
import { OwnerLayout } from '@/layouts/owner-layout'
import { PageSkeleton } from '@/components/feedback/page-skeleton'
import { BrowserOwnerBlockPage } from '@/pages/browser-owner-block-page'

const LaunchPage = lazy(() => import('@/pages/launch-page'))
const OnboardingPage = lazy(() => import('@/pages/onboarding-page'))
const OwnerHomePage = lazy(() => import('@/pages/owner-home-page'))
const EditorIndexPage = lazy(() => import('@/pages/editor/editor-index-page'))
const BasicEditorPage = lazy(() => import('@/pages/editor/basic-editor-page'))
const ContactsEditorPage = lazy(() => import('@/pages/editor/contacts-editor-page'))
const SkillsEditorPage = lazy(() => import('@/pages/editor/skills-editor-page'))
const ServicesEditorPage = lazy(() => import('@/pages/editor/services-editor-page'))
const ProjectsEditorPage = lazy(() => import('@/pages/editor/projects-editor-page'))
const AppearanceEditorPage = lazy(() => import('@/pages/editor/appearance-editor-page'))
const PublicationPage = lazy(() => import('@/pages/publication-page'))
const StatsPage = lazy(() => import('@/pages/stats-page'))
const ProfilePage = lazy(() => import('@/pages/profile-page'))
const PublicCardPage = lazy(() => import('@/pages/public-card-page'))
const NotFoundPage = lazy(() => import('@/pages/not-found-page'))

function OwnerGuard() {
  if (!clientEnv.demoMode && !telegram.available) return <BrowserOwnerBlockPage />
  return <OwnerLayout />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<LaunchPage />} />
        <Route
          path="/app/onboarding"
          element={
            clientEnv.demoMode || telegram.available ? (
              <OnboardingPage />
            ) : (
              <BrowserOwnerBlockPage />
            )
          }
        />
        <Route path="/app" element={<OwnerGuard />}>
          <Route index element={<Navigate to="card" replace />} />
          <Route path="card" element={<OwnerHomePage />} />
          <Route path="editor" element={<EditorIndexPage />} />
          <Route path="editor/basic" element={<BasicEditorPage />} />
          <Route path="editor/contacts" element={<ContactsEditorPage />} />
          <Route path="editor/skills" element={<SkillsEditorPage />} />
          <Route path="editor/services" element={<ServicesEditorPage />} />
          <Route path="editor/projects" element={<ProjectsEditorPage />} />
          <Route path="editor/appearance" element={<AppearanceEditorPage />} />
          <Route path="editor/publish" element={<PublicationPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="/c/:slug" element={<PublicCardPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
