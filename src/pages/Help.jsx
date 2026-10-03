/**
 * Help.jsx — /help and /help/* (max-width 860px)
 *
 * The frame around the six Help sections: title, search, and the section body.
 * Which section shows is decided by the route, so every topic has its own URL
 * and the sidebar can link straight to it.
 *
 * Search sits above the section and searches everything at once — steps, tasks,
 * glossary words, problems and walkthroughs — from the one index in
 * help/content.js. While there's a query, the results replace the section body;
 * clearing it puts the section back.
 *
 * The nav lives in AppShell — this page must never render one of its own.
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SECTIONS, search } from '../help/content'

import GettingStarted   from './help/GettingStarted'
import HowItWorks       from './help/HowItWorks'
import Tasks            from './help/Tasks'
import Glossary         from './help/Glossary'
import Troubleshooting  from './help/Troubleshooting'
import Contact          from './help/Contact'

const BODIES = {
  start:    GettingStarted,
  how:      HowItWorks,
  tasks:    Tasks,
  glossary: Glossary,
  trouble:  Troubleshooting,
  contact:  Contact,
}

export default function Help() {
  const { pathname } = useLocation()
  const [query, setQuery] = useState('')

  const section = SECTIONS.find(s => s.path === pathname) || SECTIONS[0]
  const Body = BODIES[section.id]

  const results = query.trim().length >= 2 ? search(query) : null

  return (
    <div className="screen-padded help-screen">
      <h1 className="help-page-title">Help</h1>
      <p className="help-page-intro">
        Yourkly is a plain-English way to use GitHub. Your files live in your real GitHub
        account — Yourkly just makes it obvious what's going on and what to do next.
      </p>

      <div className="help-search">
        <input
          type="search"
          className="help-search-input"
          placeholder="Search help — try “save point”, “branch”, “undo”…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search help"
        />
        {query && (
          <button className="help-search-clear" onClick={() => setQuery('')}>Clear</button>
        )}
      </div>

      {results ? (
        <section className="help-section">
          <h2 className="help-section-title">
            {results.length === 0
              ? `Nothing here matches “${query}”`
              : `${results.length} ${results.length === 1 ? 'answer' : 'answers'} for “${query}”`}
          </h2>
          {results.length === 0 ? (
            <p className="help-empty-note">
              Try the word you'd use out loud — “save”, “undo”, “share”. If Help really
              doesn't cover it,{' '}
              <Link to="/help/contact" className="text-link">tell us what you were looking for</Link>.
            </p>
          ) : (
            <div className="help-results">
              {results.map(r => (
                <Link key={r.to} to={r.to} className="help-result" onClick={() => setQuery('')}>
                  <span className="help-result-kind">{r.kind}</span>
                  <span className="help-result-title">{r.title}</span>
                  <span className="help-result-body">{r.body}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <Body />
      )}
    </div>
  )
}
