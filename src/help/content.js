/**
 * help/content.js — the writing, kept away from the components.
 *
 * Everything Help shows lives here so the section pages stay layout-only and
 * the search index has one place to read from. The wording is the wording that
 * was already in Help.jsx; this file restructures it, it doesn't rewrite it.
 *
 * Rule for anything added here: it must describe what Yourkly actually does.
 * No feature is promised in Help that the app doesn't have (DESIGN.md §8).
 */

// ── The six sections, in sidebar order ────────────────────────────────────────
export const SECTIONS = [
  { id: 'start',    path: '/help',                 label: 'Getting started' },
  { id: 'how',      path: '/help/how-it-works',    label: 'How Yourk works' },
  { id: 'tasks',    path: '/help/tasks',           label: 'What are you trying to do?' },
  { id: 'glossary', path: '/help/glossary',        label: 'Plain-English glossary' },
  { id: 'trouble',  path: '/help/troubleshooting', label: 'When something looks wrong' },
  { id: 'contact',  path: '/help/contact',         label: 'Contact support' },
]

// ── Getting started: the three ways in ────────────────────────────────────────
export const ENTRY_CARDS = [
  {
    path: '/help/how-it-works',
    title: "I'm new to all of this",
    body: 'Four steps, start to finish: sign in, open a project, keep a version, hand it to an AI.',
    cta: 'Show me how Yourk works',
  },
  {
    path: '/help/tasks',
    title: 'I know what I want to do',
    body: 'Pick the thing you are trying to do and get the steps for it, in order.',
    cta: 'Find my task',
  },
  {
    path: '/help/glossary',
    title: "I hit a word I don't know",
    body: "Every word Yourk uses, the GitHub word it replaces, and what it actually means.",
    cta: 'Open the glossary',
  },
]

// ── How Yourkly works — the four steps (HANDOFF §7.20) ────────────────────────
export const STEPS = [
  {
    title: 'Sign in with GitHub',
    body: 'Your GitHub account is your login. No new password, and nothing is copied off GitHub.',
    detail: [
      'Yourk never stores a copy of your project. It reads and writes your files through GitHub, using the access you granted when you signed in.',
      'You can take that access away at any time from your GitHub account settings, and Yourk stops seeing anything immediately.',
    ],
    where: 'The Welcome screen, before you sign in.',
  },
  {
    title: 'Open a project and pick up where you left off',
    body: 'Home always shows the last thing you touched, so you never have to remember.',
    detail: [
      'Home answers three questions: where you left off, what has happened since, and what to do next. Those three sentences are worked out from your real project, not written in advance.',
      'If nothing is in flight, Home says so rather than inventing something for you to do.',
    ],
    where: 'Home, and Project Home inside each project.',
  },
  {
    title: 'Make a Save Point when you want to keep a version',
    body: 'Write one line about what changed. That version is kept forever and you can always go back to it.',
    detail: [
      'Until you save, edits live on this computer only. Yourk says so on the screen, in those words, because that is the one thing that can lose your work.',
      'Review and save shows you every changed line before anything reaches GitHub.',
    ],
    where: 'Review and save, then Save Points to see the history.',
  },
  {
    title: 'Hand the project to an AI when you want help',
    body: 'Yourk writes out the context so Claude, ChatGPT, Gemini, Manus or DeepSeek knows what your project is and what you want changed.',
    detail: [
      'The handoff carries the project, where you left off, the file list, your recent Save Points, your project instructions, and how you want the AI to report back.',
      'When you tell Yourk you sent it, Yourk records the exact version your project was at. That is what lets it tell you what changed while you were away.',
    ],
    where: 'Continue with AI, inside any project.',
  },
]

// ── Glossary — the Yourkly word first, the GitHub word beside it ──────────────
export const GLOSSARY = [
  { term: 'Project',                    github: 'repository',            def: 'One place for all the files that belong together — an app, a book, a client job.' },
  { term: 'Save Point',                 github: 'commit',                def: 'A snapshot of your work at a moment in time. Kept forever, and you can always go back to it.' },
  { term: 'What changed?',              github: 'commit message',        def: 'The one line you write when you save, so future-you can find that version again.' },
  { term: 'Save to GitHub',             github: 'push',                  def: 'Send the work on this computer up to GitHub, where it is safe and backed up.' },
  { term: 'Get latest version',         github: 'pull',                  def: 'Bring down anything that changed in GitHub since you last worked — for example, work an AI or teammate saved.' },
  { term: 'Separate version',           github: 'branch',                def: 'A safe copy of the whole project so you can try something without touching your main version.' },
  { term: 'Main version',               github: 'default branch',        def: 'The real, current version of your project. This is what you work in unless you choose otherwise.' },
  { term: 'See what changed',           github: 'diff',                  def: 'A side-by-side look at the lines that were added and removed.' },
  { term: 'Restore an earlier version', github: 'revert',                def: 'Put the files back the way they were at an earlier Save Point. Nothing newer is deleted.' },
  { term: 'Changes not saved yet',      github: 'uncommitted changes',   def: 'Edits that only exist on this computer. They are not backed up until you save them to GitHub.' },
  { term: 'Project files',              github: 'tree, blob',            def: 'The folders and files inside your project, exactly as GitHub holds them.' },
  { term: 'Who can see it',             github: 'collaborators, visibility', def: 'Who you have let into the project, and whether anyone else can read it.' },
]

