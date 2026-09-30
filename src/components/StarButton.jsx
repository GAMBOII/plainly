/**
 * StarButton.jsx — starring a project.
 *
 * A star is GitHub's "this one matters to me". Other people's stars are a
 * public count; your own is a toggle.
 *
 * Three states, not two. Whether *you* have starred it is a separate request,
 * and until it answers Yourkly doesn't know — so the button says "Star" with
 * nothing filled in rather than guessing, and if the check fails it stays
 * honest instead of showing an empty star that might be wrong.
 */

import { useState, useEffect } from 'react'
import { isStarred, setStarred } from '../api/github'

export default function StarButton({ auth, owner, repo, count }) {
  const { token } = auth
  const [starred, setLocal] = useState(null)   // null = don't know yet
  const [working, setWorking] = useState(false)
  const [bump, setBump] = useState(0)          // our own change to the count

  useEffect(() => {
    if (!token || !owner || !repo) return
    let cancelled = false
    isStarred(token, owner, repo).then(s => { if (!cancelled) setLocal(s) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  async function toggle() {
    if (starred === null) return              // don't act on an unknown state
    setWorking(true)
    try {
      await setStarred(token, owner, repo, !starred)
      setBump(b => b + (starred ? -1 : 1))
      setLocal(!starred)
    } catch { /* leave it as it was; nothing on screen becomes untrue */ } finally {
      setWorking(false)
    }
  }

  const shown = typeof count === 'number' ? count + bump : null

  return (
    <button
      className={`star${starred ? ' star--on' : ''}`}
      onClick={toggle}
      disabled={working || starred === null}
      aria-pressed={starred === true}
      title={starred === null ? "Yourkly hasn't checked whether you've starred this yet" : undefined}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
           fill={starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8"
           strokeLinejoin="round">
        <path d="m12 3.6 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8l5.9-.9z" />
      </svg>
      <span>{starred ? 'Starred' : 'Star'}</span>
      {shown !== null && shown > 0 && <span className="star-count">{shown}</span>}
    </button>
  )
}
