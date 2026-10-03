/**
 * help/HowItWorks.jsx — /help/how-it-works
 *
 * The four steps as a stepper: the list on the left, the chosen step's detail
 * in the panel beside it. ?step=N deep-links a step so search results can land
 * on the right one.
 *
 * The mockup showed a play button on the panel ("Animated demo · Click play").
 * There is no animation to play, so the panel is driven by clicking the steps
 * instead — a control that does nothing is worse than no control (DESIGN.md §8).
 */

import { useSearchParams } from 'react-router-dom'
import { STEPS } from '../../help/content'

export default function HowItWorks() {
  const [params, setParams] = useSearchParams()
  const raw = Number(params.get('step'))
  const active = Number.isInteger(raw) && raw >= 0 && raw < STEPS.length ? raw : 0
  const step = STEPS[active]

  const select = i => {
    const next = new URLSearchParams(params)
    next.set('step', String(i))
    setParams(next, { replace: true })
  }

  return (
    <section className="help-section">
      <h2 className="help-section-title">How Yourkly works</h2>
      <p className="help-section-intro">
        Four steps, start to finish. Click one to see what it actually involves.
      </p>

      <div className="help-stepper">
        <ol className="help-stepper-list">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                className={`help-stepper-item${i === active ? ' help-stepper-item--on' : ''}`}
                onClick={() => select(i)}
                aria-current={i === active ? 'step' : undefined}
              >
                <span className="help-how-num">{i + 1}</span>
                <span className="help-stepper-label">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="help-stepper-panel">
          <div className="section-label section-label--tight">Step {active + 1} of {STEPS.length}</div>
          <h3 className="help-stepper-heading">{step.title}</h3>
          <p className="help-stepper-body">{step.body}</p>
          {step.detail.map(p => (
            <p key={p} className="help-stepper-detail">{p}</p>
          ))}
          <div className="help-stepper-where">
            <span className="help-stepper-where-label">Where you'll see this</span>
            <span>{step.where}</span>
          </div>
          <div className="help-stepper-nav">
            <button
              className="pl-btn"
              onClick={() => select(active - 1)}
              disabled={active === 0}
            >
              ← Previous step
            </button>
            <button
              className="pl-btn-primary"
              onClick={() => select(active + 1)}
              disabled={active === STEPS.length - 1}
            >
              Next step →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
