/**
 * AppShell.jsx
 *
 * App-level layout: 248px sticky left sidebar + scrollable content area.
 * Every signed-in route renders inside this shell.
 *
 * The `native` prop switches the shell to the no-GitHub experience: the same
 * sidebar, top bar, and tab bar, with destinations that exist for native
 * users (Home is their project list; Recent Activity and Account are
 * GitHub-only and hidden). The footer reads "Kept in this browser" instead
 * of showing a GitHub identity.
 *
 * Sidebar sections:
 *   - Wordmark + tagline
 *   - Global nav: Home · My Projects · Recent Activity · Account · Help
 *   - Help topics (only when inside /help): the six Help sections
 *   - Project nav (only when inside /p/:repo): Project Home · Updates ·
 *     Things to Do · Make an Update · Project Files · What Changed ·
 *     Save Points ·
 *     Separate Versions · Who Can See It · Continue with AI · Settings
 *   - Footer: avatar + GitHub login + connection status
 *
 * This is the only navigation in the app. No page renders one of its own.
 */

import { NavLink, useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { getActiveUpdate } from '../utils/updateMemory'
import { nativeProject } from '../utils/nativeProjectStore'
import { projectName } from '../utils/projectName'
import { projectNavItems } from '../utils/projectNav'
import { SECTIONS as HELP_SECTIONS } from '../help/content'
import TabBar from './TabBar'
import BrandWordmark from './BrandWordmark'

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        isActive ? 'shell-nav-item shell-nav-item--active' : 'shell-nav-item'
      }
    >
      {label}
    </NavLink>
  )
}

export default function AppShell({ auth, children, native }) {
  const { owner, repo, id } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // If the :repo param is present, we're inside a project
  const inProject = Boolean(owner && repo)
  // Help opens its own topic list, the same way a project opens its own nav.
  const inHelp = pathname === '/help' || pathname.startsWith('/help/')
  const isHome = pathname === '/'
  const isNativeHome = pathname === '/native/projects'
  // Native project name for the phone top bar. Guarded: the store reads
  // localStorage, which can be blocked.
  let nativeProjectName = null
  if (native && id) {
    try { nativeProjectName = nativeProject(id)?.name || null } catch { /* no project */ }
  }
  const mobileTitle = native && nativeProjectName ? nativeProjectName
    : pathname === '/native/projects' ? 'Projects'
      : pathname === '/native/new' ? 'New project'
        : inProject
          ? projectName(repo)
          : pathname.startsWith('/projects') ? 'Projects'
            : pathname.startsWith('/activity') ? 'Timeline'
              : pathname.startsWith('/help') ? 'Help'
                : pathname.startsWith('/account') ? 'Account'
                  : 'yourkly'

  const user = auth?.user
  const avatarUrl = user?.avatar_url
  const login = user?.login

  const activeUpdate = inProject ? getActiveUpdate(owner, repo) : null

  return (
    <div className="shell">
      {/* Phones only. Avatar to Account on the left, the way every phone app
          people already use puts an account there; add a project on the right. */}
      <div className="shell-mobilebar">
        {native ? (
          isNativeHome ? (
            <span className="shell-mobilebar-spacer" aria-hidden="true" />
          ) : (
            <button className="shell-mobilebar-back" onClick={() => navigate(-1)} aria-label="Go back" type="button">‹</button>
          )
        ) : isHome ? (
          <Link to="/account" className="shell-mobilebar-avatar" aria-label="Account">
            {avatarUrl
              ? <img src={avatarUrl} alt="" width={34} height={34} />
              : <span className="shell-mobilebar-initial">{(login || '?')[0].toUpperCase()}</span>}
          </Link>
        ) : (
          <button className="shell-mobilebar-back" onClick={() => navigate(-1)} aria-label="Go back" type="button">‹</button>
        )}
        <Link to={native ? '/native/projects' : isHome ? '/' : pathname} className="shell-mobilebar-brand" aria-label={isNativeHome || isHome ? 'Yourkly home' : mobileTitle}>
          {isNativeHome || isHome
            ? <BrandWordmark className="brand-wordmark--mobile" />
            : <span className="shell-mobilebar-title">{mobileTitle}</span>}
          {!isNativeHome && !isHome && <span className="shell-mobilebar-subtitle">Your work, made clear.</span>}
        </Link>
        <Link to={native ? '/native/new' : '/new'} className="shell-mobilebar-add" aria-label="Start a new project">+</Link>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <nav id="yourkly-nav" className="shell-sidebar" aria-label="Main navigation">
        {/* Wordmark */}
        <Link to={native ? '/native/projects' : '/'} className="shell-wordmark" aria-label="Yourkly home">
          <BrandWordmark className="brand-wordmark--sidebar" />
          <span className="shell-tagline">Your work, made clear.</span>
        </Link>

        {/* Global nav.
            Native (no-GitHub) users get the same shell with destinations that
            exist for them: Recent Activity and Account are GitHub-only, and
            Home is their project list. */}
        <div className="shell-nav-group">
          {native ? (
            <>
              <NavItem to="/native/projects" end label="Home" />
              <NavItem to="/native/new" label="New project" />
              <NavItem to="/help" label="Help" />
            </>
          ) : (
            <>
              <NavItem to="/" end label="Home" />
              <NavItem to="/projects" label="My Projects" />
              <NavItem to="/activity" label="Recent Activity" />
              <NavItem to="/account" label="Account" />
              <NavItem to="/help" label="Help" />
            </>
          )}
        </div>

        {/* Help topics — only while you're in Help */}
        {inHelp && (
          <div className="shell-nav-group">
            <p className="shell-nav-heading">Help topics</p>
            {HELP_SECTIONS.map(s => (
              <NavItem key={s.path} to={s.path} end={s.path === '/help'} label={s.label} />
            ))}
          </div>
        )}

        {/* Project nav — only when inside /p/:repo */}
        {inProject && (
          <div className="shell-nav-group">
            <p className="shell-nav-heading">
              {projectName(repo)}
              {/* Whose it is, but only when that isn't obvious. */}
              {owner !== login && <span className="shell-nav-owner">{owner}</span>}
            </p>
            {projectNavItems(owner, repo, activeUpdate).map(item => (
              <NavItem key={item.to} to={item.to} end={item.end} label={item.label} />
            ))}
          </div>
        )}

        {/* Sidebar footer */}
        <div className="shell-footer">
          {native ? (
            <div className="shell-footer-text">
              <span className="shell-footer-status">Kept in this browser</span>
            </div>
          ) : (
            <>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={login ? `${login}'s avatar` : 'Your avatar'}
                  className="shell-avatar"
                  width={32}
                  height={32}
                />
              )}
              <div className="shell-footer-text">
                {login && <span className="shell-footer-login">{login}</span>}
                <span className="shell-footer-status">GitHub connected</span>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ── Content area ──────────────────────────────────────────────── */}
      <main className="shell-content">
        {children}
      </main>

      {/* Phones only. Hidden with display:none on a desktop, which takes it out
          of the accessibility tree too, so only one navigation is ever live. */}
      <TabBar native={native} />
    </div>
  )
}
