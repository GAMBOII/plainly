/**
 * ContinueWithAI.jsx — /p/:repo/ai and /p/:repo/u/:updateId/ai (max-width 860px)
 *
 * Four numbered steps: pick the AI, see what Yourkly is packing, copy the
 * handoff, tell Yourkly you sent it (HANDOFF §7.7).
 *
 * It works with or without an update. Without one, step 2 asks what you want
 * the AI to do and the handoff carries everything else about the project —
 * pressing "Mark as sent" is what turns that sentence into an update record.
 * Nothing is written before that.
 *
 * The checklist is live: unticking an item removes that section from the
 * preview immediately. Marking as sent records the branch head at that moment
 * — that sha is the only thing that makes return-detection possible (§5).
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUpdateById, recordHandoffSent, createUpdate } from '../utils/updateMemory'
import { getMemory } from '../utils/projectMemory'
import { AI_TOOLS } from '../utils/aiPrompt'
import { CONTEXT_ITEMS, buildHandoff } from '../utils/handoff'
import { getRepoInfo, getContents, getCommits, getFileContent, getCurrentHeadSha } from '../api/github'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'
import { findSensitiveText } from '../utils/secretWarning'

const LOCKED = CONTEXT_ITEMS.filter(c => c.locked).map(c => c.id)

export default function ContinueWithAI({ auth }) {
  const { owner, repo, updateId } = useParams()
  const { token, user } = auth

  const stored = owner && updateId ? getUpdateById(owner, repo, updateId) : null

  // With no update yet, the handoff is built against a placeholder carrying
  // what the user types. It becomes a real record only on "Mark as sent".
  const [goal, setGoal] = useState('')
  const [created, setCreated] = useState(null)
  const update = stored || created || {
    id: null,
    title: goal.trim() || 'Work on this project',
    goal: goal.trim(),
    status: 'planned',
    ai: null,
    files: [],
    handoff: null,
    story: [],
  }

  const [tool, setTool]         = useState(null)
  const [checked, setChecked]   = useState(() => new Set(CONTEXT_ITEMS.map(c => c.id)))
  const [copied, setCopied]     = useState(false)
  const [opened, setOpened]     = useState(false)
  const [marked, setMarked]     = useState(Boolean(stored?.handoff?.sentAt))
  const [sensitiveConfirmed, setSensitiveConfirmed] = useState(false)

  // Everything the handoff is built from.
  const [repoInfo, setRepoInfo]         = useState(null)
  const [tree, setTree]                 = useState([])
  const [savePoints, setSavePoints]     = useState([])
  const [instructions, setInstructions] = useState(null)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false

    async function load() {
      const [info, entries, commits] = await Promise.all([
        getRepoInfo(token, owner, repo).catch(() => null),
        getContents(token, owner, repo).catch(() => []),
        getCommits(token, owner, repo, 5).catch(() => []),
      ])
      if (cancelled) return
      setRepoInfo(info)
      setSavePoints(commits.map(c => (c.commit?.message || '').split('\n')[0]).filter(Boolean))

      // One level of folder contents, so the listing can show what's inside.
      const withChildren = await Promise.all(entries.map(async e => {
        if (e.type !== 'dir') return e
        const children = await getContents(token, owner, repo, e.path).catch(() => [])
        return { ...e, children }
      }))
      if (cancelled) return
      setTree(withChildren)

      const design = entries.find(e => e.name.toLowerCase() === 'design.md')
      if (design) {
        try {
          const file = await getFileContent(token, owner, repo, design.path)
          if (!cancelled) setInstructions(file.content)
        } catch { /* leave null — the handoff says there is none */ }
      }
      if (!cancelled) setLoading(false)
    }

    load().catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [token, owner, repo])

  const memory = owner ? getMemory(owner, repo) : {}

  const handoff = useMemo(() => {
    if (!update) return ''
    return buildHandoff({
      checked,
      owner,
      repo,
      projectLabel: projectName(repoInfo?.name || repo),
      description: repoInfo?.description,
      update,
      lastFile: memory.lastOpenedFile,
      branch: repoInfo?.default_branch,
      lastSaveLabel: memory.lastSaveLabel,
      tree,
      savePoints,
      instructions,
    })
  }, [checked, update, owner, repo, repoInfo, tree, savePoints, instructions, memory.lastOpenedFile, memory.lastSaveLabel])

  const sensitiveText = useMemo(() => findSensitiveText(handoff), [handoff])

  if (updateId && !stored) {
    return (
      <div className="screen-padded ai-screen">
        <p className="error-box">That update could not be found.</p>
        <Link to={`/p/${owner}/${repo}/updates`} className="pl-btn">Back to updates</Link>
      </div>
    )
  }

  const toolLabel = tool?.label || 'your AI'

  function toggle(id) {
    if (LOCKED.includes(id)) return
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setCopied(false)
  }

  async function handleCopy() {
    if (sensitiveText.length && !sensitiveConfirmed) return
    try {
      await navigator.clipboard.writeText(handoff)
      setCopied(true)
    } catch { /* clipboard blocked — the text is on screen to copy by hand */ }
  }

  function handleOpen() {
    if (tool?.url) window.open(tool.url, '_blank', 'noopener,noreferrer')
    setOpened(true)
  }

  async function handleMarkSent() {
    if (!owner || !tool) return
    // No update yet — this is the moment one is created, from what you typed.
    let id = stored?.id || created?.id
    if (!id) {
      const record = createUpdate(owner, repo, update.title, update.goal || null)
      setCreated(record)
      id = record.id
    }
    // The branch head right now. Without it, "what changed while I was away"
    // cannot be computed later.
    let sha = null
    try {
      sha = await getCurrentHeadSha(token, owner, repo)
    } catch { /* recorded as null; the return screen will say it can't check */ }
    recordHandoffSent(owner, repo, id, tool.label, sha)
    setMarked(true)
  }

  const fileCount = (update.files || []).length

  return (
    <div className="screen-padded ai-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="ai-title">Continue in…</h1>
      <p className="ai-intro">
        Pick where you want to continue. Yourkly writes a project brief with everything it
        needs to pick up where you left off.
      </p>

      {stored?.handoff?.sentAt && (
        <div className="ai-previous">
          <div>
            <div className="ai-previous-title">
              You continued this project with {update.ai || 'an AI'} {timeAgo(update.handoff.sentAt)}.
            </div>
            <div className="ai-previous-body">
              Did you make changes? Yourkly can only see them once they're in your files.
            </div>
          </div>
          <Link to={`/p/${owner}/${repo}/u/${stored.id}/return`} className="pl-btn">Review project changes</Link>
        </div>
      )}

      {/* 1 */}
      <h2 className="ai-step-title">1. Where do you want to continue?</h2>
      <div className="ai-tools">
        {AI_TOOLS.filter(t => t.id !== 'generic').map(t => (
          <button
            key={t.id}
            type="button"
            className={`ai-tool${tool?.id === t.id ? ' ai-tool--on' : ''}`}
            onClick={() => { setTool(t); setCopied(false); setOpened(false) }}
            aria-pressed={tool?.id === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tool && <p className="ai-tool-hint">{tool.pasteHint}</p>}

      {/* Without an update, this is where the AI's instruction comes from. */}
      {!stored && !created && (
        <>
          <h2 className="ai-step-title">2. What do you want the AI to do?</h2>
          <p className="ai-step-sub">
            One sentence in your words. Yourkly keeps it as an update once you mark this as
            sent, so it can tell you what changed when you come back.
          </p>
          <textarea
            className="newupdate-input ai-goal"
            placeholder="Add a clearer welcome message to the homepage and make the main button easier to find."
            value={goal}
            onChange={e => { setGoal(e.target.value); setCopied(false) }}
          />
        </>
      )}

      {/* 2 */}
      <h2 className="ai-step-title">
        {stored || created ? '2. What Yourkly is packing' : '3. What Yourkly is packing'}
      </h2>
      <p className="ai-step-sub">
        This is the context the AI gets. You don't have to remember any of it — but you can
        leave things out, and the handoff below updates as you do.
      </p>
      <div className="ai-context">
        {CONTEXT_ITEMS.map(item => {
          const on = checked.has(item.id)
          const label = item.id === 'files'
            ? `${fileCount} ${fileCount === 1 ? 'file' : 'files'} you picked`
            : item.label
          return (
            <div key={item.id} className="ai-context-row">
              <button
                className={`ai-check${on ? ' ai-check--on' : ''}`}
                onClick={() => toggle(item.id)}
                disabled={item.locked}
                aria-pressed={on}
                aria-label={`${on ? 'Leave out' : 'Include'} ${label}`}
              >
                {on ? '✓' : ''}
              </button>
              <div className="ai-context-text">
                <div className="ai-context-name">{label}</div>
                <div className="ai-context-detail">{item.detail}</div>
              </div>
              {item.locked && <span className="ai-context-locked">Always included</span>}
            </div>
          )
        })}
      </div>

      {/* 3 */}
      <h2 className="ai-step-title">
        {stored || created ? '3. Your handoff' : '4. Your handoff'}
      </h2>
      <p className="ai-step-sub">Copy this and paste it in as your first message.</p>
      <pre className="ai-preview">{loading ? 'Reading your project from GitHub…' : handoff}</pre>
      {sensitiveText.length > 0 && !loading && (
        <div className="ai-secret-warning" role="alert">
          <strong>Check this before copying.</strong> Yourkly found what looks like {sensitiveText.join(' and ')}.
          External AI services may keep what you paste. Remove it from the handoff, or confirm that
          you are allowed to share it.
          <label className="ai-secret-confirm">
            <input
              type="checkbox"
              checked={sensitiveConfirmed}
              onChange={e => setSensitiveConfirmed(e.target.checked)}
            />
            I checked this and am allowed to share it.
          </label>
        </div>
      )}
      <div className="ai-actions">
        <button className="pl-btn-primary" onClick={handleCopy} disabled={loading || (sensitiveText.length > 0 && !sensitiveConfirmed)}>
          {copied ? 'Copied ✓' : 'Copy handoff'}
        </button>
        <button className="pl-btn" onClick={handleOpen} disabled={!tool}>
          Open {toolLabel}
        </button>
        <span className="ai-actions-note">
          {copied
            ? `Copied. ${tool?.pasteHint || `Paste it into ${toolLabel} as your first message.`}`
            : opened
              ? `${toolLabel} opened in a new tab. Copy the brief, then paste it there.`
              : ''}
        </span>
      </div>

      {/* 4 */}
      <div className="ai-sent">
        <div>
          <div className="ai-sent-title">
            {stored || created ? "4. Tell Yourkly you've sent it" : "5. Tell Yourkly you've sent it"}
          </div>
          <div className="ai-sent-note">
            {marked
              ? 'Yourkly is now watching this project for changes. Come back when you are done.'
              : 'Do this so Yourkly knows to watch for changes when you come back.'}
          </div>
        </div>
        <button className="pl-btn-primary" onClick={handleMarkSent} disabled={!tool || marked}>
          {marked ? `Marked as sent to ${update.ai || toolLabel} ✓` : `Mark as sent to ${toolLabel}`}
        </button>
      </div>
    </div>
  )
}
