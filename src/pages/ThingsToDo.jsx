/**
 * ThingsToDo.jsx — /p/:owner/:repo/todo (max-width 800px)
 *
 * A project's to-do list, which on GitHub is called Issues.
 *
 * This is the first thing in Yourkly that isn't stored in one browser. An
 * update lives in localStorage, which is why a project worked on all week can
 * open looking empty — the record was on a different machine. A thing to do
 * lives in GitHub: it survives a new laptop, and anyone you share the project
 * with can see it.
 *
 * Everything here came from GitHub and goes back to GitHub. Nothing is stored
 * locally, so there is nothing to fall out of step.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getIssues, createIssue, setIssueState } from '../api/github'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

export default function ThingsToDo({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth

  const [open, setOpen] = useState([])
  const [done, setDone] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDone, setShowDone] = useState(false)

  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(null)     // issue number being changed

  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      getIssues(token, owner, repo, 'open'),
      getIssues(token, owner, repo, 'closed'),
    ])
      .then(([o, c]) => { if (!cancelled) { setOpen(o); setDone(c) } })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  async function add(e) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setAdding(true)
    setError(null)
    try {
      const created = await createIssue(token, owner, repo, t, detail.trim())
      setOpen(list => [created, ...list])
      setTitle('')
      setDetail('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function move(issue, to) {
    setBusy(issue.number)
    setError(null)
    try {
      const changed = await setIssueState(token, owner, repo, issue.number, to)
      if (to === 'closed') {
        setOpen(l => l.filter(i => i.number !== issue.number))
        setDone(l => [changed, ...l])
      } else {
        setDone(l => l.filter(i => i.number !== issue.number))
        setOpen(l => [changed, ...l])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const Row = ({ issue, finished }) => (
    <div className={`todo-row${finished ? ' todo-row--done' : ''}`}>
      <div className="todo-row-text">
        <div className="todo-row-title">{issue.title}</div>
        <div className="todo-row-meta">
          {issue.user?.login === user?.login ? 'You' : issue.user?.login || 'Someone'}
          {' · '}
          {finished
            ? `finished ${timeAgo(issue.closed_at || issue.updated_at)}`
            : `added ${timeAgo(issue.created_at)}`}
          {issue.comments > 0 && ` · ${issue.comments} ${issue.comments === 1 ? 'comment' : 'comments'}`}
        </div>
      </div>
      <div className="todo-row-actions">
        <button
          className={finished ? 'pl-btn' : 'pl-btn-primary'}
          disabled={busy === issue.number}
          onClick={() => move(issue, finished ? 'open' : 'closed')}
        >
          {busy === issue.number
            ? 'Working…'
            : finished ? 'Put it back' : 'Mark as done'}
        </button>
        {issue.html_url && (
          <a href={issue.html_url} target="_blank" rel="noreferrer" className="text-link todo-row-link">
            Open on GitHub
          </a>
        )}
      </div>
    </div>
  )

  return (
    <div className="screen-padded todo-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="todo-title">Things to do</h1>
      <p className="todo-intro">
        A list of what still needs doing in this project. Unlike an update, this is kept in
        GitHub — so it's here on any computer you sign in from, and anyone you've shared the
        project with can see it too.
      </p>

      {error && <p className="error-box">{error}</p>}

      <form className="todo-add" onSubmit={add}>
        <input
          type="text"
          className="todo-add-title"
          placeholder="What needs doing?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          aria-label="What needs doing?"
        />
        <textarea
          className="todo-add-detail"
          placeholder="Any detail worth remembering (optional)"
          value={detail}
          onChange={e => setDetail(e.target.value)}
          aria-label="Detail"
        />
        <button className="pl-btn-primary" type="submit" disabled={adding || !title.trim()}>
          {adding ? 'Adding…' : 'Add to the list'}
        </button>
      </form>

      {loading && <p className="state-loading">Getting this project's list from GitHub…</p>}

      {!loading && !error && open.length === 0 && done.length === 0 && (
        <p className="todo-empty">
          Nothing on the list. Add the first thing above, and it's saved to GitHub straight
          away.
        </p>
      )}

      {!loading && open.length > 0 && (
        <>
          <div className="section-label todo-section">
            Still to do · {open.length}
          </div>
          <div className="todo-list">
            {open.map(i => <Row key={i.id} issue={i} finished={false} />)}
          </div>
        </>
      )}

      {!loading && done.length > 0 && (
        <>
          <div className="section-label todo-section">Finished · {done.length}</div>
          {!showDone ? (
            <button className="pl-btn" onClick={() => setShowDone(true)}>
              Show what's been finished
            </button>
          ) : (
            <div className="todo-list">
              {done.map(i => <Row key={i.id} issue={i} finished />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
