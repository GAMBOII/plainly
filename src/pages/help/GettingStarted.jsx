/**
 * help/GettingStarted.jsx — /help
 *
 * The way in. Three cards for the three reasons people open Help, then the
 * shortest possible statement of what Yourkly is.
 */

import { Link } from 'react-router-dom'
import { ENTRY_CARDS, EXTENSION } from '../../help/content'

export default function GettingStarted() {
  return (
    <>
      <div className="help-entry-grid">
        {ENTRY_CARDS.map(card => (
          <Link key={card.path} to={card.path} className="help-entry-card">
            <span className="help-entry-title">{card.title}</span>
            <span className="help-entry-body">{card.body}</span>
            <span className="help-entry-cta">{card.cta} →</span>
          </Link>
        ))}
      </div>

      <section className="help-section">
        <h2 className="help-section-title">The short version</h2>
        <p className="help-lead">
          Your work lives in your own GitHub account. Yourkly is the front door: it
          remembers where you stopped, explains what changed in normal words, and keeps
          a Save Point every time you save so you can always go back.
        </p>
        <div className="help-callout">
          <p>
            <strong>Two things worth knowing straight away.</strong> Nothing reaches
            GitHub until you press a button that says so — until then your edits are
            drafts on this computer. And nothing you see in Yourkly is made up: every
            number, filename and date comes from your real project.
          </p>
        </div>
        <div className="help-next-row">
          <Link to="/help/how-it-works" className="pl-btn-primary">Start with how it works</Link>
          <Link to="/help/glossary" className="pl-btn">Jump to the glossary</Link>
        </div>
      </section>

      {/* Yourkly's sibling. This app explains your projects; the extension
          explains the rest of the technical web while you're on it. */}
      <section className="help-section">
        <h2 className="help-section-title">{EXTENSION.name}</h2>
        <p className="help-section-intro">{EXTENSION.tagline}</p>
        <div className="help-extension-card">
          <p className="help-extension-body">{EXTENSION.body}</p>
          <ul className="help-extension-points">
            {EXTENSION.points.map(p => <li key={p}>{p}</li>)}
          </ul>
          <a
            className="pl-btn-primary help-extension-cta"
            href={EXTENSION.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {EXTENSION.cta}
          </a>
        </div>
      </section>
    </>
  )
}
