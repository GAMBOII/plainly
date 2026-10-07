# Yourkly — Project Status

This file is maintained by every agent working in this repository. Update it after
every substantial task. See `AGENTS.md` for the update protocol.

---

## Native "welcome back" fix — 2026-09-30

Owner report: clicking "Continue with Yourkly" on the landing page dropped her
into projects she made the previous week, with no login and no explanation —
it felt like being signed into an account nobody signed into.

Root cause: native projects live in the browser's local storage, so they
persist across visits with no identity at all. The landing page never said
that, and neither did the projects page. Not a session bug: the GitHub session
cookie (`plainly_session`) expires after 8 hours and cannot restore a week-old
login.

- `src/pages/Welcome.jsx`: counts native projects in local storage; when at
  least one exists, a line under the "Continue with Yourkly" button says
  "Welcome back — you have N project(s) saved on this device."
- `src/pages/NativeProjects.jsx`: added a line under the workspace heading —
  "These live in this browser on this device, so there's no login — but they
  won't follow you to another device unless you export them."
- No route, auth, or storage changes. No new dependencies.
- Validation: `npm run build` passed. Imports resolve; both edits re-read.
- Status: implemented locally on `yourkly-rebrand`, not committed (owner has
  not asked for a commit on this change yet).

## Native project setup spacing — 2026-09-25

Published for review in PR #19 on `fix/native-project-spacing`, based on main `7eaecc2`.
Follow-up: owner requested adjusted pill buttons and a transparent scrolling menu header.

- Scoped `/native/new` CSS removes stacked header padding, sets a 680px maximum
  form width, 80px header, 64px desktop / 32px mobile header gap, and 48px bottom space.
- Uses 40px desktop / 32px mobile medium-weight headings; 8px label gaps, 24px
  field gaps, 56px inputs, and 50px primary buttons without glow or hover lift.
- Documents the approved Meta-reference direction in root DESIGN.md, retaining
  all existing colors, wording, routing, project creation and authentication.
- Added NativeHeader to `/native/new`: Home/My Projects text links, sticky placement,
  translucent existing white surface and blur on scroll, and an opaque fallback.
- Setup choices, inputs and actions use 8px corners; configuration groups use
  consistent gaps without an extra enclosing card. Selected choices expose aria-pressed.
- Validation: `npm run build` passed (120 modules); existing >500kB bundle warning.
  `git diff --check` passed. Imports and parent wiring reviewed; project creation,
  authentication, routes and saved-data logic are unchanged.
- Visual verification incomplete: agent-browser is unavailable; the installed
  Playwright package has no Chromium executable, and a browser download failed.
  Desktop/mobile rendering, sticky-header behavior and
  interactive verification must be completed in a browser before release.
- No new dependencies or palette colors; header opacity reuses existing white.
  Potential risk: unverified visual
  interaction with inherited styles, especially the second setup step.
- Owner authorized committing, pushing and opening a pull request on 2026-09-25.
  Merge and deployment remain pending.

## Current State

**Date of last update:** 2026-09-04
**Updated by:** Continue-in handoff
**Branch:** main

Yourkly is a working application. The core feature set — GitHub OAuth sign-in, project
list, file editor, save points, history, restore, project memory, task system, AI
handoffs, project timeline, and goal-based help — is complete and deployable.

The build passes cleanly (`npm run build`, 101 modules, zero errors).

### Security Hardening (2026-09-03)

GitHub credentials no longer reach browser storage. Yourkly now starts OAuth with PKCE,
keeps the OAuth transaction and encrypted session in `HttpOnly` cookies, and sends all
GitHub API calls through a same-origin proxy protected by a session CSRF token. OAuth and
proxy endpoints validate their request shape and apply per-instance rate limits. Production
now sends CSP, clickjacking, MIME, referrer, and permissions-policy headers. The AI handoff
warns and requires acknowledgement when common secret patterns are detected before copying.
An old `plainly_token` browser-storage value is removed on first load after upgrading.

**Required deployment setting:** `GITHUB_SESSION_SECRET` must be a unique random 32-byte
base64url value in each Vercel environment where sign-in is enabled. Existing users must
sign in again after release.

### AI Change Inbox (2026-09-03)

