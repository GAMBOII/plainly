# FIX FIRST — why the redesign isn't working

**Repo:** `Naylahknee/yourkly@main` (read at commit tree `64f423ae`)
**Read this before touching `HANDOFF.md` again.**

The last pass added support utilities (`projectMemory.js`, `taskMemory.js`, `aiPrompt.js`) and a `ProjectAIModal`. Those are useful. But the **structure** of the redesign was not built, so there is nothing for the design to live in. Fix these four things, in this order. Do not build any new screen until steps 1 and 2 are done — anything built before then will have to be thrown away.

---

## Blocker 1 — The data model cannot express the design

`taskMemory.js` stores tasks with `status: 'open' | 'in-progress'`. The design runs on a **seven-state lifecycle**, and every status pill, the lifecycle indicator, and the recommended next step read from it.

Worse: **nothing stores a commit sha at handoff time.** "What changed since you left off" is the second of the three questions the home screen must answer, and with the current data it is impossible to compute — not hard, impossible. There is no baseline to compare the branch head against.

### Do this

Rename the concept from **task** to **update** throughout (the UI word is "update" — keep them the same word so the code stays readable). Replace the status field:

```js
// src/utils/updateMemory.js  (rename of taskMemory.js)

export const STATUSES = [
  'planned', 'ready_for_ai', 'sent_to_ai', 'changes_detected',
  'waiting_for_review', 'ready_to_save', 'saved'
]
// plus off-path: 'needs_correction', 'paused'

export const STATUS_LABEL = {
  planned: 'Planned',
  ready_for_ai: 'Ready for AI',
  sent_to_ai: 'Sent to AI',
  changes_detected: 'Changes detected',
  waiting_for_review: 'Waiting for review',
  ready_to_save: 'Ready to save',
  saved: 'Saved',
  needs_correction: 'Needs correction',
  paused: 'Paused'
}
```

Every update record needs these fields added:

```js
{
  id, title, goal, status,
  ai: null,                  // 'Claude' | 'ChatGPT' | 'Bob' | 'Codex' | 'You' | null
  files: [],                 // paths this update touches
  lastActivityAt: null,
  savePoint: null,           // e.g. 'v18', set when saved
  handoff: {
    sentAt: null,
    tool: null,
    includedContext: [],     // which context checkboxes were on
    commitShaAtSend: null    // ← THE CRITICAL FIELD. Without it, nothing works.
  },
  story: []                  // [{ what, at }] — append on every state change
}
```

And on the project memory record, add `lastSeenCommitSha`.

**`commitShaAtSend` is the whole mechanism.** When the user presses "Mark as sent to Claude", capture the current branch head sha. When they come back, compare it to the head now. That single comparison produces all five return-detection branches. Nothing else in the design needs to change for change-detection to start working.

Write a one-time migration that reads any existing `plainly_tasks_*` keys, maps `open`/`in-progress` → `planned`, and writes them to the new shape. Don't orphan the user's existing data.

---

## Blocker 2 — The routes don't exist

`App.jsx` has 6 routes. The design needs 21. Right now `/p/:repo` renders `Files.jsx`, which means **the file browser is still the centre of the product** — the exact thing this redesign moves away from.

Add these. Every one must resolve; a nav item pointing nowhere is worse than no nav item.

```jsx
{/* global */}
<Route path="/"          element={token ? <Home/>       : <Welcome/>} />
<Route path="/projects"  element={<Projects/>} />      {/* today's "/" list moves here */}
<Route path="/activity"  element={<Activity/>} />
<Route path="/account"   element={<Account/>} />
<Route path="/new"       element={<NewProject/>} />
<Route path="/help"      element={<Help/>} />

{/* project */}
<Route path="/p/:repo"             element={<ProjectHome/>} />   {/* NOT Files */}
<Route path="/p/:repo/updates"    element={<Updates/>} />
<Route path="/p/:repo/new-update" element={<NewUpdate/>} />
<Route path="/p/:repo/files"      element={<Files/>} />          {/* today's Files list */}
<Route path="/p/:repo/f/*"        element={<Files/>} />          {/* today's editor */}
<Route path="/p/:repo/save"       element={<ReviewAndSave/>} />
<Route path="/p/:repo/changed"    element={<WhatChanged/>} />
<Route path="/p/:repo/points"     element={<SavePoints/>} />
<Route path="/p/:repo/versions"   element={<Versions/>} />
<Route path="/p/:repo/share"      element={<Share/>} />
<Route path="/p/:repo/settings"   element={<Settings/>} />

{/* update */}
<Route path="/p/:repo/u/:updateId"        element={<UpdateWorkspace/>} />
<Route path="/p/:repo/u/:updateId/ai"     element={<ContinueWithAI/>} />
<Route path="/p/:repo/u/:updateId/return" element={<ReturnFromAI/>} />
<Route path="/p/:repo/u/:updateId/review" element={<ReviewAIChanges/>} />
```

