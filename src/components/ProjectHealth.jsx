/**
 * ProjectHealth.jsx
 *
 * A plain-language reading of the signals GitHub already provides: saved work,
 * automatic checks, and GitHub Pages. It deliberately does not guess about
 * hosts that have not reported a check back to GitHub.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCheckRuns, getCurrentHeadSha, getPagesSite } from '../api/github'

const SUCCESS = new Set(['success', 'neutral', 'skipped'])

function checkSummary(checks) {
  if (checks === undefined) return { tone: 'waiting', title: 'Checking the latest saved version…' }
  if (checks === null) return { tone: 'unknown', title: "Yourkly couldn't check the latest version." }
  if (checks.total === 0) return { tone: 'unknown', title: 'No automatic checks are connected to this project yet.' }

  const running = checks.runs.filter(run => run.status !== 'completed')
  if (running.length) {
    return {
      tone: 'waiting',
      title: `${running.length === 1 ? 'A check is' : `${running.length} checks are`} still running.`,
      detail: 'Yourkly will not call this version ready until GitHub reports back.',
    }
  }

  const failed = checks.runs.filter(run => !SUCCESS.has(run.conclusion))
  if (failed.length) {
    return {
      tone: 'problem',
      title: `${failed.length === 1 ? 'A check needs attention.' : `${failed.length} checks need attention.`}`,
      detail: failed.map(run => run.name).join(', '),
    }
  }

  return { tone: 'good', title: 'The latest saved version passed its automatic checks.' }
}

function publishSummary(site) {
  if (site === undefined) return null
  if (site === null) return { tone: 'unknown', title: 'This project is not published through GitHub Pages.' }
  if (site.status === 'building') {
    return { tone: 'waiting', title: 'The published version is still being built.' }
  }
  if (site.status === 'errored') {
    return { tone: 'problem', title: 'GitHub could not build the published version.' }
  }
  if (site.status === 'built') return { tone: 'good', title: 'The published version is up to date.' }
  return { tone: 'unknown', title: "GitHub hasn't reported whether the published version is ready." }
}

export default function ProjectHealth({ auth, owner, repo, updates, unsaved }) {
  const { token } = auth
  const [checks, setChecks] = useState(undefined)
  const [site, setSite] = useState(undefined)
  const [checking, setChecking] = useState(false)

  async function refresh() {
    if (!token || !owner) return
    setChecking(true)
    setChecks(undefined)
    setSite(undefined)
    const [head, pages] = await Promise.all([
      getCurrentHeadSha(token, owner, repo).catch(() => null),
      getPagesSite(token, owner, repo).catch(() => undefined),
    ])
    const nextChecks = head
      ? await getCheckRuns(token, owner, repo, head).catch(() => null)
      : null
    setChecks(nextChecks)
    setSite(pages)
    setChecking(false)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!token || !owner) return
      const [head, pages] = await Promise.all([
        getCurrentHeadSha(token, owner, repo).catch(() => null),
        getPagesSite(token, owner, repo).catch(() => undefined),
      ])
      const nextChecks = head
        ? await getCheckRuns(token, owner, repo, head).catch(() => null)
        : null
      if (!cancelled) {
        setChecks(nextChecks)
        setSite(pages)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, owner, repo])

  const rows = [
    unsaved
      ? { tone: 'problem', title: 'Changes are waiting to be saved.', to: `/p/${owner}/${repo}/save`, cta: 'Review and save' }
      : { tone: 'good', title: 'Everything Yourkly knows about is saved in GitHub.' },
    checkSummary(checks),
    publishSummary(site),
    ...updates
      .filter(update => update.status === 'sent_to_ai' || update.status === 'needs_correction')
      .slice(0, 1)
      .map(update => ({
        tone: 'waiting',
        title: update.status === 'sent_to_ai'
          ? `Waiting for the AI work on “${update.title}”.`
          : `“${update.title}” needs another pass before it is saved.`,
        to: `/p/${owner}/${repo}/u/${update.id}`,
        cta: 'Open update',
      })),
  ].filter(Boolean)

  const needsAttention = rows.some(row => row.tone === 'problem')

  return (
    <section className={`project-health${needsAttention ? ' project-health--attention' : ''}`} aria-live="polite">
      <div className="project-health-head">
        <div>
          <div className="section-label section-label--tight">Project health</div>
          <h2>{needsAttention ? 'Something needs your attention' : 'This project looks healthy'}</h2>
        </div>
        <button className="pl-btn project-health-refresh" onClick={refresh} disabled={checking}>
          {checking ? 'Checking…' : 'Check again'}
        </button>
      </div>
      <p className="project-health-intro">
        Yourkly checks the latest saved version and anything GitHub reports about publishing.
      </p>
      <div className="project-health-list">
        {rows.map((row, index) => (
          <div className="project-health-row" key={`${row.title}-${index}`}>
            <span className={`project-health-mark project-health-mark--${row.tone}`} aria-hidden="true">
              {row.tone === 'good' ? '✓' : row.tone === 'problem' ? '!' : '•'}
            </span>
            <span className="project-health-copy">
              <span className="project-health-title">{row.title}</span>
              {row.detail && <span className="project-health-detail">{row.detail}</span>}
            </span>
            {row.to && <Link to={row.to} className="text-link">{row.cta} →</Link>}
          </div>
        ))}
      </div>
    </section>
  )
}