Home now collects up to three AI-assisted updates that need a person's decision across
all projects. Each item says what to do next in plain language and opens directly to
review, correction, or saving. Updates still waiting on an AI are intentionally left
out, so the inbox only shows work the person can act on now.

### Project Connection Health (2026-09-03)

Project Home now shows a plain-language health card. It checks whether Yourkly has
unsaved work, whether GitHub's latest automatic checks are passing, whether a GitHub
Pages site is ready, and whether an AI update is waiting. It never invents a result:
hosting systems that do not report through GitHub are shown as unknown rather than healthy.

**Known limitation:** Direct health data from Vercel, Netlify, and other hosting providers
is not connected yet. Their GitHub-reported checks are shown when available.

---

## Changes in This Pass (2025-07-11 — Safety and Setup Repair)

The following changes were made. No application architecture, routes, workflows, or
visual design was altered.

| # | Change | File(s) |
|---|---|---|
| 1 | `.env.example` rewritten — all five env vars documented with explanations of purpose, scope, and which are safe for the browser | `.env.example` |
| 2 | DOMPurify added (`npm install dompurify`) — Markdown preview now sanitized via `DOMPurify.sanitize(marked.parse(...))` | `src/pages/Files.jsx`, `package.json` |
| 3 | New repositories now default to `private: true` | `src/api/github.js` |
| 4 | `plainly-app.jsx` deleted — confirmed not imported anywhere; was a disconnected prototype with an incomplete Anthropic integration and a missing `lucide-react` dependency | `plainly-app.jsx` (removed) |
| 5 | `docs/SECURITY.md` created — documents SEC-001 (token in localStorage), SEC-002 (Markdown XSS, now resolved), SEC-003 (OAuth scope), SEC-004 (public repo default, now resolved) | `docs/SECURITY.md` |

---

## Changes in This Pass (2025-07-11 — "Continue with Another AI" Implementation)

| # | Change | File(s) |
|---|---|---|
| 1 | `src/utils/aiPrompt.js` created — pure function `buildProjectPrompt()` and `AI_TOOLS` config | `src/utils/aiPrompt.js` (new) |
| 2 | `src/components/ProjectAIModal.jsx` created — modal with context summary, AI selector, instruction editor, live prompt preview, Copy and Open AI buttons | `src/components/ProjectAIModal.jsx` (new) |
| 3 | "Continue with Another AI" button added to Files page topbar — always visible when inside a project; opens the modal | `src/pages/Files.jsx` |
| 4 | `showAIModal` state added to Files page | `src/pages/Files.jsx` |
| 5 | CSS added for `.ai-modal`, `.ai-context-summary`, `.ai-tool-strip`, `.ai-tool-btn`, `.ai-prompt-preview`, `.ai-copied-hint` and supporting classes | `src/index.css` |

---

## Changes in This Pass (2025-07-11 — Help Page Redesign + HANDOFF.md)

| # | Change | File(s) |
|---|---|---|
| 1 | `src/pages/Help.jsx` rewritten — goal-based navigation (8 user goals), expandable GitHub translation table (15 terms with "Do I need this now?" guidance), walkthroughs, public/private explanation, collaborator roles, AI handoff explanation | `src/pages/Help.jsx` |
| 2 | ~325 lines of new CSS added — all Help page classes using existing design tokens | `src/index.css` |
| 3 | `HANDOFF.md` created — AI continuation reference with full file map, translation table, data storage, constraints, and build instructions | `HANDOFF.md` |

---

## Working Features

All of the following are present in the codebase and verified as implemented:

### Authentication
- GitHub OAuth sign-in (Authorization Code flow)
- Token stored in `localStorage` under `plainly_token`
- User profile loaded on mount to validate stored token
- Sign out clears token and user state
- Auth error displayed on sign-in page if OAuth fails

### Projects
- List of all user-owned GitHub repositories (sorted by last updated)
- Create a new repository with a plain-language name (spaces converted to hyphens)
- Project card shows name, optional description, last-touched time
- Navigate into a project to see its files