The single most important line there is `/p/:repo` → **`ProjectHome`, not `Files`**. That one change is what turns Yourkly from a file browser into what the design describes.

`ProjectTimeline.jsx` is close to the Updates list — repoint it at `/p/:repo/updates` and reshape it rather than starting over.

---

## Blocker 3 — `heroFor()` was skipped

This was §6 of the handoff and it is the difference between the design working and the design lying to the user. Three screens (Home hero, Project Home, update workspace) all display the same four fields. If each computes them independently, they drift, and you get a "Saved" update with a button saying "Continue working on it."

Create **one** module. Every screen imports it. No screen writes its own version.

```js
// src/utils/heroFor.js
export function heroFor(u, { files, activity }) { … }
// returns { left, since, next, cta, route }
```

Copy the switch statement verbatim from `HANDOFF.md` §6 — all seven cases. The strings are the product; don't paraphrase them.

Same rule for the project-level recommendation: one function, the seven ordered rules from §6, first match wins, only ever one recommendation on screen.

---

## Blocker 4 — There is no app shell

Search the CSS and the only `.sidebar` is `.file-sidebar` — the file list *inside* `Files.jsx`. The only `.dashboard` is the old repo list. The app-level left navigation from the design doesn't exist, which is why nothing feels like the mockup no matter what styles get applied.

Build one `<AppShell>` component that every signed-in route renders inside:

- 248px white column, `border-right: 1px solid var(--grey-light)`, sticky, full height
- Wordmark + tagline "GitHub in plain English"
- Global nav: Home · My Projects · Recent Activity · Account · Help
- Project nav, rendered **only** when inside a project, under a grey uppercase heading with the project name: Project Home · Updates · Make an Update · Project Files · What Changed · Save Points · Separate Versions · Who Can See It · Continue with AI · Settings
- Active item: 3px `var(--purple)` bar on the row's left edge, transparent background. Hover `#F7F6FC`.
- Footer: avatar, GitHub login, connection status

Content area: `padding: 44px 48px 64px`, max-width per screen as specced.

Stop adding screens to `Files.jsx` (already 40KB) and `Help.jsx` (25KB). Each screen in the handoff is its own file under `src/pages/`.

---

## Two smaller things worth fixing in the same pass

**`useAuth.js` silently signs the user out on any `getUser` failure.** A routine expired token dumps them on the sign-in page with no explanation and no idea whether their work survived. Distinguish 401 from a network error, keep the token, and render the "Yourkly needs you to sign in again" screen from §7.19 — the one that explicitly tells them nothing was lost.

**`ProjectAIModal.jsx` is a modal.** Continue with AI is a full screen at `/p/:repo/u/:updateId/ai`. It has four numbered steps including an eight-item context checklist and a scrollable handoff preview; it does not fit in a modal, and more importantly a modal can't be linked to, which the "you left off here" flow depends on. Convert it — the prompt-building logic in `aiPrompt.js` is reusable, the container isn't.

---

## Order of work

1. Migrate the data model (Blocker 1) — nothing else is buildable first
2. Add routes + `AppShell` (Blockers 2 and 4) as empty stubs, so navigation works end to end
3. Add `heroFor.js` (Blocker 3)
4. Build Home → Project Home → Updates → Update workspace → Continue with AI → Return → Review, in that order
5. Move the existing Files/History screens under their new routes unchanged
6. Then the remaining screens from `HANDOFF.md`

Stop after step 3 and confirm: can you click to every route without a dead end, and does one update's status produce the same four sentences on all three screens? If yes, the rest is just filling in screens. If no, don't continue.

## Still true from HANDOFF.md

Don't fabricate data — no invented counts, filenames, or timestamps. Anything not yet computable shows the honest fallback with the dashed "Requires implementation" badge. Don't commit, push, or deploy. Run `npm run build` and report the result.
