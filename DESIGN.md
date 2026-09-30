# Yourkly — design instructions

This is the file Yourkly hands to an AI. When you press **Continue with AI**, this document
is packed into the handoff as "your project instructions", so anything written here is what
an AI will follow when it changes this app.

Keep it true. If something here stops matching the code, fix one of them.

Source of truth for values: `src/styles/tokens.css` (redesign tokens) and `src/index.css`
(original brand values). `docs/DESIGN.md` is the older, longer description of the
pre-redesign system — this file supersedes it for anything they disagree on.

---

## Approved refinement: Yourkly project setup (2026-09-25)

This section overrides older typography and spacing rules for `/native/new`.
Use the supplied Meta screenshots for visual restraint, hierarchy and proportions;
keep Yourkly's exact existing color palette, wordmark and stork identity. Do not
copy Meta's colors or add content, decorative badges, icons or features.

- Use regular/medium large headings, purposeful whitespace, flat surfaces and
  consistent rounded corners. Rounded cards and buttons are allowed; avoid nested
  containers, heavy shadows, decorative glow and competing accents.
- The native setup shell is 680px maximum with 20px minimum side margins.
- Header: 80px tall with a centered 1200px maximum inner width. Keep it sticky
  at the top with Home and My Projects as plain text links. On scroll beyond 8px,
  use the existing white surface at 82% opacity with a 16px backdrop blur; retain
  an opaque white fallback when blur is unavailable. Mobile margins are 20px.
  Place the form 64px below on desktop and 32px at widths up to 720px.
- Heading: 40px desktop, 32px mobile, weight 500, line-height 1.15. Step indicator
  to heading: 20px; heading to introduction: 12px; introduction to guidance: 24px.
- Guidance: 20px padding, followed by 28px before the form. Labels sit 8px above
  inputs; field groups have 24px gaps. Inputs have a 56px minimum height and
  16px horizontal padding. Retain visible keyboard focus.
- Main action: 28px after the last field, 50px minimum height, weight 500, no
  shadow or hover lift. Retain existing colors and disabled/enabled behavior.
- Buttons, inputs and setup choices use 8px corners rather than pill shapes.
  Setup groups have 28px gaps; choices have 12px gaps and 16px padding. Keep
  configuration directly on the page instead of inside an additional card.
  Selected choices keep their existing purple fill and expose aria-pressed.
- Keep at least 48px below content; let short screens scroll naturally.
- These are approved Yourkly specifications, not measured Meta CSS. The zoomed-out
  Help Center screenshot is a composition reference only.
- Implement and review this page before extending the direction to other pages.
  Authentication, routing, saved data, project configuration and copy stay intact.

---

## 1. What this app is for

Yourkly sits on top of a GitHub account and does one job: tell you where you left off,
what changed, and what to do next — without the jargon.

Every screen answers one of those three questions. If a screen answers none of them, it
probably shouldn't exist.

---

## 2. Colour

Nothing in the interface uses a colour outside this list. There is no blue in Yourkly —
links are purple.

| Token | Value | Used for |
|---|---|---|
| `--purple` | `#6C5CE7` | the wordmark, primary actions, active nav, links |
| `--purple-dark` | `#5849c4` | primary hover |
| `--ink` | `#1C1B22` | headings, body |
| `--ink-soft` | `#4A4753` | body copy inside cards |
| `--ink-mid` | `#5C5866` | neutral pill text |
| `--canvas` | `#FBFAF8` | page background |
| `--grey` | `#8A8794` | secondary text, labels |
| `--grey-light` | `#ECEAF4` | card borders |
| `--grey-border` | `#D8D6E3` | input and secondary-button borders |
| `--lilac-bg` | `#F4F2FB` | guidance strips, selected chips |
| `--lilac-border` | `#E4E0F7` | emphasised card borders |
| `--lilac-soft` | `#C9C2F0` | folder glyphs, chevrons, hover borders |
| `--panel` | `#FBFAFE` | inset panel inside the hero card |
| `--amber` / `--amber-bg` / `--amber-edge` | `#A3702A` / `#FAF1E1` / `#E3B14C` | attention: text, pill, 4px left border |
| `--red` / `--red-bg` / `--red-border` | `#8C3A33` / `#FBEBEA` / `#F3D9D6` | destructive and conflict |
| `--success` / `--green-deep` / `--green-bg` | `#00B894` / `#008B70` / `#E6F9F4` | saved, all-clear |

**Meaning is fixed.** Amber means *something is waiting for you*. Red means *this can lose
work*. Green means *it's in GitHub*. Purple means *this is the thing to press*. Never use a
colour for decoration that carries one of those meanings.