### Files
- Sidebar listing of text files (`.txt`, `.md`, `.markdown`, `.mdx`, `.text`, `.rst`)
- Create a new file with a modal (defaults to `.txt` if no extension given)
- Open a file into the editor
- Rename a file (copy + delete on GitHub)
- Delete a file with a confirmation modal
- Download the current file
- Download all files as a ZIP archive (JSZip, client-side)
- Copy a public GitHub link to the current file

### Writing and Editing
- Plain textarea editor
- Markdown preview toggle (`.md` files only)
- Font size controls (14 / 16 / 18 / 20px, persisted to localStorage)
- Focus mode (hides all chrome except the editor)
- Word count and character count in editor footer
- Word goal with progress bar (persisted to localStorage)
- Unsaved-changes indicator

### Saving
- Manual save point with optional plain-language label
- Random auto-phrase when no label is given
- Auto-save every 30 seconds when file is dirty
- Cmd/Ctrl+S keyboard shortcut opens save dialog
- Pulse animation on Save Point button when changes are unsaved
- 409 conflict error surfaced in plain language

### History
- Full commit history for any file, displayed as a timeline (up to 50 commits)
- Each entry shows a plain-language label, author name, and relative time
- "Go back to this version" restores a past commit as a new commit
- "Compare with now" opens a line-by-line diff panel
- Diff stats (lines added, lines removed)
- "Restored ✓" badge after a successful restore

### Project Settings
- Edit project description
- Toggle public/private visibility
- Danger-zone delete with name-confirmation input

### Help
- Step-by-step "How it works" guide (4 steps)
- Plain-English glossary (5 terms)
- Available before and after sign-in

---

## Known Issues

The following issues were identified during the inspection on 2025-07-11.
No code changes have been made to address them yet.

### High Priority

| ID | File | Issue | Status |
|---|---|---|---|
| ISS-001 | `.env.example` | Missing `VITE_GITHUB_CLIENT_ID`. New contributors following only this file will get a broken OAuth redirect URL with an empty `client_id`. | **Resolved 2025-07-11** |
| ISS-002 | `src/pages/Files.jsx:677` | `dangerouslySetInnerHTML` passes `marked.parse(content)` without sanitisation. User-controlled Markdown could produce executable HTML. | **Resolved 2025-07-11** — DOMPurify added |

### Medium Priority

| ID | File | Issue | Status |
|---|---|---|---|
| ISS-003 | `src/api/github.js:51` | New repos are created with `private: false` (hardcoded). Users may unintentionally publish their writing publicly. | **Resolved 2025-07-11** — defaults to `private: true` |
| ISS-004 | `src/pages/History.jsx:10` | `owner` is derived from `auth.user?.login`, which may be `undefined` before the user fetch completes. The guard prevents a crash but the page shows a blank state with no feedback. | Open |
| ISS-005 | `src/pages/Files.jsx` | After a file rename, `savedContent` is not updated to match `content`, which can leave `isDirty` incorrectly `true` immediately after renaming. | Open |
| ISS-006 | `src/api/github.js:36` | `getRepos` fetches all owner repositories. Users who have code repositories will see them mixed into the Projects list alongside their writing projects. | Open |
| ISS-007 | `src/hooks/useAuth.js:6` | The GitHub OAuth token (with full `repo` scope) is stored in `localStorage`, where it is accessible to any JavaScript running on the page. | Open — see `docs/SECURITY.md` SEC-001 |

### Low Priority

| ID | File | Issue | Status |
|---|---|---|---|
| ISS-008 | `src/pages/Files.jsx` | Files in subdirectories of a repository are silently excluded. No UI indication that subdirectories exist. | Open |
| ISS-009 | `src/pages/Projects.jsx:19` | `useEffect` depends on `auth.token` via closure but has an empty dependency array. Lint will flag this; it is intentional but undocumented. | Open |
| ISS-010 | `src/pages/Files.jsx` | Word goal is stored globally in `localStorage`, not per-file. Switching files does not reset the goal state. | Open |
| ISS-011 | `src/App.jsx` | No error boundary. A runtime error in any page component will produce a blank screen with no recovery path. | Open |

---

## Orphan File

`plainly-app.jsx` (project root) is a disconnected prototype — a landing page / prompt
generator with a Stripe payment link. It imports `lucide-react` (not in `package.json`)
and calls the Anthropic API directly from the browser without an API key. It is not
mounted anywhere in the application and has no effect on the running product.
It can be deleted or archived in a future cleanup task.

