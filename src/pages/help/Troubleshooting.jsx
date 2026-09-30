/**
 * help/Troubleshooting.jsx — /help/troubleshooting
 *
 * The six things that look broken and usually aren't. Each answer describes
 * what Yourkly actually does — where an answer is "Yourkly can't do that",
 * it says so rather than inventing a fix.
 */

import { useSearchParams, Link } from 'react-router-dom'
import { TROUBLESHOOTING } from '../../help/content'

export default function Troubleshooting() {
  const [params, setParams] = useSearchParams()
  const open = params.get('open')

  const toggle = id => {
    const next = new URLSearchParams(params)
    if (open === id) next.delete('open')
    else next.set('open', id)
    setParams(next, { replace: true })
  }

  return (
    <section className="help-section">
      <h2 className="help-section-title">When something looks wrong</h2>
      <p className="help-section-intro">
        Most of these are Yourkly working as intended. Open the one that matches.
      </p>

      <div className="help-trouble-list">
        {TROUBLESHOOTING.map(item => {
          const isOpen = open === item.id
          return (
            <div key={item.id} className={`help-trouble-row${isOpen ? ' help-trouble-row--on' : ''}`}>
              <button
                className="help-trouble-trigger"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
              >
                <span className="help-trouble-q">{item.q}</span>
                <span className="help-trouble-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="help-trouble-answer">
                  {item.a.map(p => <p key={p}>{p}</p>)}
                  {item.link && (
                    <Link to={item.link.to} className="text-link">{item.link.label} →</Link>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="help-callout">
        <p>
          <strong>Still stuck?</strong> Tell us what happened and what you expected instead.{' '}
          <Link to="/help/contact" className="text-link">Contact support →</Link>
        </p>
      </div>
    </section>
  )
}