// ── Walkthroughs ──────────────────────────────────────────────────────────────
export const WALKTHROUGHS = [
  {
    id: 'save-ai-work',
    title: 'I built something with an AI and need to save it',
    steps: [
      'Connect GitHub',
      'Choose or create a project',
      'Add the project files',
      'Review what will be saved',
      'Create a Save Point',
      'Confirm it saved to GitHub',
    ],
  },
  {
    id: 'invite-collaborator',
    title: 'I want another person to help',
    steps: [
      'Open Project Settings',
      'Choose Sharing',
      'Invite collaborator by GitHub username or email',
      'Select an access level',
      'Send the invitation',
    ],
  },
  {
    id: 'handoff-ai',
    title: 'I want to give Claude, Manus, or another AI my project',
    steps: [
      'Open the project in Yourk',
      'Click Continue with AI',
      'Select the AI tool',
      'Review the included context',
      'Copy or open the handoff',
    ],
  },
  {
    id: 'undo-mistake',
    title: 'I think I broke something',
    steps: [
      'Open Save Points',
      'Find an earlier version',
      'See what changed since then',
      'Restore that version',
      'Save the restored version to GitHub',
    ],
  },
]

// ── Roles / access levels ─────────────────────────────────────────────────────
export const ROLES = [
  { level: 'View',       meaning: 'Can read the project' },
  { level: 'Contribute', meaning: 'Can suggest or make changes' },
  { level: 'Manage',     meaning: 'Can control most project settings' },
  { level: 'Owner',      meaning: 'Has full control' },
]

// ── The tasks people arrive with ──────────────────────────────────────────────
// `summary` is what the card shows; the full answer opens below it.
export const GOALS = [
  { id: 'understand', label: 'I want to understand GitHub',  summary: 'What it is for, and the five things that actually matter.' },
  { id: 'save',       label: 'I want to save my project',    summary: 'Keep a version you can come back to, without a terminal.' },
  { id: 'share',      label: 'I want to share my project',   summary: 'Links, collaborators, AI tools, and public vs private.' },
  { id: 'ai',         label: 'I want to use an AI tool',     summary: 'Hand the whole project over so the AI knows the context.' },
  { id: 'changes',    label: 'I want to see what changed',   summary: 'Compare versions line by line and read the project story.' },
  { id: 'undo',       label: 'I want to undo a mistake',     summary: 'Go back to an earlier Save Point without losing anything newer.' },
  { id: 'publish',    label: 'I want to publish my app',     summary: 'What deploying means, and what Yourk does and does not do yet.' },
  { id: 'link',       label: 'I received a GitHub link',     summary: 'How to read a GitHub address and what to do with it.' },
]

// ── When something looks wrong ────────────────────────────────────────────────
// Every answer here describes real Yourkly behaviour. If one stops being true,
// fix the app or fix the answer — do not leave both.
export const TROUBLESHOOTING = [
  {
    id: 'edits-not-on-github',
    q: "I edited a file, but GitHub doesn't show my change",
    a: [
      'Edits you make in Yourk are drafts on this computer. They stay on this computer until you open Review and save and press the save button.',
      'Open the project and look for "Changes not saved yet". Everything listed there is waiting for you — nothing has reached GitHub.',
    ],
    link: { label: 'Where saving happens', to: '/help/how-it-works' },
  },
  {
    id: 'ai-changes-missing',
    q: "The AI says it changed my files, but Yourk shows nothing",
    a: [
      'Yourk can only see work that is in GitHub. If the AI edited files in its own workspace and never saved them to your project, there is nothing for Yourk to find yet.',
      'Ask the AI to save its work to GitHub, then open the update and choose Review project changes. Yourk compares your project against the version it recorded when you marked the handoff as sent.',
    ],
    link: { label: 'How handoffs work', to: '/help/tasks' },
  },
  {
    id: 'cannot-check',
    q: 'Yourk says it can\'t check what changed while you were away',
    a: [
      'That message is honest, not broken. Yourk records the exact version your project was at when you pressed "Mark as sent". If that record is missing — usually because GitHub could not be reached at that moment — there is no before-picture to compare against.',
      'You can still see everything in Save Points: every version saved to GitHub is listed there with what changed.',
    ],
    link: { label: 'Save Points explained', to: '/help/glossary' },
  },
  {
    id: 'no-projects',
    q: 'I signed in but I see no projects',
    a: [
      'Yourk lists the projects your GitHub account can reach. If a project belongs to an organisation, that organisation may need to approve Yourk before it appears.',
      'If the list is genuinely empty, you have not created a project yet. Start a new project and it shows up straight away.',
    ],
    link: { label: 'Start a new project', to: '/new' },
  },
  {
    id: 'lost-work',
    q: 'I closed the tab — is my unsaved work gone?',
    a: [
      'No. Drafts are kept in this browser, on this computer, and are still there when you come back. They are not gone until you save them or clear your browser data.',
      'They are also not backed up. A draft only exists on the one computer you typed it on, which is why Yourk keeps saying to save.',
    ],
    link: { label: 'Why saving matters', to: '/help/tasks' },
  },
  {
    id: 'undo-a-save',
    q: 'I saved something I did not mean to save',
    a: [
      'Nothing is lost. Open Save Points, find the version from before the mistake, and restore it. Restoring puts the old content back as a new Save Point — the newer version is still in the history.',
      'That means you can always undo the undo.',
    ],
    link: { label: 'Undoing a mistake', to: '/help/tasks' },
  },
]