---

## Technical Risks

| Risk | Severity | Notes |
|---|---|---|
| Broad OAuth `repo` scope | High | The encrypted session limits theft, but the OAuth App still receives broad account-wide repository access. Moving to a GitHub App remains the long-term fix. |
| Unsanitised Markdown rendering | High | `dangerouslySetInnerHTML` without DOMPurify. Risk is only from the user's own content (they are both attacker and victim), but should still be fixed. |
| GitHub API rate limits | Medium | All API calls are client-side. A heavy session (many file opens, history views, renames) could hit GitHub's 5,000 requests/hour unauthenticated limit per token. No rate-limit handling is implemented. |
| OAuth scope too broad | Medium | `repo` scope grants full repository access. If the token is stolen, all of the user's repositories are at risk. |
| No error boundary | Low | Any unhandled React error produces a blank screen. |

---

## "Continue with Another AI" Feature

**Status:** Complete — implemented and build-verified 2025-07-11
**Defined in:** `docs/DECISIONS.md` (D-006)

### What it does

A "Continue with Another AI" button in the Files page topbar — always visible when
the user is inside a project (not gated to a file being open). Clicking it opens a
modal that assembles full project context into a structured prompt the user can copy
and take to any AI tool to continue work immediately.

The feature is scoped to the whole **project**, not a single document. This is consistent
with Yourkly's identity as a plain-language interface for GitHub.

### Implemented files

| File | Status |
|---|---|
| `src/utils/aiPrompt.js` | Created — pure `buildProjectPrompt()` function, `AI_TOOLS` config, `CONTENT_LIMIT` constant |
| `src/components/ProjectAIModal.jsx` | Created — context summary, AI tool selector (ChatGPT / Claude / Gemini / Bob / Generic AI), instruction editor, live prompt preview, Copy and Open AI buttons |
| `src/pages/Files.jsx` | Modified — `showAIModal` state, "Continue with Another AI" button, `<ProjectAIModal>` render |
| `src/index.css` | Modified — ~130 lines of new CSS for AI modal classes |

### Version 1 limitations

- Save-point label fetch is fire-and-forget; if history is unavailable, the prompt
  omits that section gracefully with no error shown to the user
- File content is truncated at 12,000 characters with a plain note; large files will
  be cut. A future version could offer per-file selection
- The prompt includes only the currently open file's content; other files are listed
  by name only. A future version could offer multi-file content inclusion
- Bob AI URL points to IBM watsonx Code Assistant marketing page — update when a direct
  conversation URL is available
- No analytics on which AI tool is most used (by design; no tracking in Yourkly)

---

## Changes in This Pass (2025-07-12 — Project Intelligence Layer)

| # | Change | File(s) |
|---|---|---|
| 1 | `src/utils/projectMemory.js` created — pure localStorage helper: `getMemory`, `setMemory`, `recordFileOpen`, `recordSave`, `recordAIHandoff` | `src/utils/projectMemory.js` (new) |
| 2 | `src/utils/taskMemory.js` created — pure localStorage task CRUD: `getTasks`, `createTask`, `updateTask`, `deleteTask`, `getActiveTask`, `generateId` | `src/utils/taskMemory.js` (new) |
| 3 | `src/pages/Projects.jsx` updated — "Continue where you left off" card using real memory data, recommended next action, active task display; all projects list shows memory timestamps and active task badges | `src/pages/Projects.jsx` |
| 4 | `src/pages/Files.jsx` updated — `recordFileOpen` on file open, `recordSave` on save, `onHandoff` prop wired to `ProjectAIModal`; collapsible task panel in sidebar (new task form, task list, view-all sheet); active task shown in summary bar; Timeline button in topbar | `src/pages/Files.jsx` |
| 5 | `src/pages/ProjectTimeline.jsx` created — new page at `/p/:repo/timeline`; shows recent save points (GitHub API, deduped by SHA), "where you left off" memory card, and all tasks | `src/pages/ProjectTimeline.jsx` (new) |
| 6 | `src/components/ProjectAIModal.jsx` updated — optional `onHandoff(toolId, instruction)` prop; called in both `handleCopy` and `handleOpenAI` before the action fires | `src/components/ProjectAIModal.jsx` |
| 7 | `src/utils/aiPrompt.js` updated — `buildProjectPrompt` now accepts optional `activeTask` and `projectInstructions` params; both included in generated prompt when present | `src/utils/aiPrompt.js` |
| 8 | `src/index.css` updated — new classes added (no existing classes changed): `.continue-card`, `.continue-card-meta`, `.next-action`, `.task-panel`, `.task-item`, `.task-badge` (4 color variants), `.task-form`, `.task-detail`, `.timeline-page`, `.activity-entry`, and supporting classes | `src/index.css` |
| 9 | `src/App.jsx` updated — `/p/:repo/timeline` route added; existing routes unchanged | `src/App.jsx` |

