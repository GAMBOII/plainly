/**
 * Activity.jsx — /activity (max-width 800px)
 *
 * Everything you and your AI tools have done, newest first (HANDOFF §7.3).
 *
 * Events come from utils/activity: files you opened, Save Points you made,
 * handoffs you sent, steps in an update's story, and the Save Points GitHub
 * reports. Nothing is inferred, so an empty list means nothing has happened
 * yet — not that Yourkly forgot.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCommits } from '../api/github'
import { useProjects } from '../hooks/useProjects'
import { activityEvents } from '../utils/activity'
import { timeAgo } from '../utils/time'
import { projectName } from '../utils/projectName'

export default function Activity({ auth }) {
  const { user, token } = auth
  const owner = user?.login

  const { projects: repos, loading } = useProjects(auth)
  const [commitsByRepo, setCommitsByRepo] = useState({})

  // Real Save Points from GitHub, alongside what Yourkly recorded itself.
  useEffect(() => {
    if (!token || !owner || repos.length === 0) return
    let cancelled = false
    Promise.all(repos.slice(0, 6).map(r =>
      getCommits(token, owner, r.name, 8).then(c => [r.name, c]).catch(() => [r.name, []])
    )).then(pairs => { if (!cancelled) setCommitsByRepo(Object.fromEntries(pairs)) })
    return () => { cancelled = true }
  }, [token, owner, repos])

  const events = activityEvents({ owner, repos, commitsByRepo })

  return (
    <div className="screen-padded changed-screen">
      <h1 className="changed-title">Timeline</h1>
      <p className="changed-intro">Your Save Points and recent work, newest first.</p>

      {loading && <p className="state-loading">Getting your activity from GitHub…</p>}

      {!loading && events.length === 0 && (
        <div className="home-activity">
          <p className="home-empty-note">
            Nothing yet. Anything you or an AI does shows up here.
          </p>
          <Link to="/projects" className="text-link">My Projects</Link>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="home-activity">
          {events.map((event, i) => (
            <div key={`${event.repo}-${event.at}-${i}`} className="home-activity-row">
              <span className="home-activity-dot" aria-hidden="true" />
              <span>
                <Link to={`/p/${event.owner || owner}/${event.repo}`} className="home-activity-what activity-link">
                  {event.what}
                </Link>
                <span className="home-activity-meta">
                  {projectName(event.repo)} &middot; {timeAgo(event.at)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