// ── The browser extension ─────────────────────────────────────────────────────
// Yourkly's sibling: github.com/Naylahknee/yourkly-extension. This app explains
// your own projects; the extension explains the technical web while you browse
// it — GitHub included, but also Vercel, Netlify, Stripe and others.
//
// Everything below is taken from that repository's README and manifest. It is
// not in the Chrome Web Store yet, so the install is Developer mode + Load
// unpacked, and this says so rather than implying a one-click install.
export const EXTENSION = {
  url: 'https://github.com/Naylahknee/yourkly-extension',
  name: 'Yourk for your browser',
  tagline: 'Like Google Translate, but for tech jargon.',
  body: 'A Chrome extension that explains technical words on the sites themselves — GitHub, Vercel, Netlify, Stripe and more. Hover a term for a plain-English tooltip, or open the side panel for what a page is asking you to do.',
  points: [
    'Works offline. The glossary ships with the extension; nothing is sent anywhere unless you ask for a deeper explanation.',
    'AI is optional and off by default. If you turn it on, you bring your own key and it stays on your computer.',
    'Not in the Chrome Web Store yet — you install it from GitHub with Developer mode turned on.',
  ],
  cta: 'Get it on GitHub',
}

// ── Contact ───────────────────────────────────────────────────────────────────
// A real destination. Yourkly has no support desk, so this opens a GitHub issue
// on the repository this app is built from — the place a report can actually be
// read and answered. Never advertise a channel that nobody reads.
export const CONTACT_REPO = 'Naylahknee/yourkly'

export function issueUrl({ kind, summary, section }) {
  const body = [
    '**What happened**',
    summary || '',
    '',
    '**What I expected instead**',
    '',
    '',
    '**Where in Yourk**',
    section || '',
    '',
    '---',
    '_Sent from Help → Contact support._',
  ].join('\n')
  const params = new URLSearchParams({
    title: kind ? `${kind}: ` : '',
    body,
  })
  return `https://github.com/${CONTACT_REPO}/issues/new?${params.toString()}`
}

// ── Search index ──────────────────────────────────────────────────────────────
// One flat list of everything Help can answer, so the field at the top of the
// section searches topics and glossary together.
export function searchIndex() {
  const rows = []
  STEPS.forEach((s, i) => rows.push({
    kind: 'Step ' + (i + 1), title: s.title, body: s.body,
    to: `/help/how-it-works?step=${i}`,
  }))
  GOALS.forEach(g => rows.push({
    kind: 'Task', title: g.label, body: g.summary,
    to: `/help/tasks?goal=${g.id}`,
  }))
  GLOSSARY.forEach(g => rows.push({
    kind: 'Word', title: g.term, body: `GitHub calls this ${g.github}. ${g.def}`,
    to: `/help/glossary?q=${encodeURIComponent(g.term)}`,
  }))
  TROUBLESHOOTING.forEach(t => rows.push({
    kind: 'Problem', title: t.q, body: t.a[0],
    to: `/help/troubleshooting?open=${t.id}`,
  }))
  WALKTHROUGHS.forEach(w => rows.push({
    kind: 'Walkthrough', title: w.title, body: w.steps.join(' · '),
    to: `/help/tasks?walk=${w.id}`,
  }))
  // So searching "extension", "browser" or "tooltip" finds it.
  rows.push({
    kind: 'Extension',
    title: EXTENSION.name,
    body: `Browser extension. ${EXTENSION.body}`,
    to: '/help',
  })
  return rows
}

export function search(query) {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return searchIndex()
    .map(row => {
      const title = row.title.toLowerCase()
      const body = (row.body || '').toLowerCase()
      // Title matches beat body matches, and a match at the start beats one in the middle.
      let score = 0
      if (title.startsWith(q)) score = 3
      else if (title.includes(q)) score = 2
      else if (body.includes(q)) score = 1
      return { ...row, score }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