---

## Working Features (added 2025-07-12)

### Project Memory (localStorage, no backend)
- Last opened time, last file, last save label, last AI tool/instruction — recorded automatically as the user works
- Data persists across sessions in `localStorage` keys `plainly_memory_${owner}_${repo}`

### "Continue where you left off" dashboard
- Most recently opened project shown prominently on the dashboard with all available memory data
- Recommended next action computed from real stored data (active task > last save > last file > default)
- Project cards in the "All projects" list show memory-based last-opened time and active task badge

### Task memory (localStorage, no backend)
- Full task CRUD: create, update status, edit notes, delete
- Statuses: open, in-progress, review, done
- Active task shown in the Files page summary bar
- Collapsible task panel in the file sidebar — shows up to 3 tasks, "View all" opens a detail sheet
- Task detail sheet: status dropdown, notes textarea, delete button

### Project Timeline page (`/p/:repo/timeline`)
- Recent save points fetched from GitHub API (commits for all files, deduplicated, most recent 10)
- "Where you left off" memory card (last opened, last file, last save, last AI handoff)
- Full task list with status badges
- Honest empty states throughout

### AI handoff memory
- When the user opens an AI tool or copies the prompt from the AI modal, the tool ID and instruction are recorded in project memory
- `buildProjectPrompt` now includes active task context and project instructions in the prompt

---

## Current Update (2026-09-04 — Yourkly favicon and search discoverability)

- Added the approved Yourkly favicon, a canonical public logo asset, and share-card metadata.
- Restored the clean wordmark across the app. The stork is now a separate, sidebar-only brand mark rather than part of the wordmark.
- Added a canonical URL, concise product description, Open Graph/Twitter metadata, and accurate JSON-LD for the organization, website, and web application.
- Added `robots.txt` and `sitemap.xml`. Public search crawlers and `OAI-SearchBot` may crawl the landing page; authenticated and API routes are excluded. `GPTBot` is blocked, so public content is eligible for ChatGPT Search without opting into GPTBot training.
- Build passed. The remaining external step is DNS verification for `yourkly.com`, then submitting the sitemap to Google Search Console and Bing Webmaster Tools.

## Current Update (2026-09-04 — Continue in handoff)

- Renamed the project handoff entry point to **Continue in…** throughout the project.
- Added Lovable, Cursor, and VS Code alongside the existing AI choices. Each choice opens its official service and shows a clear, tool-specific copy-and-paste next step.
- Kept the handoff local and user-controlled: Yourkly creates the project brief, the user copies it, and no third-party credentials or project data are sent by Yourkly.
- Updated generated project-brief branding from Yourkly to Yourkly and added visible keyboard focus styles to the destination picker.

## Current Update (2026-09-04 — Social preview image)

- Replaced the ultra-wide wordmark in Open Graph and X/Twitter metadata with a dedicated, padded Yourkly social preview image featuring the approved app icon and stork mascot.
- Added image dimensions and accessible image descriptions. The versioned image URL lets social platforms fetch the new card instead of retaining the previously cropped wordmark preview.

## Current Update (2026-09-04 — Landing page and stork)

- Rebuilt the signed-out landing page around the Yourkly value proposition: where you left off, what changed, and what to do next.
- Added a short, reduced-motion-aware product-preview animation and a responsive three-step explanation of the workflow.
- Restored the approved stork to the landing hero, beside the product preview. It remains in the signed-in sidebar and social share image, and is deliberately not repeated through working screens.
- Added a functional support link in the landing footer. Privacy and terms links still require the owner’s business/contact details before they can be written accurately.

