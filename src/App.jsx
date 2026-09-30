import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './hooks/useAuth'

// Layout
import AppShell from './components/AppShell'
import BrandWordmark from './components/BrandWordmark'

// Auth pages (no shell)
import AuthCallback from './pages/AuthCallback'
import Welcome      from './pages/Welcome'
import NativeNewProject from './pages/NativeNewProject'
import NativeProjects from './pages/NativeProjects'
import NativeProjectHome from './pages/NativeProjectHome'

// Global pages
import Home        from './pages/Home'
import Projects    from './pages/Projects'
import Activity    from './pages/Activity'
import Account     from './pages/Account'
import NewProject  from './pages/NewProject'
import ChooseProjects from './pages/ChooseProjects'
import Help        from './pages/Help'

// Project pages
import ProjectHome    from './pages/ProjectHome'
import Updates        from './pages/Updates'
import ThingsToDo     from './pages/ThingsToDo'
import NewUpdate      from './pages/NewUpdate'
import ProjectFiles   from './pages/ProjectFiles'
import FileEditor     from './pages/FileEditor'
import ReviewAndSave  from './pages/ReviewAndSave'
import WhatChanged    from './pages/WhatChanged'
import SavePoints     from './pages/SavePoints'
import Versions       from './pages/Versions'
import Publish        from './pages/Publish'
import Share          from './pages/Share'
import Settings       from './pages/Settings'
import ProfilePreview from './pages/ProfilePreview'

// Update pages
import UpdateWorkspace  from './pages/UpdateWorkspace'
import ContinueWithAI   from './pages/ContinueWithAI'
import ReturnFromAI     from './pages/ReturnFromAI'
import ReviewAIChanges  from './pages/ReviewAIChanges'

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The old per-file history screen lived at .../h/*. Save Points covers it now,
 * so old links land there instead of nowhere.
 */
function RedirectToSavePoints() {
  const { owner, repo } = useParams()
  return <Navigate to={`/p/${owner}/${repo}/points`} replace />
}

/**
 * Wraps a page in AppShell. Redirects to "/" if not authenticated.
 */
function Protected({ auth, children }) {
  if (!auth.token) return <Navigate to="/" replace />
  return <AppShell auth={auth}>{children}</AppShell>
}

/**
 * Every page name that can follow a project in the URL. Used to tell the old
 * link shape from the new one — see ProjectArea.
 */
const PROJECT_PAGES = new Set([
  'updates', 'todo', 'new-update', 'files', 'f', 'save', 'changed', 'points',
  'versions', 'publish', 'share', 'settings', 'ai', 'u', 'h',
])

/**
 * Everything under /p/.
 *
 * Project URLs carry the owner — /p/:owner/:repo — because a project shared
 * with you, or owned by a team, belongs to somebody else, and every GitHub
 * call needs to know whose. Links made before that change carry only the repo,
 * so those are recognised and redirected rather than 404ing.
 *
 * Telling the two apart: /p/a/b is the old shape when `b` is a page name, and
 * the new shape otherwise. The one genuinely ambiguous case is a project
 * actually named "settings" or "files" — resolved by treating a first segment
 * that matches the signed-in user as the new shape, which it always is.
 */
