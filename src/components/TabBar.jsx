/**
 * TabBar.jsx — the bottom bar on phones.
 *
 * Four destinations, always visible, one tap each. It replaces the "Menu"
 * button, which was one tap further from everything and gave no sense of where
 * you were.
 *
 * Account isn't a tab: it's the avatar in the top bar, which is where an
 * account lives in every phone app people already use.
 *
 * Icons are inline SVG rather than a font or a package — four small shapes
 * aren't worth a dependency, and `currentColor` means they take the purple of
 * the active tab without any extra rules. Hidden from screen readers; the
 * label beside them is the real name.
 */

import { NavLink } from 'react-router-dom'

const Icon = ({ d, filled }) => (
  <svg
    className="tab-icon"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
)

const TABS = [
  { to: '/',         end: true, label: 'Home',
    d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/projects',            label: 'Projects',
    d: 'M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { to: '/activity',            label: 'Timeline',
    d: 'M3 12h4l2.5-7 4 14L16 12h5' },
  { to: '/help',                label: 'Help',
    d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 9.2A2.6 2.6 0 0 1 14.5 10c0 1.7-2.5 2-2.5 3.6M12 17h.01' },
]

// Native (no-GitHub) users get the same bar with destinations that exist for
// them. Timeline and the account avatar are GitHub-only.
const TABS_NATIVE = [
  { to: '/native/projects', end: true, label: 'Home',
    d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/native/new',                  label: 'New',
    d: 'M12 5v14M5 12h14' },
  { to: '/help',                        label: 'Help',
    d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 9.2A2.6 2.6 0 0 1 14.5 10c0 1.7-2.5 2-2.5 3.6M12 17h.01' },
]

export default function TabBar({ native }) {
  const tabs = native ? TABS_NATIVE : TABS
  return (
    <nav className="tabbar" aria-label="Sections">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => (isActive ? 'tab tab--on' : 'tab')}
        >
          {({ isActive }) => (
            <>
              <Icon d={t.d} filled={isActive && t.label === 'Home'} />
              <span className="tab-label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