## Current Update (2026-09-04 — First sign-in fix)

- Fixed the OAuth start request when a visitor opens `yourkly.com` and Vercel redirects that request to `www.yourkly.com`.
- The request origin check now accepts only the matching apex/www pair over the same protocol. Other cross-origin requests remain blocked.
- Production verification before the fix showed the apex request returning `308 → www`, followed by `403 forbidden`; the www endpoint itself returned `200` and set the secure OAuth transaction cookie.

## Current Update (2026-09-04 — Vercel Web Analytics)

- Added the official `@vercel/analytics` package and mounted its React component once at the application root.
- Analytics will collect anonymized production page views after Web Analytics is enabled in the Yourkly Vercel project. No custom events or personal data have been added.

## In Progress

No tasks are currently in progress. The Project Intelligence Layer is complete.
The build is clean: **70 modules, 0 errors, 5.41s** (`npm run build`, 2025-07-12).

## Current Update (2026-09-24 — Yourkly project entry flow)

- The landing-page “Continue with Yourkly” action now opens the Yourkly project list directly and remembers the selected local workspace mode. It no longer sends users through an extra onboarding screen before they can continue.
- The empty project list shows one create action. The “+ New project” action appears once projects exist.
- The new-project form now keeps “My Projects” available in its header so users can return to their saved projects.
- GitHub sign-in continues to use the existing OAuth flow and returns to the signed-in dashboard. Yourkly-only projects remain stored in the current browser on this device.
- Validation: `npm run build` passed (119 modules, 0 errors). Vite reports the existing main JavaScript bundle just over its 500 kB advisory threshold.

## Current Update (2026-09-30 — Native users get the same shell)

- Owner report: after GitHub login the browser URL changes to plainly-lilac.vercel.app. Root cause found in code review: the authorize URL sent to GitHub carries no `redirect_uri`, so GitHub falls back to the Authorization callback URL registered on the OAuth app, which still points at the old Vercel deployment URL. There is no hardcoded deployment URL in the codebase; `AuthCallback.jsx` navigates relatively. Fix is a setting, not code: in GitHub Settings > Developer settings > OAuth Apps, change the app's Authorization callback URL to `https://yourkly.com/auth/callback`.
- Owner requirement: anyone who signs up, GitHub or Yourkly-native, gets the same interface. Implemented:
  - `AppShell` takes a `native` prop. Native mode keeps the sidebar, phone top bar, and tab bar, with destinations that exist for native users: Home (/native/projects), New project (/native/new), Help (/help). Recent Activity and Account are GitHub-only and hidden. The sidebar footer reads "Kept in this browser" instead of a GitHub identity. The phone top bar shows the native project name inside a project.
  - `TabBar` takes a `native` prop with Home / New / Help tabs.
  - The three native pages (`NativeNewProject`, `NativeProjects`, `NativeProjectHome`) dropped their bespoke landing headers and now render inside the shell. `NativeHeader.jsx` deleted (was only used by the new-project page, and its Home link pointed at `/`, which shows the landing page to logged-out users).
  - All six `/help` routes are now public (Help uses no auth-dependent props) and wrapped in the shell, which adapts: GitHub users see GitHub nav, everyone else sees native destinations.
- No routes added or removed. No dependency changes. Native storage behavior unchanged (browser localStorage, no login).
- Validation: `npm run build` passed 2026-09-30. Changes staged, awaiting owner approval to commit/push.

## Current Update (2026-09-30 — "Yourk" leftovers fixed)

- Owner report: some pages rendered "Yourk" instead of "Yourkly". Root cause: an earlier partial rebrand (commit 3d39bda, "Rebrand primary interface as Yourk") renamed Plainly to "Yourk" in 58 user-facing strings; the later full rebrand to "Yourkly" only replaced remaining "Plainly" instances and left the "Yourk" ones untouched.
- Fix: replaced standalone "Yourk" with "Yourkly" in 11 files (help content, Home, Account, ChooseProjects, Help, NewUpdate, ReturnFromAI, ReviewAIChanges, two help subpages, one github.js error string). No identifiers, domains (yourk.app, tryyourk.com), or storage keys touched.
- Validation: `npm run build` passed 2026-09-30. Changes staged, awaiting owner approval to push.

