/**
 * help/Contact.jsx — /help/contact
 *
 * Yourkly has no support desk, and inventing one would be a lie. This opens a
 * new issue on the project Yourkly itself is built from — a real place where a
 * report can be read and answered.
 *
 * Because that page is public, the screen says so before you write anything.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT_REPO, issueUrl } from '../../help/content'

const KINDS = [
  { id: 'Something is broken', hint: 'A screen errors, a button does nothing, a number looks wrong.' },
  { id: 'I got stuck',         hint: "You couldn't work out how to do something Yourkly should do." },
  { id: 'An idea',             hint: 'Something Yourkly should do that it does not do yet.' },
]

export default function Contact() {
  const [kind, setKind] = useState(KINDS[0].id)
  const [summary, setSummary] = useState('')
  const [section, setSection] = useState('')

  const href = issueUrl({ kind, summary, section })

  return (
    <section className="help-section">
      <h2 className="help-section-title">Contact support</h2>
      <p className="help-section-intro">
        Reports go to Yourkly's own project on GitHub, at{' '}
        <span className="help-mono">{CONTACT_REPO}</span>. That is where the people who build
        Yourkly read them.
      </p>

      <div className="help-callout help-contact-warning">
        <p>
          <strong>That page is public.</strong> Anyone can read what you write there, so
          don't include passwords, access tokens, or anything from a private project you
          wouldn't want quoted.
        </p>
      </div>

      <div className="help-contact-form">
        <div className="help-contact-field">
          <span className="section-label section-label--tight">What kind of thing is it?</span>
          <div className="help-kind-row">
            {KINDS.map(k => (
              <button
                key={k.id}
                className={`help-kind-btn${kind === k.id ? ' help-kind-btn--on' : ''}`}
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
              >
                <span className="help-kind-label">{k.id}</span>
                <span className="help-kind-hint">{k.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="help-contact-field">
          <span className="section-label section-label--tight">What happened?</span>
          <textarea
            className="newupdate-input"
            placeholder="I pressed Review and save and the list of changes was empty, but I had edited two files."
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
        </label>

        <label className="help-contact-field">
          <span className="section-label section-label--tight">Where in Yourkly? (optional)</span>
          <input
            type="text"
            className="help-text-input"
            placeholder="Review and save, inside a project"
            value={section}
            onChange={e => setSection(e.target.value)}
          />
        </label>

        <div className="help-next-row">
          <a
            className="pl-btn-primary"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open a report on GitHub
          </a>
          <Link to="/help/troubleshooting" className="pl-btn">Check the common problems first</Link>
        </div>
        <p className="help-contact-note">
          This opens GitHub with the report already filled in. Nothing is sent until you
          press Submit there, and you can edit every word first.
        </p>
      </div>
    </section>
  )
}
