/**
 * settings.js
 *
 * Small app preferences, kept in localStorage.
 *
 * showGithubWords: when on, screens print the real GitHub term in grey beside
 * Yourkly's plain-English label (HANDOFF §7.19). GitHub's words are always
 * secondary — never a button label (§8).
 */

import { useEffect, useState } from 'react'

const KEY = 'plainly_show_github_words'

export function getShowGithubWords() {
  try {
    return localStorage.getItem(KEY) === 'true'
  } catch {
    return false
  }
}

export function useShowGithubWords() {
  const [on, setOn] = useState(getShowGithubWords)

  useEffect(() => {
    // Keep other tabs and other screens in step.
    const sync = () => setOn(getShowGithubWords())
    window.addEventListener('storage', sync)
    window.addEventListener('plainly:settings', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('plainly:settings', sync)
    }
  }, [])

  const toggle = () => {
    const next = !on
    try {
      localStorage.setItem(KEY, String(next))
    } catch { /* preference just won't persist */ }
    setOn(next)
    window.dispatchEvent(new Event('plainly:settings'))
  }

  return [on, toggle]
}