## Current Update (2026-09-30 — two logos fixed, native home matches GitHub home)

- Owner report: the app sidebar showed two logos (two storks). Root cause: BrandWordmark already renders the stork + wordmark lockup, and commit f608258 ("Separate Yourkly stork from wordmark") added a second full-size stork image next to it in the AppShell sidebar. Fix: removed the extra sidebar stork and its import. BrandWordmark is unchanged, so every other usage stays consistent.
- Owner report: the GitHub home ("landing page for github") looked different from the Yourkly native home. Fix: rebuilt src/pages/NativeProjects.jsx on the same layout as src/pages/Home.jsx: time-based greeting (no name, no login), "Continue where you left off" hero card for the most recently active project (Save Point activity counts, not just creation date), dismissible explainer with native copy (own dismiss key), Recent projects list, and Recent activity fed by Save Points across projects. No AI change inbox for native (there is no handoff data behind it; an always-empty inbox would be decoration, not information). No em dashes in new copy.
- Validation: `npm run build` passed 2026-09-30. Changes staged, awaiting owner approval to push.

## Current Update (2026-10-03 — full stork in the logo lockup)

- Owner report: the logo was not completely viewable. Root cause: BrandWordmark rendered the stork through a 27x28px crop window (brand-stork-crop), so only a slice of the bird ever showed.
- Fix: BrandWordmark now renders the full stork image next to the wordmark (28px tall desktop, 24px under 720px, 22px on small mobile landing). Applies everywhere the lockup is used: sidebar, phone top bar, landing headers, loading screens.
- Validation: `npm run build` passed 2026-10-03. Changes staged, awaiting owner approval to push.



## 2026-10-04 reliability audit

- Added finite timeouts to the server-side GitHub session, proxy, OAuth token exchange, connection check, and revocation requests. A stalled provider now reaches the existing failure responses instead of holding the request open indefinitely. Revocation uses seven seconds, below the existing eight-second browser logout timeout.
- Added a ten-second initial session lookup timeout so the app stops loading when the session endpoint is unreachable.
- Session and GitHub proxy responses now send `Cache-Control: no-store` on success and failure.
- No routes, authentication scopes, provider permissions, or design changed. No dependencies added.
- Remaining limitations: native projects are local browser storage, not an account-backed cloud service; the process-local rate limiter is not shared across serverless instances. Authenticated GitHub workflows require a connected account for live verification.
- Validation: production build passes; four Node server reliability tests pass; smoke tests pass after replacing an obsolete frontend-token assertion with the current session-proxy/CSRF check.
- Updated 14 existing packages within the declared version ranges using nonbreaking audit fixes; npm audit now reports zero vulnerabilities for the installed lockfile. Existing top-level dependencies and architecture remain unchanged.

## Current Update (2026-10-07 — snapshot engine for native Save Points)

- Owner approved the snapshot engine spec and asked for the build. Native Save Points are now content-addressed snapshots instead of full copies: each file's bytes are stored once as a blob (SHA-256 id), each Save Point links to its parent, and the id is a hash of the snapshot content (same design as the tinyvcs prototype).
- New localStorage keys: `yourkly_native_blobs` (blob map), snapshots in `yourkly_native_versions`. One-time migration converts legacy full-copy Save Points into chained snapshots on first load, keeping the old records under `yourkly_native_versions_backup`. Migration never deletes user data on failure.
- Behavior changes (all per the approved spec): making a Save Point when nothing changed says so plainly and makes no duplicate; restoring a Save Point first saves current files as "Before going back" so nothing is lost (matches the GitHub path's existing rule); damaged Save Points are refused with a plain message.
- UI: Save Points tab shows per-save "What changed" (Added / Changed / Removed file names) and plain notices. No new routes, no new dependencies, no GitHub-path changes.
- Validation: `npm run build` passes (2026-10-07). Store tests pass in node: SHA-256 matches known vectors, snapshot chain, diff, blob dedup, restore with safety save, corruption refusal, legacy migration, export/import round trip in both formats.
- Not pushed. Awaiting owner approval to ship.
