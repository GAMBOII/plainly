/**
 * ChooseProjects.jsx — /projects/choose (max-width 800px)
 *
 * Yourkly shows every project your GitHub account can reach, which for anyone
 * in an organisation can be hundreds. This is where you narrow it down.
 *
 * Choosing nothing shows everything, and the screen says so — nobody should
 * open Yourkly to an empty list because of a setting they don't remember
 * making. Hiding a project only removes it from the lists; a direct link to it
 * still opens.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { getChosen, setChosen, fullName } from '../utils/projectPicker'
import { projectName } from '../utils/projectName'
import { timeAgo } from '../utils/time'

export default function ChooseProjects({ auth }) {
  const login = auth?.user?.login
  const navigate = useNavigate()
  const { allProjects, loading, error, truncated } = useProjects(auth)

  const [picked, setPicked] = useState(() => new Set(getChosen(login)))
  const [filter, setFilter] = useState('')
  const [saved, setSaved] = useState(false)

  const q = filter.trim().toLowerCase()
  const shown = q
    ? allProjects.filter(r => fullName(r, login).toLowerCase().includes(q))
    : allProjects

  function toggle(name) {
    setPicked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
    setSaved(false)
  }

  function save() {
    setChosen(login, [...picked])
    setSaved(true)
    navigate('/projects')
  }

  const count = picked.size

  return (
    <div className="screen-padded choose-screen">
      <Link to="/projects" className="back-link">← My Projects</Link>
      <h1 className="choose-title">Choose which projects appear</h1>
      <p className="choose-intro">
        Yourk can see every project your GitHub account has access to — your own, ones
        shared with you, and anything belonging to an organisation you're in. Tick the ones
        you actually work on.
      </p>

      <div className="choose-state">
        {count === 0
          ? 'Nothing ticked, so all of your projects appear. Tick some to narrow the list.'
          : `${count} of ${allProjects.length} ${allProjects.length === 1 ? 'project' : 'projects'} will appear.`}
      </div>

      {truncated && (
        <p className="choose-truncated">
          You have more projects than Yourk loads at once, so this list is the first 500.
          Everything ticked still appears.
        </p>
      )}

      {loading && <p className="state-loading">Getting your projects from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && !error && allProjects.length > 0 && (
        <>
          <div className="choose-controls">
            <input
              type="search"
              className="choose-filter"
              placeholder="Find a project…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Find a project"
            />
            <button className="pl-btn" onClick={() => { setPicked(new Set(shown.map(r => fullName(r, login)))); setSaved(false) }}>
              Tick all {q && 'shown'}
            </button>
            <button className="pl-btn" onClick={() => { setPicked(new Set()); setSaved(false) }}>
              Clear
            </button>
          </div>

          {shown.length === 0 && (
            <p className="choose-empty">No project matches “{filter}”.</p>
          )}

          <div className="choose-list">
            {shown.map(repo => {
              const name = fullName(repo, login)
              const mine = (repo.owner?.login || login) === login
              const on = picked.has(name)
              return (
                <label key={repo.id || name} className={`choose-row${on ? ' choose-row--on' : ''}`}>
                  <input
                    type="checkbox"
                    className="choose-check"
                    checked={on}
                    onChange={() => toggle(name)}
                  />
                  <span className="choose-row-text">
                    <span className="choose-row-name">
                      {projectName(repo.name)}
                      {!mine && <span className="choose-row-owner">{repo.owner?.login}</span>}
                    </span>
                    <span className="choose-row-meta">
                      {name}
                      {repo.updated_at && <> · touched {timeAgo(repo.updated_at)}</>}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="choose-actions">
            <button className="pl-btn-primary" onClick={save} disabled={saved}>
              {saved ? 'Saved ✓' : 'Save what appears'}
            </button>
            <Link to="/projects" className="pl-btn">Cancel</Link>
          </div>
        </>
      )}
    </div>
  )
}