## 3. Type

Inter, loaded at 400/500/600/700. Monospace (`'Courier New', ui-monospace, monospace`) is
only for real file names, repository addresses and commit shas — never for prose.

| Role | Size / weight |
|---|---|
| Page title | 30px / 700 / -.03em |
| Hero update title | 34px / 700 / -.03em |
| Section heading | 22px / 700 / -.02em |
| Card title | 16.5px / 600 |
| Body | 15–16.5px / 1.5 |
| Meta, secondary | 13.5–14px, `--grey` |
| Uppercase label | 12px / 600 / .08em, `--grey` |
| Status pill | 12.5px / 600 |

Never below 13px.

## 4. Shape and depth

`--radius-card: 14px` for cards and list rows, `--radius-hero: 18px` for the one hero card
per screen, `--radius-pill: 99px` for status pills, 10–12px for buttons and inputs.

Two shadows only: `--shadow-card` for hover lift, `--shadow-hero` for the single most
important card on a screen. Nothing else casts a shadow.

## 5. Layout

248px white sidebar, sticky, `border-right: 1px solid --grey-light`. Content area
`padding: 44px 48px 64px` with a max-width per screen (660–1000px). Use the `.screen-padded`
class plus a per-screen `max-width`.

**On a phone** (≤720px) there is no sidebar. Navigation is the shape of a phone app people
already use:

- a **bottom tab bar** — Home · My Projects · Recent Activity · Help — pinned, one tap each,
  purple for where you are (`src/components/TabBar.jsx`);
- a **top bar** with the avatar on the left, which opens Account, and `+` on the right for a
  new project;
- a project's ten sections as a **grouped card** on Project Home, since there is no sidebar
  to hold them (`src/components/ProjectSections.jsx`).

`projectNavItems()` in `src/utils/projectNav.js` is the single definition of those sections,
used by both the sidebar and the card — writing the list twice is how the Continue with AI
link drifted and shipped broken.

**Grouped card rows** (`.card-list` / `.card-row`) are the mobile list idiom: a white rounded
card, hairlines between rows rather than around them, a chevron on each, **one line per row**.
A description under every item is what makes a list feel heavy, and these labels are already
the plain-English names.

Two `<nav>` elements exist, but only one is ever rendered: `display: none` removes the other
from the accessibility tree as well as the screen, so a screen reader hears one navigation.
Icons appear **only** on the phone — a tab bar without them doesn't work — and the desktop
sidebar stays text.

Earlier attempts are worth recording because both failed in use: a horizontal scrolling strip
put twenty-one items in a sideways swipe with their headings hidden, and a Menu button put
everything one tap further away with no sense of place.

Controls a thumb aims at are at least **44px** tall on phones. The 12–12.5px sizes above are
uppercase labels, pills and badges, and they stay — the 13px floor is about prose. Anything
laid out as columns on a desktop stacks, and the glossary stops being a table and becomes
one card per word, because three columns in 390px clipped the meaning entirely.

The mobile rules live at the **end of `tokens.css`**, the last stylesheet `main.jsx` imports.
A media query carries no extra specificity, so an override only wins by loading after the
rule it overrides. Half of them did nothing when they sat in `index.css`.

**Authenticated GitHub pages use one navigation**, `AppShell`; do not duplicate it.
The standalone `/native/new` page uses `NativeHeader` instead, with links to Home
and My Projects. This header is never rendered inside `AppShell`.
This is worth stating because it was broken once: two screens kept an old sidebar and the
app showed two side by side.

The sidebar has two conditional groups, both built from the same `NavItem`: the project nav
appears inside `/p/:repo`, and **Help topics** appears inside `/help`. A group is a grey
uppercase heading followed by indented rows — no icons anywhere in the sidebar.

## 6. Buttons

One primary purple button per screen — the recommended next step. Everything else is white
with a `--grey-border`; on hover the border and text go purple.

Use `.pl-btn-primary` and `.pl-btn`. They work on `<button>` and on react-router `<Link>`.

## 7. The words

The plain word is the label. GitHub's word may appear as grey secondary explanation, inside
"Show technical details", in the glossary, or when the Account setting *Show technical
GitHub words* is on. **Never in a button.**

| Show this | Never as a primary label |
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
| Changes not saved yet | uncommitted changes |
| Project files | tree, blob |

Write for someone who has never used GitHub and is not stupid. Short sentences. Say what a
thing does before naming it. Every destructive action says what will happen and what will
survive.

