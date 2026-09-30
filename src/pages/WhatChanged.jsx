/**
 * WhatChanged.jsx — /p/:repo/changed (max-width 800px)
 *
 * Every Save Point, newest first, in the words it was written in
 * (HANDOFF §7.12). Never leads with a hash: GitHub's words live behind
 * "See details", or inline when the Account setting asks for them.
 *
 * Three things per row and no more — title, one line, meta. This screen used
 * to print the whole commit body as the summary, trailers and all, which for
 * any real project is a wall of text. splitCommitMessage() decides what is
 * worth showing first; everything else moves into the details panel.
 *
 * The file list is fetched only when a row is opened. Knowing it up front
 * would cost one request per Save Point, and a guessed count is worse than
 * no count.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCommits, getCommitDetails, getSavePointCount } from '../api/github'
import { timeAgo } from '../utils/time'
import { splitCommitMessage, commitAuthor } from '../utils/commitText'
import { projectName } from '../utils/projectName'
import { useShowGithubWords } from '../utils/settings'

export default function WhatChanged({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth
  const [showWords] = useShowGithubWords()

  const [commits, setCommits] = useState([])
  const [total, setTotal]     = useState(null)   // null = couldn't count
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [open, setOpen]       = useState(null)
  const [files, setFiles]     = useState({})     // sha → string[] | 'loading' | null

  useEffect(() => {
    if (!token || !owner) return
    getCommits(token, owner, repo, 30)
      .then(setCommits)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  // Separate, and allowed to fail: a missing count costs a version number,
  // not the screen.
  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    getSavePointCount(token, owner, repo).then(n => { if (!cancelled) setTotal(n) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  async function toggle(sha) {
    if (open === sha) { setOpen(null); return }
    setOpen(sha)
    if (files[sha] !== undefined) return          // already fetched, or failed
    setFiles(f => ({ ...f, [sha]: 'loading' }))
    const detail = await getCommitDetails(token, owner, repo, sha)
    setFiles(f => ({
      ...f,
      [sha]: detail?.files ? detail.files.map(x => x.filename) : null,
    }))
  }

  return (
    <div className="screen-padded changed-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="changed-title">What changed</h1>
      <p className="changed-intro">
        Every Save Point in this project, newest first — written the way you wrote it, not in
        GitHub's words.
      </p>

      {loading && <p className="state-loading">Getting your Save Points from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}
      {!loading && !error && commits.length === 0 && (
        <p className="changed-empty">
          No Save Points yet. The first time you save, it shows up here.
        </p>
      )}

      <div className="changed-list">
        {commits.map((c, i) => {
          const { title, summary, body } = splitCommitMessage(c.commit?.message)
          const who = commitAuthor(c, user?.login)
          const when = c.commit?.author?.date
          // Page one, newest first — so the top row is the newest Save Point.
          const version = total ? total - i : null
          const isOpen = open === c.sha
          const theseFiles = files[c.sha]

          return (
            <div key={c.sha} className="changed-entry">
              <div className="changed-entry-main">
                <div className="changed-entry-text">
                  <div className="changed-entry-title">{title}</div>
                  {summary && <div className="changed-entry-summary">{summary}</div>}
                  <div className="changed-entry-meta">
                    {who} · {when ? timeAgo(when) : 'date unknown'}
                    {version > 0 ? <> · v{version}</> : null}
                    {showWords && <span className="changed-github"> · commit {c.sha.slice(0, 7)}</span>}
                  </div>
                </div>
                <button className="pl-btn changed-toggle" onClick={() => toggle(c.sha)}>
                  {isOpen ? 'Hide details' : 'See details'}
                </button>
              </div>

              {isOpen && (
                <div className="changed-details">
                  {body && <p className="changed-details-body">{body}</p>}
                  <div className="changed-details-tech">
                    <div>In GitHub words: commit {c.sha} on the main version</div>
                    <div>
                      {theseFiles === 'loading' && 'Files: checking…'}
                      {theseFiles === null && "Files: Yourkly couldn't get the list for this one."}
                      {Array.isArray(theseFiles) && (
                        theseFiles.length
                          ? `Files: ${theseFiles.join(', ')}`
                          : 'Files: none recorded'
                      )}
                    </div>
                    {c.html_url && (
                      <div>
                        <a href={c.html_url} target="_blank" rel="noreferrer">
                          Open this Save Point on GitHub
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
