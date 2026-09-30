# Yourkly redesign — implementation handoff

**For:** Bob / Claude Code / Codex working in `Naylahknee/yourkly` (branch `main`)
**Design source of truth:** `Yourkly v2.dc.html` (prototype, in the design project — ask NaLonni for it if you don't have it)
**Written:** 2026-07-28

---

## 0. Rules for whoever implements this

- Build **exactly** the screens, copy, states, and rules described here. Where this document gives literal copy, use that copy verbatim — the wording is the product.
- **Do not** change anything not named in this document.
- **Preserve** working GitHub OAuth (`src/hooks/useAuth.js`, `api/oauth/exchange.js`), repo access (`src/api/github.js`), file editing, DOMPurify sanitization, history/diff/restore.
- **Do not** fabricate GitHub data. Every number, name, and timestamp on screen must come from a real API response or from Yourkly's own stored memory. If a value is unavailable, show the honest fallback given below.
- **Do not** add a chatbot. There is no in-app AI in this scope.
- **Do not** commit, push, merge, or deploy. Leave the work for NaLonni to review.
- Run `npm run build` before reporting. Report the result.
- Anything marked **[REQUIRES BACKEND]** needs new logic — do not fake it with hardcoded values. If you cannot implement it this pass, render the honest "not available yet" state described.

---

## 1. What this redesign changes, in one paragraph

Today Yourkly is a repo list that opens into a file editor. After this change, Yourkly is organised around **updates** — one thing the user wants to change, in their own words. GitHub is still the storage. The app's job is to answer, every time it opens: where did I leave off, what happened since, what should I do next. The file browser stays, but it is no longer the centre of the product.

---

## 2. Visual system (already in the repo — do not invent new values)

From `src/index.css`:

```
--purple:      #6C5CE7   primary actions, active nav, links
--purple-dark: #5849c4   primary hover
--ink:         #1C1B22   headings, body
--canvas:      #FBFAF8   page background
--grey:        #8A8794   secondary text, labels
--grey-light:  #ECEAF4   card borders
--grey-border: #D8D6E3   input + secondary button borders
--success:     #00B894   saved / all-clear
--radius:      10px
```

Additional values used by the redesign (add to `:root`):

```
--lilac-bg:     #F4F2FB   guidance strips, selected chips
--lilac-border: #E4E0F7   emphasised card borders
--lilac-soft:   #C9C2F0   folder glyphs, chevrons, hover borders
--amber:        #A3702A   attention text
--amber-bg:     #FAF1E1   attention pill
--amber-edge:   #E3B14C   left border on attention cards
--red:          #8C3A33   destructive / conflict text
--red-bg:       #FBEBEA   conflict pill
--red-border:   #F3D9D6   destructive card border
--green-deep:   #008B70   "saved" pill text
--green-bg:     #E6F9F4   success surface
--ink-soft:     #4A4753   body copy inside cards
--radius-card:  14px
--radius-hero:  18px
--shadow-hero:  0 8px 34px rgba(108,92,231,.12)
--shadow-card:  0 4px 18px rgba(108,92,231,.08)
```

Type: Inter (already loaded). Page titles 30px/700/-.03em. Hero update title 34px/700. Card titles 16.5px/600. Body 15–16.5px/1.5. Labels 12px/600 uppercase, letter-spacing .08em, colour `--grey`. Never below 13px.

Layout: 248px white left sidebar, `border-right: 1px solid --grey-light`, sticky full height. Content area `padding: 44px 48px 64px`, `max-width` 660–1000px depending on screen (given per screen below).

One primary purple button per screen. Everything else is white with `--grey-border`. Hover on secondary buttons: border and text go `--purple`.

---

## 3. Navigation (labels are fixed — never use a synonym)

**Global sidebar:** Home · My Projects · Recent Activity · Account · Help
**Project sidebar** (appears only when inside a project, under a `--grey` uppercase heading showing the project name):
Project Home · Updates · Make an Update · Project Files · What Changed · Save Points · Separate Versions · Who Can See It · Continue with AI · Settings

Active global nav item: 3px `--purple` bar on the left edge of the row, `background: transparent`. Hover: `#F7F6FC`.

Sidebar footer: avatar (28–30px circle), GitHub login, and connection status in `--success` ("GitHub connected") or `--amber` ("Connection needs renewing").

---

## 4. Routes

| Route | Screen | Status |
|---|---|---|
| `/` | Home dashboard (signed in) / Welcome (signed out) | modify existing |
| `/auth/callback` | OAuth callback | keep as-is |
| `/projects` | My Projects | new (today's `/` list moves here) |
| `/activity` | Recent Activity | new |
| `/account` | Account | new |
| `/help` | How Yourkly works + glossary | modify existing |
| `/new` | Start a new project | new (replaces the modal in `Projects.jsx`) |
| `/p/:repo` | Project Home | new |
| `/p/:repo/updates` | Updates list | new |
| `/p/:repo/u/:updateId` | Update workspace | new |
| `/p/:repo/u/:updateId/ai` | Continue with AI | new |
| `/p/:repo/u/:updateId/return` | Return from AI | new |
| `/p/:repo/u/:updateId/review` | Review AI changes | new |
| `/p/:repo/new-update` | Make an Update | new |
| `/p/:repo/files` | Project Files | today's `Files.jsx` list |
| `/p/:repo/f/*` | File editor | today's `Files.jsx` editor |
| `/p/:repo/save` | Review and save | new (extracted from `Files.jsx`) |
| `/p/:repo/changed` | What Changed | today's `History.jsx` |
| `/p/:repo/points` | Save Points / restore | today's `History.jsx` restore |
| `/p/:repo/versions` | Separate Versions | new |
| `/p/:repo/share` | Who Can See It | new |
| `/p/:repo/settings` | Project Settings | new |

Every route must resolve — no 404s, no dead `<Link>`s. The existing catch-all redirect to `/` stays.

---

## 5. Project Memory — the data model **[REQUIRES BACKEND]**

GitHub cannot store "the user was redesigning onboarding." Yourkly must. Persist one memory record per project. Start with `localStorage` keyed `plainly_memory_v1`; move it server-side later without changing the shape.

```json
{
  "projectId": "Naylahknee/kolmari",
  "description": "The main product build — instructions, design files and app code.",
  "lastOpenedAt": "2026-07-27T21:14:00Z",
  "lastFile": "DESIGN.md",
  "currentUpdateId": "u_8f21",
  "lastSeenCommitSha": "8f3c1ad...",
  "updates": [
    {
      "id": "u_8f21",
      "title": "Improve mobile navigation",
      "goal": "Make the menu easier to use on phones.",
      "status": "waiting_for_review",
      "ai": "Claude",
      "files": ["src/pages/Files.jsx", "src/index.css", "src/App.jsx"],
      "createdAt": "...",
      "lastActivityAt": "...",
      "handoff": {
        "sentAt": "...",
        "tool": "Claude",
        "includedContext": ["overview","goal","left","rules","files","recent","limits","report"],
        "commitShaAtSend": "c19b402..."
      },
      "story": [
        { "what": "You described this update", "at": "..." },
        { "what": "You marked it as sent to Claude", "at": "..." },
        { "what": "Yourkly noticed 3 files changed in GitHub", "at": "..." }
      ]
    }
  ]
}
```

Never store tokens, secrets, or full file contents in memory records. `lastSeenCommitSha` is what makes return-detection possible.

### Update statuses (exactly these, in this order)

`planned` → `ready_for_ai` → `sent_to_ai` → `changes_detected` → `waiting_for_review` → `ready_to_save` → `saved`
Plus two off-path: `needs_correction`, `paused`.

Display labels: Planned · Ready for AI · Sent to AI · Changes detected · Waiting for review · Ready to save · Saved · Needs correction · Paused.

Status pill colours: Planned/Paused `--grey-light`/`#5C5866` · Ready for AI + Sent to AI `--lilac-bg`/`--purple` · Changes detected + Waiting for review `--amber-bg`/`--amber` · Needs correction `--red-bg`/`--red` · Ready to save + Saved `--green-bg`/`--green-deep`.

---

## 6. The single most important rule: one status → four fields

The home hero, Project Home, and the update workspace **must all read from one derivation**. Do not compute these fields independently anywhere — that is how they end up contradicting each other.

```js
// files = u.files.length === 1 ? '1 file' : u.files.length + ' files'
// activity = humanTime(u.lastActivityAt)  → "Today at 4:22 PM", "10 hours ago"

function heroFor(u, files, activity) {
  switch (u.status) {
    case 'saved': return {
      left:  'You finished this update and saved it to GitHub.',
      since: `Saved to GitHub ${activity} as Save Point ${u.savePoint} — ${files}, nothing outstanding.`,
      next:  "Nothing left to do on this one. Pick another update when you're ready.",
      cta:   'See what changed', route: 'changed'
    };
    case 'planned': return {
      left:  "You described this update and haven't started it yet.",
      since: `Nothing yet — nobody has worked on this. Last touched ${activity}.`,
      next:  'Hand it to an AI, or start editing yourself.',
      cta:   'Start this update', route: 'ai'
    };
    case 'sent_to_ai': return {
      left:  `You handed this update to ${u.ai} and marked it as sent.`,
      since: `Nothing has changed in GitHub since you sent it — last activity ${activity}.`,
      next:  `Check whether ${u.ai} has saved any work yet.`,
      cta:   'Check for changes', route: 'return'
    };
    case 'changes_detected':
    case 'waiting_for_review': return {
      left:  `You handed this update to ${u.ai} and marked it as sent.`,
      since: `${files} changed in GitHub — last activity ${activity}. Nobody has read through those changes or made a Save Point for them yet.`,
      next:  'Read what changed before anything is saved.',
      cta:   'Review the changes', route: 'review'
    };
    case 'ready_to_save': return {
      left:  u.ai === 'You'
        ? 'You were editing this yourself — no AI involved.'
        : `You reviewed what ${u.ai} changed and accepted it.`,
      since: `${files} edited and reviewed — last activity ${activity}. Not in GitHub yet.`,
      next:  "Save it to GitHub so it's backed up.",
      cta:   'Review and save', route: 'save'
    };
    // needs_correction / paused: see §7.4
  }
}
```

The primary button's label is `cta` and its destination is `route`. **Never** show a "Continue this update" button on a finished update.

### Project-level recommended next step (deterministic, no AI)

Evaluate in order, stop at the first match:

1. GitHub connection expired → "Sign in again to keep working." → Reconnect
2. GitHub has commits Yourkly hasn't seen, and the user has local edits → "Get the latest version before you edit — GitHub is ahead of this computer." → Get latest version
3. An update is `changes_detected` or `waiting_for_review` → "Read what changed before anything is saved." → Review the changes
4. Unsaved local edits exist → "Review and save your changes so they're safe in GitHub." → Review and save
5. An update is `sent_to_ai` → "Check whether {AI} has saved any work yet." → Check for changes
6. An update is `planned` → "Hand it to an AI, or start editing yourself." → Start this update
7. Otherwise → "Describe what you want to change next." → Make an update

Never show more than one recommendation.

---

## 7. Screens

### 7.1 Welcome (signed out) — `/`

Two columns, max-width 940px, centred, background `linear-gradient(180deg,#FBFAF8,#F4F2FB)`.

Left: wordmark `yourkly` (26px/700, `--purple`). H1 46px/700/-.03em: **"Your GitHub projects, in plain English."** Then 19px: *"Yourkly sits on top of the GitHub account you already have and does one job: tell you where you left off, what changed, and what to do next — without the jargon."* Then 15px `--grey`: *"Your files stay in your real GitHub repositories. Nothing is copied anywhere else."* Then the primary button **Sign in with GitHub** (16px, 12px radius, purple shadow) and under it, centred, 13px `--grey`: *"No new password. Your GitHub account is your login."*

Right: a white card, label "WHAT YOURKLY CALLS THINGS", six rows `grey term → bold Yourkly term`, hairline dividers: Repository → Project · Commit → Save Point · Push → Save to GitHub · Pull → Get latest version · Branch → Separate version · Diff → See what changed.

This screen exists because the current sign-in never says what the product is for. Do not shorten it.

Error state (`?auth_error`): keep the existing message.

### 7.2 First run — `/` with zero repos

H1 32px: "You're in, {FirstName}." Body: *"Your GitHub account is connected but there are no projects in it yet. A project is one place for everything that belongs together — an app, a book, a client job."* One card: "Make your first project" + *"It takes one line: a name and what it's for. From then on Yourkly keeps every version of your work and tells you what changed."* + primary **Start a new project**. Below, a text link: **"Show me how Yourkly works first →"** → `/help`.

### 7.3 Home dashboard — `/` (max-width 1000px)

Order on the page, top to bottom:

1. H1 30px `{greeting}, {FirstName}.` (`greeting()` already exists in `src/utils/time.js`) with a secondary **All projects** button right-aligned (`white-space: nowrap`). Subtitle 15.5px `--grey`: *"Here's where you left off, what changed, and what to do next."*

2. **Dismissible explainer** (`--lilac-bg`, `--lilac-border`, 14px radius): "New here? This is what Yourkly does." / *"Your work lives in GitHub. Yourkly is the front door: it remembers where you stopped, explains what changed in normal words, and keeps a Save Point every time you save so you can always go back."* + a **Got it** text button that persists dismissal.

3. **CONTINUE WHERE YOU LEFT OFF** — the dominant element. White card, `--lilac-border`, 18px radius, `--shadow-hero`, padding 32px 34px. Inside:
   - Line of context: project name in `--purple` 14px/600 · "Update" · status pill (`white-space: nowrap`)
   - Update title, 34px/700/-.03em
   - Goal, 16.5px `--ink-soft`
   - A `#FBFAFE` panel with three labelled rows in fixed order, label column 180px: **Where you left off** / **What's happened since** / **What to do next** (this last label in `--purple`, its value 600 weight). All three values come from `heroFor()` — §6.
   - Buttons: primary 17px `{cta}`, then secondary **Open the update**, then a text button **"{n} updates in progress →"**.

   If there is no current update, the hero instead shows the most recent project with: "You haven't started an update yet." / next step "Describe what you want to change." / primary **Make an update**.

4. **WHAT NEEDS YOUR ATTENTION** — only real items, driven by state. Card with a 4px `--amber-edge` left border, a plain explanation of why it matters, and exactly one action. If nothing qualifies: a single calm row with a `--success` tick — *"Nothing needs you right now. Everything is saved in GitHub."* Never invent items.

5. Two columns (1.5fr / 1fr): **RECENT PROJECTS** (cards: name + status pill + description + last meaningful action + `github.com/{owner}/{repo}` in monospace 12px `--grey`) and **RECENT ACTIVITY** (dot + plain sentence + "Project · time"). Each column ends in a text link to its full page.

Status pill labels for projects: "Up to date" · "Changes not saved" · "Needs review" · "Last saved yesterday" · "GitHub connection needed".

### 7.4 Update workspace — `/p/:repo/u/:updateId` (max-width 880px)

- Back link "← All updates"
- Context line: "{project} · Update" + status pill
- Title 32px, goal 16.5px
- **"Where this update is up to"** — the seven lifecycle labels in a row, each with a 10px dot: done = `--success`, current = `--purple` (label 600 weight, `--ink`), future = `--lilac-border` (label `--grey`). This is a read-only indicator, not a control.
- **Recommended next step** strip (`--lilac-bg`): `next` text + primary button `{cta}` (§6)
- Two cards side by side: **Details** (AI used / files affected / last activity) and **Files in this update** (each row a button opening that file)
- **The story of this update** **[REQUIRES BACKEND]** — the memory `story` array, dot + sentence + timestamp. Until the memory layer exists, render the card with the dashed **"Requires implementation"** badge (11px/600, 1px dashed `--lilac-soft`, `--purple` text, 6px radius) and no invented events.
- Footer buttons: Continue with AI · Review the changes · Pause this update

`needs_correction` shows the red pill and next step *"Ask the AI to fix what it got wrong."* → Continue with AI, pre-filled with the correction. `paused` shows next step *"Pick this back up when you're ready."* → Continue this update.

### 7.5 Updates list — `/p/:repo/updates` (max-width 860px)

Intro: *"An update is one thing you want to change, described in your words. Yourkly keeps track of what it touched, which AI worked on it, and whether it's saved. {n} updates in progress."* Header has a primary **Make an update**.

Each row: title + status pill / goal / "Worked on with {AI} · {n} files affected · Last activity {time}" and, right-aligned, a "Next step" label with that update's own next step in `--purple` 13.5px/600.

### 7.6 Make an Update — `/p/:repo/new-update` (max-width 740px)

H1 **"What do you want to change?"** Body: *"Describe the result you want. You do not need to know which file or technical step is involved."* Textarea min-height 130px, placeholder: *"Add a clearer welcome message to the homepage and make the main button easier to find."*

On submit, create the update record (`status: planned`) and show a summary card: **Your update** → "What you want" (their words) → "Likely area involved" → "Suggested next step". For "Likely area involved", **do not guess**. Unless you have a real signal, print: *"Yourkly has not confirmed which file controls this. Your AI can find it from the project contents included in the handoff."* Actions: **Continue with AI** (primary) · Browse project files · Save task for later.

### 7.7 Continue with AI — `/p/:repo/u/:updateId/ai` (max-width 860px)

Intro: *"Yourkly writes a handoff with everything the AI needs to pick up where you left off. Copy it, paste it into your AI, then come back and save what it produced."*

If a handoff already exists for this update, a `--lilac-bg` strip at the top: **"You continued this project with {AI} {time ago}."** / *"Did you make changes? Yourkly can only see them once they're in your files."* + **Review project changes**.

Then four numbered steps:

1. **"Which AI are you using?"** — chips: Claude · ChatGPT · Bob · Codex · Other. Selected chip = purple fill, white text.
2. **"What Yourkly is packing"** — a checklist of eight context items, each with a label, a `--grey` detail line, and a 22px checkbox. The first three are always on and show "Always included" on the right:
   - What this project is — *Your project description and README* (locked)
   - What you asked for — *The goal of this update, in your words* (locked)
   - Where you left off — *Last file, last Save Point, last AI* (locked)
   - Your project instructions — *DESIGN.md and AGENTS.md*
   - {n} files you picked — *the update's file list*
   - Recent changes — *Your last 3 Save Points and what they changed*
   - What not to touch — *Do not change anything outside this update*
   - How to report back — *List the files changed, in plain English*

   Unchecking an item **must remove that section from the handoff preview below**. A toggle that changes nothing is worse than no toggle.
3. **"Your handoff"** — monospace preview, max-height ~330px, scrollable. Buttons: **Copy handoff** (primary; label becomes "Copied ✓") · **Open {AI}** · a `--grey` note confirming what happened.
4. **"Tell Yourkly you've sent it"** — `--lilac-bg` strip + **Mark as sent to {AI}**. This is what sets `handoff.sentAt` and `commitShaAtSend`, which is what makes return-detection possible. Note: *"Do this so Yourkly knows to watch for changes when you come back."*

**Handoff format** — generate exactly this shape, omitting any unchecked section:

```
PROJECT: {name} (GitHub: {owner}/{repo})
WHAT IT IS: {description}

THE UPDATE I AM WORKING ON: {update title}
WHAT I WANT YOU TO DO:
{update goal}

WHERE I LEFT OFF:
- Status of this update: {status label}
- Last worked on with: {AI} ({time})
- Last file open: {file}
- Current version: {branch}, {save point}
- Unsaved edits on this computer: {yes, in X / no}

PROJECT INSTRUCTIONS (from DESIGN.md):
{contents}

AGENTS.md also applies — follow it for anything about how you work.

FILES FOR THIS UPDATE:
{list, or "(none picked yet — find them yourself and tell me which ones you used)"}

EVERYTHING IN THIS PROJECT:
{flat listing with folders as name/ (child, child)}

RECENT SAVE POINTS:
1. {title}
2. {title}
3. {title}

WHAT NOT TO TOUCH:
- Do not change anything outside this update.
- Do not save or push anything to GitHub — I will do that in Yourkly.

HOW TO REPORT BACK:
- List every file you changed and say what you changed, in plain English.
- Tell me anything you had to change that I did not ask about, and why.
```

### 7.8 Return from AI — `/p/:repo/u/:updateId/return` **[REQUIRES BACKEND]**

Detection: compare `handoff.commitShaAtSend` against the branch head now; look at which files changed and whether new commits were authored outside Yourkly.

H1 **"You continued this update with {AI}."** Body: *"Yourkly checked GitHub to see what happened while you were away."* Then exactly one of five branches — chosen from real state, never from a flag:

1. **Changes detected** (files changed > 0): amber tick + "**{n} files changed after your handoff**", then What you asked for / What changed / Worth a look, then a recommended-step panel *"Read the plain-English review before anything is saved."* + primary **Review changes**.
2. **Nothing yet** (no new commits): "Nothing has changed yet" / *"Your project in GitHub looks exactly as it did before the handoff. That usually means the AI hasn't saved its work yet — or it made changes somewhere Yourkly can't see, like on your own computer."* → **Check again** · Send the handoff again.
3. **Already saved externally** (new commits not authored by Yourkly): green tick + "The AI already saved this work to GitHub" / *"There are {n} new Save Points that Yourkly didn't create. Your work is safe — but nobody has read through it in plain English yet, so it's worth a look before you build on top of it."* → **Read what changed** · See the Save Points.
4. **GitHub is newer than local** (remote ahead + local edits): red-bordered card, "GitHub has a newer version than the one on this computer" / *"Get the latest version first. If you edit now, you'd be working from an old copy and Yourkly would have to ask you to choose between them later."* → **Get latest version** · See what's different first.
5. **Can't check** (network/API failure): "Yourkly can't check GitHub right now" / *"This is a connection problem, not a problem with your work. Nothing has been lost, and nothing will be saved until you say so."* → **Try again** · Back to the update.

Every count and filename here must be real. If you can't compute it, use branch 5.

### 7.9 Review AI changes — `/p/:repo/u/:updateId/review` (max-width 840px)

H1 **"What {AI} changed"**. Body: *"In plain English first. Nothing here is saved to GitHub until you choose to save it."*

Four stacked cards, in this order:

1. **WHAT YOU ASKED FOR** — the update goal, verbatim from the user
2. **WHAT CHANGED** — plain summary
3. **WHAT ELSE CHANGED** — amber card, 4px `--amber-edge` left border, label in `--amber`. Files touched that the request didn't mention. If none: *"Nothing else was touched."*
4. **PROJECT CHECK** **[REQUIRES BACKEND]** — rows of `tick/bang · label · result`:
   - "The project still builds" → build result + when it was checked
   - "No passwords or keys were added" → scan result
   - "Files you did not ask about" → count + names
   - "Links that go nowhere" → count + the offending link
   Carry the dashed **Requires implementation** badge until these are computed for real. Do not print "Yes" for a build you never ran.

Then **Files affected** — monospace chips + a **Show technical details** toggle that reveals commit sha, `+n −n` per file, author, UTC timestamp. Technical detail is never the default view.

Then **"What do you want to do?"** — four choice rows, each with a consequence:

- **Accept and save** — *"Create a Save Point in GitHub with these changes. Recommended."* (purple button inside the row)
- **Ask the AI to fix something** — *"Yourkly writes a follow-up handoff that includes what it got wrong."* → sets `needs_correction`
- **Change it myself first** — *"Open the files and edit before saving."*
- **Undo all of it** — *"Go back to how the project was before this update. Nothing is deleted — the AI's version stays in your history."*

### 7.10 Review and save — `/p/:repo/save` (max-width 820px)

Body: *"Here's exactly what will be saved to GitHub. Nothing leaves this screen until you press the button."*

- A card per changed file: filename in monospace + "{n} files changed · {n} lines added · {n} lines removed", then the diff — removed lines `--red-bg`/`--red` with a `−`, added lines `#E9F8F1`/`#0A5A44` with a `+`.
- **"What changed?"** input. Hint: *"One short line in your own words. This becomes the name of your Save Point, so future-you can find it."* Placeholder: *"Made the project description clearer"*.
- Primary: **Create Save Point and save to GitHub**. Secondary: **Keep editing**.

**Save conflict** (GitHub 409 — the existing error string in `src/api/github.js` becomes this screen): red-bordered card at the top, "This didn't save — the file changed somewhere else" / *"Someone or something else saved {file} to GitHub while you were editing — probably an AI you handed this project to, {time ago}."* / **"Nothing is lost.** Your edits are still here on this computer. You just need to decide which version wins."* Then three rows: **Show me the other version first** (marked *Recommended*) · **Keep my version** (*"Saves your edits over theirs. Their version stays in the history, so it can be restored."*) · **Keep their version** (*"Throws away the edits you made on this computer. Yourkly will ask you to confirm."* — and it must actually ask).

### 7.11 Save confirmation

`--success` tick in a 56px circle. H1 **"Your work is saved in GitHub."** Body: *"Nice — that version is kept forever. You can come back to it any time from Save Points."* Then a card: Save Point title / Saved (Just now) / Files saved / Current version. Actions: **Back to {project}** · See what changed · Continue with AI. Sets the update to `saved` and appends to the story.

### 7.12 What Changed — `/p/:repo/changed` (max-width 800px)

*"Every Save Point in this project, newest first — written the way you wrote it, not in GitHub's words."*

Each entry: plain title (use the existing `formatCommitLabel` in `src/utils/time.js`) / one-line summary / "{Person or tool} · {time} · {n} files · {version}" / a **See details** toggle revealing, in monospace `--grey`: "In GitHub words: commit {sha} on {branch}" and the file list. Never lead with a hash.

### 7.13 Save Points / restore — `/p/:repo/points`

*"Pick the Save Point you want to go back to. Yourkly puts those files back and saves that as a new Save Point — so nothing newer is ever lost."* Each row: title / "{who} · {when} · {n} files · {version}" / **Go back to this version**.

After restoring, a `--green-bg` strip: *"Restored — your files now look the way they did at "{title}". This is saved as a new Save Point."* + **Open the file**. Keep the existing restore implementation in `History.jsx`.

### 7.14 Project Files — `/p/:repo/files` (max-width 860px)

*"These are the real files in your GitHub project. Names stay exactly as they are — the grey line under each one explains what it's for."* Then a legend: a filled `--lilac-soft` tab shape = "Folder — holds other files"; an outlined rectangle = "File — you can open and edit it".

**Folders must be shown**, not filtered out (today `getFiles` drops everything that isn't a text file — that's the bug this fixes). Folder row: `#FCFBFE` background, filled glyph, name in monospace, a `--lilac-bg` pill reading **"Folder · {n} items inside"**, plain description, and a button labelled **"Show what's inside"** / "Hide what's inside" — not a bare chevron. Expanded contents are indented 52px on `#FBFAFD` rows; nested folders show their own count instead of a fake Open button. Files get **Open** and **History**.

Plain-language notes (add beside the real name, never replacing it): `README.md` Project overview · `package.json` Project setup and tools · `src` Main application code · `public` Images and public files · `DESIGN.md` Design instructions · `AGENTS.md` Instructions for AI coding tools. Folders that deserve a warning get one: under `public`, *"Anything in here is visible to anyone who opens your project online."*

Each file row should also show which update it belongs to when known, and its save status.

### 7.15 Separate Versions — `/p/:repo/versions` (max-width 820px)

*"A separate version is a safe copy of the whole project. You can try something risky in it without touching your main version — and bring it over later if you like it."*

Main version card (`--lilac-border`): "Main version" + a `--green-bg` pill **"This is what you're working in"**, the current Save Point and last-saved time, and a **Get latest version** button whose label becomes "You have the latest version" with a `--grey` note stating when it was checked. Then a card per branch: name, plain description, "Started {when} · {n} Save Points ahead of the main version", **Work in this version**. Footer strip: "Want to try something without risk?" + **Make a separate version**.

### 7.16 Who Can See It — `/p/:repo/share` (max-width 820px)

*"Pick a setting and Yourkly tells you exactly what it means — in normal words, before anything changes."*

Top row: "Project address" + the real `github.com/{owner}/{repo}` link + **Copy address** + a `--grey` note that reflects the *current* setting ("Only you can open this link right now." / "Only you and people you invited can open this link." / "Anyone can open this link.").

Three radio-style cards — Only me · Just the people I invite · Anyone with the link — selected one gets a `--purple` border and filled dot.

Below, a `--lilac-bg` panel headed **"What "{setting}" actually means"** with three rows:
- green tick, "They can **read**: …"
- red cross, "They **cannot**: …"
- amber bang, "Worth knowing: …"

Copy per setting:

| Setting | can read | cannot | worth knowing |
|---|---|---|---|
| Only me | nothing — nobody but you can open this project. | find it, open it, or see that it exists. | if you want feedback from someone, you have to invite them first. |
| Just the people I invite | every file, every Save Point, and every note you wrote about what changed. | invite other people, delete the project, or change who can see it. | there is no "just this one file" — an invite covers the whole project. |
| Anyone with the link | every file and your entire history, including versions you thought you had replaced. | change your files or make Save Points unless you invite them. | public means public — search engines and AI tools can read it too. |

When "Anyone with the link" is selected, a red-bordered warning appears: **"Before you make it public, check for two things"** / *"Passwords and API keys — often in files like `.env` — and anything private about you or other people. Making a project public also makes **every past Save Point** public, so deleting a password later isn't enough. If you're unsure, choose "Just the people I invite" instead."*

When "Just the people I invite" is selected, an invite panel: username input + **Send invite** + two permission chips — **They can read only** (*"Safest choice — they can look but not touch."*) and **They can also make changes** (*"They will be able to make Save Points, which change your files."*). Note: *"They'll get an email from GitHub. Nothing is shared until they accept."*

Apply button label states the destination: **Change to "{setting}"**, or "This is already your setting" when unchanged. Going public asks for one more confirmation.

Wire this to `updateRepoSettings` (already in `src/api/github.js`) and the GitHub collaborators API.

### 7.17 Project Settings — `/p/:repo/settings` (max-width 700px)

Name (warn: *"This renames the repository in GitHub too. Existing links may stop working."*) · What this project is (*"One sentence. Shows on your dashboard and in every AI handoff."*) · Who can see this project (links to §7.16) · Delete, in a `--red-border` card: *"This deletes the repository and every Save Point in it from GitHub. It cannot be undone, and Yourkly will ask you to type the project name first."* — and it must actually require typing the name.

### 7.18 Start a new project — `/new` (max-width 680px)

*"A project is one place for everything that belongs together — an app, a book, a class. Yourkly creates it as a real GitHub repository on your account."* Fields: name (*"You can rename it later."*) and **what it's for** (*"This shows on your dashboard and goes into every AI handoff, so future-you and any AI know what this is."*) — this is not optional decoration, it feeds §7.7. Visibility: **Only me** / **Anyone with the link** (*"Private means only you. You can change this in project settings later."*). Then **Create project**.

After creating, the empty project state: green strip *"Created in GitHub. It's empty right now — that's normal."* then a centred card: "There's nothing in here yet" / *"Two good first moves: write down what you want to build, or add the files you already have. Either way Yourkly keeps every version from here on."* → **Describe what you want to build** · Add files.

### 7.19 Account — `/account`

Avatar + login + "Signed in with GitHub". A `--green-bg` panel: *"Yourkly can read and save to your projects. You can disconnect any time and your files stay in GitHub."* Plus one setting: **Show technical GitHub words** — *"Adds the real GitHub term in grey next to Yourkly's plain-English label, so you learn them as you go."*

**Connection expired state** (401 from the API — replaces today's silent `signOut()` in `useAuth.js`): full-page, amber `!` glyph, H1 **"Yourkly needs you to sign in again"** / *"GitHub asks you to renew permission every so often. That's all this is — nothing is wrong and nothing was lost."* / *"Your work is still exactly where it was. Any edits you hadn't saved yet are being kept on this computer and will be waiting when you come back."* → **Reconnect to GitHub** + *"Takes one click. You'll come straight back to this page."* Silently logging the user out is the worst version of this.

### 7.20 Help — `/help`

*"Yourkly is a plain-English way to use GitHub. Your files live in your real GitHub account — Yourkly just makes it obvious what's going on and what to do next."* Four numbered step cards (sign in / pick up where you left off / make a Save Point / hand it to an AI), then the glossary: each entry shows the Yourkly term, "GitHub calls this: {term}" in `--grey`, and a plain definition. Cover: Project, Save Point, What changed?, Save to GitHub, Get latest version, Separate version, Main version, See what changed, Restore an earlier version, Changes not saved yet.

### 7.21 Loading and empty states

Loading: skeleton blocks in `#F1F0F5`/`#F4F3F7` matching the real layout, plus one honest line — *"Getting your projects from GitHub…"*. No spinners over blank pages.

Every list has a friendly empty state that names the next action. No empty panels.

---

## 8. Plain-language rules

| Show this | Never show this as a primary label |
|---|---|
| Project | repository, repo |
| Save Point | commit |
| What changed? | commit message |
| Save to GitHub | push |
| Get latest version | pull, fetch |
| Separate version | branch |
| Main version | main, master, default branch |
| See what changed | diff |
| Restore an earlier version | revert, reset |
| Changes not saved yet | uncommitted changes, dirty working tree |
| Project files | tree, blob |

GitHub's own words may appear as secondary grey explanation, in "Show technical details", or in the glossary. Never in a button.

---

## 9. Responsive

Below 1100px: sidebar collapses to a 64px icon rail with labels on hover; hero meta rows stack (label above value); two-column dashboard becomes one column. Below 720px: sidebar becomes a bottom bar with Home / Projects / Activity / Account; content padding 24px 20px; hero title 26px; all buttons full-width and at least 44px tall; the lifecycle indicator scrolls horizontally.

---

## 10. Definition of done

1. Every route in §4 resolves; no dead links.
2. Home, Project Home, and the update workspace never disagree, because all three call one `heroFor()` — §6.
3. No screen shows a number, filename, or timestamp that didn't come from the GitHub API or a stored memory record.
4. Unchecking a context item visibly changes the handoff text.
5. Nothing marked **[REQUIRES BACKEND]** ships as a hardcoded value — it either works or shows the honest fallback with the dashed badge.
6. OAuth, file editing, DOMPurify, history, diff, and restore all still work.
7. `npm run build` passes.
8. Nothing committed, pushed, or deployed.

Then report: the final user journey · how "where I left off" is determined · how the next step is determined · components created · components modified · routes added or changed · what fully works · what is presentation-only · build result · what still needs manual testing.
