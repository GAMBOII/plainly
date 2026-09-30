/**
 * help/Glossary.jsx — /help/glossary
 *
 * Every word Yourkly uses and the GitHub word it replaces, as a table you can
 * filter. The toggle flips which column you're looking things up by: you came
 * with a Yourkly word, or you came with a GitHub word someone else used.
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GLOSSARY, EXTENSION } from '../../help/content'

export default function Glossary() {
  const [params, setParams] = useSearchParams()
  const [direction, setDirection] = useState('plain') // 'plain' | 'github'
  const query = params.get('q') || ''

  const setQuery = value => {
    const next = new URLSearchParams(params)
    if (value) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const q = query.trim().toLowerCase()
  const rows = q
    ? GLOSSARY.filter(g =>
        g.term.toLowerCase().includes(q) ||
        g.github.toLowerCase().includes(q) ||
        g.def.toLowerCase().includes(q))
    : GLOSSARY

  const sorted = direction === 'github'
    ? [...rows].sort((a, b) => a.github.localeCompare(b.github))
    : [...rows].sort((a, b) => a.term.localeCompare(b.term))

  const first = direction === 'github' ? 'GitHub says' : 'Yourkly says'
  const second = direction === 'github' ? 'Yourkly says' : 'GitHub says'

  return (
    <section className="help-section">
      <h2 className="help-section-title">Plain-English glossary</h2>
      <p className="help-section-intro">
        The word Yourkly uses, and the GitHub word it replaces. Both mean the same thing —
        one of them is just easier to read.
      </p>

      <div className="help-gloss-controls">
        <input
          type="search"
          className="help-gloss-filter"
          placeholder="Filter these words…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Filter the glossary"
        />
        <div className="help-toggle" role="group" aria-label="Which word are you looking up?">
          <button
            className={`help-toggle-btn${direction === 'plain' ? ' help-toggle-btn--on' : ''}`}
            onClick={() => setDirection('plain')}
            aria-pressed={direction === 'plain'}
          >
            Yourkly → GitHub
          </button>
          <button
            className={`help-toggle-btn${direction === 'github' ? ' help-toggle-btn--on' : ''}`}
            onClick={() => setDirection('github')}
            aria-pressed={direction === 'github'}
          >
            GitHub → Yourkly
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="help-empty-note">
          No word here matches “{query}”. Try the plain word, or the GitHub word someone
          else used.
        </p>
      ) : (
        <table className="help-gloss-table">
          <thead>
            <tr>
              <th scope="col">{first}</th>
              <th scope="col">{second}</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            {/* data-label carries the column name so each cell can still say
                what it is once the table restacks on a narrow screen. */}
            {sorted.map(g => (
              <tr key={g.term}>
                <td className="help-gloss-cell-term" data-label={first}>
                  {direction === 'github' ? g.github : g.term}
                </td>
                <td className="help-gloss-cell-other" data-label={second}>
                  {direction === 'github' ? g.term : g.github}
                </td>
                <td className="help-gloss-cell-def" data-label="What it means">{g.def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="help-gloss-foot">
        Yourkly only shows GitHub's words as grey explanation, never on a button. If you
        would rather see them everywhere, turn on <strong>Show technical GitHub words</strong>{' '}
        in Account.
      </p>

      {/* The obvious next question once someone has read the glossary: what
          about the jargon on GitHub's own site, and everywhere else? */}
      <p className="help-gloss-foot">
        Want these explanations on GitHub itself, and on other technical sites?{' '}
        <a href={EXTENSION.url} target="_blank" rel="noopener noreferrer">{EXTENSION.name}</a>{' '}
        does that while you browse.
      </p>
    </section>
  )
}