function ProjectArea({ auth }) {
  const { pathname } = useLocation()
  const login = auth.user?.login
  const parts = pathname.replace(/^\/p\/?/, '').split('/').filter(Boolean)

  const looksOld =
    parts.length > 0 &&
    parts[0] !== login &&
    (parts.length === 1 || PROJECT_PAGES.has(parts[1]))

  if (looksOld && login) {
    return <Navigate to={`/p/${login}/${parts.join('/')}`} replace />
  }

  return (
    <Routes>
      <Route path=":owner/:repo"             element={<Protected auth={auth}><ProjectHome    auth={auth} /></Protected>} />
      <Route path=":owner/:repo/updates"     element={<Protected auth={auth}><Updates        auth={auth} /></Protected>} />
      <Route path=":owner/:repo/todo"        element={<Protected auth={auth}><ThingsToDo     auth={auth} /></Protected>} />
      <Route path=":owner/:repo/new-update"  element={<Protected auth={auth}><NewUpdate      auth={auth} /></Protected>} />
      <Route path=":owner/:repo/files"       element={<Protected auth={auth}><ProjectFiles   auth={auth} /></Protected>} />
      <Route path=":owner/:repo/f/*"         element={<Protected auth={auth}><FileEditor     auth={auth} /></Protected>} />
      <Route path=":owner/:repo/save"        element={<Protected auth={auth}><ReviewAndSave  auth={auth} /></Protected>} />
      <Route path=":owner/:repo/changed"     element={<Protected auth={auth}><WhatChanged    auth={auth} /></Protected>} />
      <Route path=":owner/:repo/points"      element={<Protected auth={auth}><SavePoints     auth={auth} /></Protected>} />
      <Route path=":owner/:repo/versions"    element={<Protected auth={auth}><Versions       auth={auth} /></Protected>} />
      <Route path=":owner/:repo/publish"     element={<Protected auth={auth}><Publish        auth={auth} /></Protected>} />
      <Route path=":owner/:repo/share"       element={<Protected auth={auth}><Share          auth={auth} /></Protected>} />
      <Route path=":owner/:repo/settings"    element={<Protected auth={auth}><Settings       auth={auth} /></Protected>} />
      <Route path=":owner/:repo/ai"          element={<Protected auth={auth}><ContinueWithAI auth={auth} /></Protected>} />
      <Route path=":owner/:repo/h/*"         element={<RedirectToSavePoints />} />

      <Route path=":owner/:repo/u/:updateId"        element={<Protected auth={auth}><UpdateWorkspace auth={auth} /></Protected>} />
      <Route path=":owner/:repo/u/:updateId/ai"     element={<Protected auth={auth}><ContinueWithAI  auth={auth} /></Protected>} />
      <Route path=":owner/:repo/u/:updateId/return" element={<Protected auth={auth}><ReturnFromAI    auth={auth} /></Protected>} />
      <Route path=":owner/:repo/u/:updateId/review" element={<Protected auth={auth}><ReviewAIChanges auth={auth} /></Protected>} />

      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="loading-screen">
        <BrandWordmark className="brand-wordmark--loading" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth (no shell) ─────────────────────────────────────── */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/profile-preview" element={<ProfilePreview auth={auth} />} />

        {/* ── Native: no GitHub, same shell ─────────────────────────── */}
        <Route path="/native/new" element={<AppShell auth={auth} native><NativeNewProject /></AppShell>} />
        <Route path="/native/projects" element={<AppShell auth={auth} native><NativeProjects /></AppShell>} />
        <Route path="/native/p/:id" element={<AppShell auth={auth} native><NativeProjectHome /></AppShell>} />

        {/* ── Root ───────────────────────────────────────────────── */}
        <Route
          path="/"
          element={
            auth.token
              ? <Protected auth={auth}><Home auth={auth} /></Protected>
              : <Welcome />
          }
        />

        {/* ── Global pages ────────────────────────────────────────── */}
        <Route path="/projects"        element={<Protected auth={auth}><Projects       auth={auth} /></Protected>} />
        <Route path="/projects/choose" element={<Protected auth={auth}><ChooseProjects auth={auth} /></Protected>} />
        <Route path="/activity"  element={<Protected auth={auth}><Activity  auth={auth} /></Protected>} />
        <Route path="/account"   element={<Protected auth={auth}><Account   auth={auth} /></Protected>} />
        <Route path="/new"       element={<Protected auth={auth}><NewProject auth={auth} /></Protected>} />
        {/* Help is a section: one page, six routes, so every topic is linkable. */}
        {/* Help is readable by everyone: native (no-GitHub) users get the same
            shell, and the shell's Help link must work for them. Help takes no
            auth-dependent props. The shell adapts: GitHub users get GitHub
            nav, everyone else gets the native destinations. */}
        <Route path="/help"                 element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />
        <Route path="/help/how-it-works"    element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />
        <Route path="/help/tasks"           element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />
        <Route path="/help/glossary"        element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />
        <Route path="/help/troubleshooting" element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />
        <Route path="/help/contact"         element={<AppShell auth={auth} native={!auth.token}><Help auth={auth} /></AppShell>} />

        {/* ── Everything about a project ──────────────────────────── */}
        <Route path="/p/*" element={<ProjectArea auth={auth} />} />

        {/* ── Catch-all ───────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}
