/**
 * FileEditor.jsx — /p/:repo/f/<path>
 *
 * One file, one writing surface (HANDOFF §7.14 → editor).
 *
 * The bar says, in Yourkly's words, whether this file is in GitHub yet, and
 * the only primary action is Review and save — nothing is written to GitHub
 * from this screen. Edits become drafts as you type, so leaving the page
 * doesn't lose them and "Changes not saved yet" is true everywhere else.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getFileContent } from '../api/github'
import { getDraft, setDraft } from '../utils/drafts'
import { recordFileOpen } from '../utils/projectMemory'
import { projectName } from '../utils/projectName'

/* Plain-language notes, the same ones Project Files shows. */
const NOTES = {
  'readme.md':    'Project overview — the first thing anyone reads',
  'package.json': 'Project setup and tools',
  'design.md':    'Design instructions',
  'agents.md':    'Instructions for AI coding tools',
  'index.html':   'The page your project opens on',
}

export default function FileEditor({ auth }) {
  const params = useParams()
  const owner = params.owner
  const repo = params.repo
  const path = params['*'] || ''
  const { token } = auth

  const [content, setContent]   = useState('')
  const [saved, setSaved]       = useState('')   // what GitHub currently holds
  const [sha, setSha]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [preview, setPreview]   = useState(false)
  const area = useRef(null)

  useEffect(() => {
    if (!token || !owner || !path) return
    let cancelled = false
    setLoading(true)
    setError(null)

    getFileContent(token, owner, repo, path)
      .then(file => {
        if (cancelled) return
        const draft = getDraft(owner, repo, path)
        setSaved(file.content)
        setSha(file.sha)
        setContent(draft ? draft.content : file.content)
        recordFileOpen(owner, repo, path)
      })
      .catch(() => {
        if (!cancelled) setError("Yourkly couldn't open that file. It may have been renamed or removed.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [token, owner, repo, path])

  function edit(value) {
    setContent(value)
    if (owner) setDraft(owner, repo, path, value, sha)
  }

  const name = path.split('/').pop()
  const note = NOTES[(name || '').toLowerCase()]
  const unsaved = content !== saved
  const isMarkdown = /\.mdx?$/i.test(name || '')

  // Rendered markdown is sanitised before it ever reaches the page.
  const rendered = useMemo(
    () => (preview && isMarkdown ? DOMPurify.sanitize(marked.parse(content)) : ''),
    [preview, isMarkdown, content]
  )

  function download() {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name || 'file.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="editor-screen">
      <div className="editor-bar">
        <Link to={`/p/${owner}/${repo}/files`} className="text-link editor-back">← All files</Link>
        <div className="editor-bar-file">
          <div className="editor-bar-name">{name || 'Untitled'}</div>
          <div className="editor-bar-note">
            {projectName(repo)}{note ? ` · ${note}` : ''}
          </div>
        </div>
        {!loading && (
          unsaved
            ? <span className="editor-pill editor-pill--unsaved">Changes not saved yet</span>
            : <span className="editor-pill editor-pill--saved">Saved in GitHub</span>
        )}
        {isMarkdown && !loading && (
          <button className="pl-btn editor-action" onClick={() => setPreview(!preview)}>
            {preview ? 'Back to editing' : 'See it formatted'}
          </button>
        )}
        {!loading && (
          <button className="pl-btn editor-action" onClick={download}>Download</button>
        )}
        <Link to={`/p/${owner}/${repo}/save`} className="pl-btn-primary editor-save">Review and save</Link>
      </div>

      <div className="editor-body">
        {loading && <p className="state-loading">Opening {name}…</p>}
        {error && <p className="error-box">{error}</p>}
        {!loading && !error && preview && isMarkdown && (
          <div
            className="editor-area editor-area--preview"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        )}
        {!loading && !error && !(preview && isMarkdown) && (
          <textarea
            ref={area}
            className="editor-area"
            value={content}
            onChange={e => edit(e.target.value)}
            spellCheck="true"
            aria-label={`Contents of ${name}`}
          />
        )}
      </div>
    </div>
  )
}
