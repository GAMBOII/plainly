/**
 * help/GoalContent.jsx — the long answer behind each task card.
 *
 * These are the answers that were already in Help.jsx, unchanged in substance.
 * They live here so pages/help/Tasks.jsx stays a grid of cards.
 */

import { Link } from 'react-router-dom'
import { WALKTHROUGHS, ROLES } from './content'

function Steps({ id }) {
  const walk = WALKTHROUGHS.find(w => w.id === id)
  if (!walk) return null
  return (
    <div className="help-walkthrough">
      {walk.steps.map((s, i) => (
        <div key={i} className="help-walk-step">
          <div className="help-walk-num">{i + 1}</div>
          <p>{s}</p>
        </div>
      ))}
    </div>
  )
}

const GOAL_CONTENT = {
  understand: {
    heading: 'What GitHub is actually for',
    body: (
      <>
        <p className="help-lead">
          GitHub is where your project is stored, protected, and tracked over time.
          It lets you keep a safe history of your work, return to earlier versions,
          share the project with others, and connect it to tools that help build or
          publish it.
        </p>
        <div className="help-reasons">
          {[
            { title: 'Keep your project safe',          desc: 'Your project is stored online instead of living only on one computer.' },
            { title: 'Track every important change',    desc: 'GitHub keeps a history so you can see what changed and restore an earlier version.' },
            { title: 'Work with other people or AI',    desc: 'You can share access without emailing files back and forth.' },
            { title: 'Publish or connect your project', desc: 'Hosting services, coding tools, and AI builders can use the project stored in GitHub.' },
          ].map(r => (
            <div key={r.title} className="help-reason-card">
              <strong>{r.title}</strong>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p className="help-callout-label">The five things beginners need to know</p>
          <ol className="help-five">
            <li>Your project is stored in a repository — Yourkly calls it a <strong>Project</strong>.</li>
            <li>GitHub keeps a history of every change you save.</li>
            <li>A saved change is called a commit — Yourkly calls it a <strong>Save Point</strong>.</li>
            <li>Private projects are not visible to anyone you have not invited.</li>
            <li>You can always open GitHub directly for advanced controls.</li>
          </ol>
          <p className="help-callout-foot">
            You can build and manage a basic project without learning every GitHub feature.
          </p>
        </div>
      </>
    ),
  },

  save: {
    heading: 'Saving your project',
    body: (
      <>
        <p className="help-lead">
          Every time you want to keep a version of your work, create a Save Point.
          Yourkly saves it to GitHub for you — you do not need to push, commit,
          or use a terminal.
        </p>
        <Steps id="save-ai-work" />
        <div className="help-callout">
          <p>
            <strong>How often should I save?</strong> Save whenever you reach a point
            you might want to come back to — after finishing a section, before trying
            something risky, or at the end of a working session.
          </p>
        </div>
      </>
    ),
  },

  share: {
    heading: 'Sharing your project',
    body: (
      <>
        <p className="help-lead">
          Sharing a project on GitHub can mean several different things. It is worth
          understanding which kind you need.
        </p>
        <div className="help-share-types">
          <div className="help-share-block">
            <h4>Send someone a link</h4>
            <p>They can view the project only if it is public, or if they already have access.</p>
          </div>
          <div className="help-share-block">
            <h4>Invite a collaborator</h4>
            <p>They can work directly in the project according to the access level you choose.</p>
            <table className="help-roles-table">
              <thead><tr><th>Access</th><th>What it means</th></tr></thead>
              <tbody>{ROLES.map(r => (
                <tr key={r.level}><td>{r.level}</td><td>{r.meaning}</td></tr>
              ))}</tbody>
            </table>
            <p className="help-safety-note">
              Only give edit access to people you trust. You can remove access at any time.
            </p>
          </div>
          <div className="help-share-block">
            <h4>Share with an AI tool</h4>
            <p>
              AI tools may need a GitHub connection, a project link, selected files,
              or a prompt containing project context. Yourkly helps you prepare that
              context so you do not have to figure out which files or technical
              instructions the AI needs.
            </p>
          </div>
        </div>
        <div className="help-section-block">
          <h4>Public vs private</h4>
          <div className="help-visibility-cards">
            <div className="help-vis-card">
              <span className="help-vis-label private">Private</span>
              <p>Only you and people you invite can view it. Use this for unfinished work,
              personal projects, private information, or projects containing business ideas.</p>
            </div>
            <div className="help-vis-card">
              <span className="help-vis-label public">Public</span>
              <p>Anyone can view the project files. Use this when you intentionally want
              others to see the work, it is open-source, or you are sharing a portfolio.</p>
            </div>
          </div>
          <div className="help-callout">
            <p>
              <strong>Important:</strong> Public does not mean people can automatically
              change your project. It means they can view it and may be able to copy it.
            </p>
          </div>
        </div>
      </>
    ),
  },

  ai: {
    heading: 'Using an AI tool with your project',
    body: (
      <>
        <p className="help-lead">
          Yourkly prepares your entire project context — not just a single file — so
          any AI tool can pick up exactly where you left off.
        </p>
        <Steps id="handoff-ai" />
        <div className="help-callout">
          <p>
            <strong>What is included in the handoff?</strong> Yourkly bundles the
            project name, description, file list, your recent Save Points, your
            project instructions, what you asked for, and how you want the AI to
            report back. You can leave any of it out before you copy it.
          </p>
        </div>
        <div className="help-section-block">
          <h4>Why use Yourkly for AI handoffs?</h4>
          <p>
            Each AI tool only knows what happened inside its own conversation. Yourkly
            is the one place that holds the full story: what you asked each AI to do,
            which files changed, and what is still unfinished. That means you can switch
            between Claude, ChatGPT, Gemini, Manus or DeepSeek without losing context.
          </p>
        </div>
      </>
    ),
  },

  changes: {
    heading: 'Seeing what changed',
    body: (
      <>
        <p className="help-lead">
          Every Save Point records a snapshot of your project at that moment. You can
          compare versions to see exactly what was added or removed.
        </p>
        <div className="help-steps-inline">
          {['Open the project', 'Open Save Points', 'Choose an earlier version', 'See what changed since then'].map((s, i) => (
            <div key={i} className="help-walk-step">
              <div className="help-walk-num">{i + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            Added lines are shown in green. Removed lines are shown in red.
            Lines that did not change are shown in grey.
          </p>
        </div>
        <div className="help-section-block">
          <h4>What Changed</h4>
          <p>
            Inside any project, <strong>What Changed</strong> is the story of that
            project in order: every Save Point, every handoff you sent to an AI, and
            anything still waiting on you.
          </p>
        </div>
      </>
    ),
  },

  undo: {
    heading: 'Undoing a mistake',
    body: (
      <>
        <p className="help-lead">
          As long as you created a Save Point before the mistake, you can go back.
          Restoring never permanently deletes anything — it puts the older content
          back as a new Save Point.
        </p>
        <Steps id="undo-mistake" />
        <div className="help-callout">
          <p>
            <strong>What if I never created a Save Point?</strong> Then the earlier
            version was never kept, and Yourkly cannot bring it back. This is the whole
            reason for saving regularly — and why Yourkly keeps telling you when
            something is only on this computer.
          </p>
        </div>
      </>
    ),
  },

  publish: {
    heading: 'Publishing your project',
    body: (
      <>
        <p className="help-lead">
          Deploying means making your project available online so other people can use
          it. GitHub connects to many hosting services that can do this automatically
          whenever you save a new version.
        </p>
        <div className="help-callout">
          <p>
            <strong>Yourkly can publish for you.</strong> Open a project and choose
            <strong> Put it on the web</strong>. Yourkly asks GitHub to publish it and
            shows you the address once GitHub says it's live — it never claims a site
            is up before that. For anything fancier, Vercel, Netlify and Cloudflare
            Pages all connect to the same GitHub project.
          </p>
        </div>
        <div className="help-section-block">
          <h4>The basic concept</h4>
          <p>
            When you create a Save Point in Yourkly, the change is stored in GitHub.
            If a hosting service is connected, it notices that change and rebuilds
            your published site within a minute or two. Nothing extra is needed —
            saving in Yourkly is what triggers it.
          </p>
        </div>
      </>
    ),
  },

  link: {
    heading: 'You received a GitHub link',
    body: (
      <>
        <p className="help-lead">
          GitHub links can point to many different things. Here is how to read them.
        </p>
        <div className="help-link-types">
          {[
            { pattern: 'github.com/username/project-name', what: 'A project (repository). You can view it if it is public or if you have been invited.', action: 'Open it in Yourkly to read and edit, or view it directly on GitHub.' },
            { pattern: 'github.com/username/project-name/issues/123', what: 'A task or problem that someone filed.', action: 'Read the discussion and add a comment if you have access.' },
            { pattern: 'github.com/username/project-name/pull/45', what: 'A proposed set of changes waiting for review.', action: 'Review the changes and approve or comment.' },
            { pattern: 'github.com/username/project-name/tree/branch-name', what: 'A specific separate version (branch) of the project.', action: 'You are looking at a version that may be different from the main project.' },
          ].map(t => (
            <div key={t.pattern} className="help-link-card">
              <code className="help-link-pattern">{t.pattern}</code>
              <p className="help-link-what">{t.what}</p>
              <p className="help-link-action"><strong>What to do:</strong> {t.action}</p>
            </div>
          ))}
        </div>
        <div className="help-callout">
          <p>
            If you are unsure what a link points to, open it in your browser. GitHub
            will show you what it is. You cannot break anything by looking.
          </p>
        </div>
      </>
    ),
  },
}

export default function GoalContent({ id }) {
  const content = GOAL_CONTENT[id]
  if (!content) return null
  return (
    <div className="help-goal-content">
      <h3 className="help-goal-heading">{content.heading}</h3>
      {content.body}
      <Link to="/help/troubleshooting" className="text-link help-goal-more">
        Something not working the way this says? →
      </Link>
    </div>
  )
}