## 8. Honesty rules

These are design rules, not engineering ones. Breaking them makes the product lie.

- **Never invent a number, filename, date or status.** Every value on screen comes from the
  GitHub API or from Yourkly's own stored memory.
- **When something can't be computed yet, say so** — use the honest fallback sentence, or
  the dashed `.pl-todo` "Requires implementation" badge. Never print "Yes" for a check that
  never ran.
- **No pill beats a wrong pill.** A status only appears when stored records back it.
- **A toggle that changes nothing is worse than no toggle.** If a control is on screen, it
  must do something visible.
- **Nothing reaches GitHub without the user pressing a button that says so.** Edits are
  drafts on this computer until Review and save.

## 8a-0. What Yourkly asks GitHub for, and what it refuses to guess

Four things beyond files and Save Points, all real API calls, all with an honest fallback:

- **Things to do** — Issues. See below.
- **Stars** — the public count comes with the project; whether *you* starred it is a
  separate request with three answers, and `null` (couldn't tell) disables the button rather
  than drawing an empty star that might be wrong.
- **Separate versions** — branches. Each one says how far it has moved from the main version
  (`compare`), and *"Yourkly couldn't compare this"* when GitHub won't say. Making one happens
  in Yourkly; bringing one back still opens GitHub, because Yourkly can't do it yet and
  shouldn't pretend.
- **Publishing** — Pages. `building` is its own state, never shown as success: a screen must
  not say a site is live before GitHub says it is. A private project is warned first, because
  publishing puts its files on the open web.
- **The project check** — check runs from Actions. **No checks configured is not a pass**, and
  renders as "this project has no automatic checks set up". The panel also states what Yourkly
  does *not* look at, which is how the dashed "Requires implementation" badge came off honestly
  rather than by deletion.

## 8a-i. Things to do live in GitHub, not in a browser

**Things to do** (`/p/:owner/:repo/todo`) is GitHub Issues in plain words, and it is the
first screen in Yourkly that stores nothing locally. An update lives in `localStorage`,
which is why a project worked on all week can open looking empty — the record was on a
different machine. A thing to do survives a new laptop and is visible to anyone you share
the project with.

Because it holds no state, there is nothing to fall out of step: every item came from
GitHub and every change goes straight back. One caveat is load-bearing — GitHub's issues
endpoint returns pull requests too ("every pull request is an issue"), and a pull request
is not a thing to do, so anything carrying `pull_request` is dropped.

## 8a. Updates and Save Points are different things

An **update** is something Yourkly followed start to finish: you described it, it went to an
AI, changes came back, you reviewed and saved. A **Save Point** is something GitHub recorded,
however it got there — pushed from an editor, from an AI tool, from another machine.

Most work arrives the second way. So the project screens show both, and never blur them: a
Save Point is never rendered as an update, never counted in "updates in progress", and never
fed to `heroFor()`. When Yourkly has no update of its own, Project Home leads with **Recently
saved to GitHub** rather than a sentence about nothing, and Updates carries a **Saved to
GitHub** list underneath its own.

## 8b. A commit message is a title and one line

Commit messages are written for git: a subject, then paragraphs, then trailers like
`Co-Authored-By:`. Printing all of it is how What Changed became a wall of text.

`src/utils/commitText.js` is the only place that decides: the first line is the title, the
first paragraph becomes a one-line summary cut at a word boundary, everything else goes
behind **See details** along with the sha and the file list. Trailers never appear on screen
at all. Every screen showing a Save Point uses it, so one commit reads the same way
everywhere.

## 8c. Version numbers are counted, not stored

`v18` means *the 18th Save Point GitHub currently lists on the main version*. It is counted
at read time by `getSavePointCount()` — ask for one commit, read the `rel="last"` page number
out of the `Link` header, which GitHub exposes to browsers via
`Access-Control-Expose-Headers`.

When the count can't be made it is `null`, and **nothing is rendered** — not `v0`, not `vNaN`.
Guard with `version > 0 ? … : null`, never `version && …`: JSX renders a bare `0`.

## 8d. An empty account gets one screen, not an empty dashboard

Home answers "where did I leave off". Someone signing in for the first time has no
answer to that, and the dashboard degrades badly for them: four empty panels, a
"Make an update" button that dead-ends at My Projects, and a green tick reading
"Everything is saved in GitHub" — a reassurance about work that does not exist.

So when the projects list comes back genuinely empty, Home returns the first-run
screen instead: one card, one primary action, and three sentences saying what happens
after that. Nothing else on the page competes with it.

**Empty is not the same as broken.** If the request to GitHub failed, the list is also
empty, and this screen would tell someone with a hundred projects that they have none.
It appears only when the list came back and was genuinely empty — never on an error,
never while loading.

## 9. One status, four sentences

`src/utils/heroFor.js` turns an update's status into exactly four fields: *where you left
off*, *what's happened since*, *what to do next*, and the primary button's label and route.

Home, Project Home and the update workspace all call it. **Do not compute those sentences
anywhere else** — that is how screens end up contradicting each other, telling you to keep
working on something already saved.

Update statuses, in order: `planned → ready_for_ai → sent_to_ai → changes_detected →
waiting_for_review → ready_to_save → saved`, plus `needs_correction` and `paused`.

## 10. The screens

Signed out: **Welcome**. Signed in, global: **Home**, **My Projects**, **Recent Activity**,
**Account**, **Help**, **Start a new project**. Inside a project: **Project Home**,
**Updates**, **Make an Update**, **Project Files**, **file editor**, **Review and save**,
**What Changed**, **Save Points**, **Separate Versions**, **Who Can See It**, **Continue
with AI**, and per update: **workspace**, **Return from AI**, **Review AI changes**.

**Help is a section, not a page.** Six routes — `/help` (getting started), `/help/how-it-works`,
`/help/tasks`, `/help/glossary`, `/help/troubleshooting`, `/help/contact` — so every topic can
be linked to, and search results can land on the exact answer. The writing lives in
`src/help/content.js`; the section pages are layout only. Anything Help describes must be
something the app actually does — where it doesn't, Help says so (see §8).

**Continue with AI works without an update.** `/p/:repo/ai` opens the handoff for the project
itself and asks what you want the AI to do; the update record is created when you mark it as
sent, not before. `/p/:repo/u/:id/ai` is the same screen scoped to an update in flight.

**Signing out disconnects.** It revokes the GitHub authorization, not just Yourkly's copy of
the token, so the next sign-in asks you to allow access again — otherwise Account's promise
that "you can disconnect any time" would be false. Your files stay in GitHub and unsaved
drafts stay on the computer; the screen says both before you press it. If the revoke can't
reach GitHub you are still signed out here, and Welcome says GitHub may still list Yourkly
and where to remove it.

This is the *only* way to make GitHub ask again. GitHub's own rule: someone who has already
authorized these scopes "won't be shown the OAuth authorization page … this step of the flow
will automatically complete". So a silent sign-in is not a bug in Yourkly — it means the
authorization is still there. Sign-in also sends `prompt=select_account`, which forces the
account picker every time, and Account states whether GitHub still lists Yourkly by asking
GitHub rather than by assuming it — with "couldn't check" as its own answer, never rendered
as connected.

**Yourkly shows every project the account can reach** — yours, ones shared with you, and
every repository in every organisation you belong to. `getRepos()` sends no `affiliation`
parameter; it used to narrow to `owner`, which hid shared work entirely.

Because that can mean hundreds, **you can choose which appear** (`/projects/choose`), and two
rules keep the choice honest: choosing nothing shows everything, so no one opens Yourkly to
an empty list because of a setting they don't remember making; and while a choice is active
the list says *"Showing 2 of 4"* rather than presenting a filtered list as the whole truth.
A stale choice that matches nothing falls back to showing everything. Hiding affects lists
only — a direct link to a hidden project still opens.

`useProjects()` is the one place that loads projects and applies the choice. Home, My
Projects and Recent Activity all call it; they each called `getRepos()` separately before,
which is the shape of duplication that let `aiRouteFor` drift.

**A project URL carries its owner:** `/p/:owner/:repo`. Not the signed-in user — the
account the project actually belongs to, because a project shared with you or owned by a
team belongs to somebody else and every GitHub call needs to know whose. Screens read the
pair from `useProject()`, lists link with `ownerOf(repo)`, and stored memory is keyed by
the project's owner. Links from before this shape redirect (`ProjectArea` in `App.jsx`).

The one ambiguity — a project genuinely named `settings` or `files` — resolves by treating
a first segment that matches the signed-in user as the new shape, which it always is.

Every route resolves. No dead links, no 404s. Old routes redirect to their designed
replacement rather than disappearing.

## 11. If you're an AI changing this app

- Match the tokens above; don't introduce new colours or sizes.
- Copy is the product. If a screen's wording is specified, use it exactly.
- Put new work in an existing screen before inventing a new one.
- Anything you can't compute for real, render as the honest fallback and say so in your
  report back.
- Don't reintroduce a second navigation, and don't add a chatbot.
