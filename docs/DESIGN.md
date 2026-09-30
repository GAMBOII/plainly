# Yourkly — Design System

This document describes only the design system that can be verified from the existing
source code. It does not invent conventions or describe intended future states as current.

All design values are sourced from `src/index.css`. All component patterns are sourced
from the existing page components.

---

## Design Philosophy

Yourkly's interface is deliberately minimal. The goal is to make GitHub-backed operations
feel like ordinary document management. The visual language avoids technical aesthetics
(no code fonts in primary UI, no developer-tool chrome) and uses plain English for every
visible label.

---

## Color Tokens

Defined in `src/index.css` as CSS custom properties on `:root`:

| Token | Value | Usage |
|---|---|---|
| `--purple` | `#6C5CE7` | Primary interactive color: buttons, active states, focus rings, links |
| `--purple-dark` | `#5849c4` | Hover state for primary purple elements |
| `--ink` | `#1C1B22` | Primary text color |
| `--canvas` | `#FBFAF8` | Page background, editor background |
| `--grey` | `#8A8794` | Secondary/muted text, placeholder text, inactive nav links |
| `--grey-light` | `#ECEAF4` | Surface backgrounds (sidebar, active file row, empty state, toolbar) |
| `--grey-border` | `#D8D6E3` | Border color for cards, inputs, dividers |
| `--success` | `#00B894` | Success states: auto-saved indicator, restored badge, word-goal progress |
| `--error-bg` | `#FFF0EE` | Error box background |
| `--error-text` | `#C0392B` | Error text and danger button color |

### Shadow and Radius

| Token | Value | Usage |
|---|---|---|
| `--radius` | `10px` | All cards, inputs, and buttons |
| `--shadow` | `0 2px 16px rgba(108,92,231,0.10)` | Hover shadow on project cards |

---

## Typography

**Font family:** `Inter` (loaded from Google Fonts), falling back to
`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.

**Base size:** 15px  
**Base line-height:** 1.6  
**Anti-aliasing:** `-webkit-font-smoothing: antialiased`

| Usage | Size | Weight |
|---|---|---|
| Wordmark | 22px (32px on sign-in) | 600 |
| Page section heading | 26px | 600 |
| Dashboard greeting | 22px | 600 |
| Project/file name | 16px | 500 |
| Body text | 15px | 400 |
| Secondary/meta text | 13–14px | 400 |
| Sidebar labels (uppercase) | 12px | 600 |
| Timestamps, badges | 13px | 400 |
| Editor | 16px default (14/16/18/20px user-adjustable) | 400 |
| Editor line-height | 1.75 | — |

---

## Component Patterns

### Buttons

Three button classes are defined:

**`.btn-primary`**  
Purple background (`--purple`), white text. Used for the primary action in any context
(Save Point, Create project, Create file, Sign in). Disabled state uses `--grey-light`
background and `--grey` text.

**`.btn-ghost`**  
Transparent background, `--grey-border` border, `--grey` text. Hover state shows
`--purple` border and text. Used for secondary actions (Cancel, History, Help, Download).

**`.btn-danger`**  
Transparent background, `--error-text` border and text. Hover state fills with
`--error-bg`. Used only in destructive confirmation dialogs (Delete file, Delete project).

**`.back-btn`**  
No border, no background. Grey text with a left-arrow prefix. Used in the topbar of
detail pages (Files, History) to navigate up.

### Inputs

**`.text-input`**  
Full-width, 15px, `--grey-border` border, `--radius` corners. Focus state: `--purple`
border with a soft `rgba(108,92,231,0.12)` box shadow.

**`.editor`** (the main writing area)  
Full-bleed textarea. No border, no resize handle. Uses `--canvas` background, 1.75
line-height, user-adjustable font size. Placeholder text uses `--grey`.

### Cards

**`.project-card`**  
Full-width button styled as a card with 18px/20px padding and `--grey-light` border.
Hover: `--purple` border and `--shadow`. Contains a project name, optional description,
and a timestamp.

**`.glossary-card`** (Help page)  
White background, `--grey-light` border. Contains a term (purple, 600 weight), a
definition, and an example.

### Modal

**`.modal-overlay`**  
Fixed full-screen with `rgba(28,27,34,0.45)` background and `backdrop-filter: blur(2px)`.
Centers the modal vertically and horizontally.

**`.modal`**  
White background, 16px border-radius, 32px padding, max-width 400px (460px for
`.modal-settings`). Drop shadow `0 8px 40px rgba(28,27,34,0.18)`.

Modal structure: heading (`h2`, 20px, 600), hint paragraph (`.modal-hint`, 13px grey),
content, then `.modal-actions` (flex row, right-aligned, ghost + primary buttons).

### Toast / Notification

**`.toast`**  
Fixed position, top 72px, right 20px. 14px, 500 weight, `border-radius: 8px`.
Two variants: `.toast-success` (green-tinted) and `.toast-error` (red-tinted).
Slides in via a `@keyframes slide-in` animation (0.2s ease). Auto-dismisses after 4 seconds.

### Topbar

**`.topbar`**  
Sticky, 60px height, flex row with 24px horizontal padding. Contains a back button
(left), a centered title, and an actions cluster (right). Uses `--grey-light` bottom
border and `--canvas` background.

### File Sidebar

**`.file-sidebar`**  
220px wide, white background, `--grey-light` right border. Contains a labeled header
with a "New file" button, then a list of file buttons. Active file uses `--grey-light`
background and `--purple` text.

### Timeline (History page)

The history timeline uses a rail-and-dot layout:
- **`.timeline-dot`**: 12px circle, `--grey-border` fill, green (`--success`) for a
  restored entry
- **`.timeline-line`**: 2px wide, `--grey-light`, connects dots vertically
- **`.timeline-body`**: message (15px, 500), meta (13px grey), action buttons
- Restore and Compare buttons are `opacity: 0` by default; they appear on hover

### Diff Panel

Monospace font (`Courier New`), 12px. Lines are colored by type:
- Added: `#e6fbf5` background, `+ ` prefix in `#007a57`
- Removed: `--error-bg` background, `−` prefix in `--error-text`
- Unchanged: `--grey` text, no prefix

---

## Layout Patterns

### App shell with sidebar nav (`Projects`, `Help` when signed in)

```
.projects-page (flex row, 100% height)
  .app-nav (200px, flex column, white, --grey-light right border)
    logo link
    nav links
    avatar + username + sign out
  .app-main (flex 1, overflow-y auto)
    .page-main (max-width 680px, centered, 40px top padding)
```

### Files page (sidebar + editor)

```
.files-page (flex column, 100% height)
  .topbar
  .project-summary-bar
  toast (fixed, overlaid)
  .files-layout (flex row, flex 1)
    .file-sidebar (220px)
    .editor-area (flex 1)
      .editor-toolbar
      .word-goal-bar (optional)
      textarea / markdown-preview
      .editor-footer
```

### Simple page (History, Help unsigned-in)

```
.page (flex column, 100% height)
  .topbar
  .page-main (max-width 680px, centered)
```

---

## Responsive Behavior

A single breakpoint at `max-width: 640px` handles mobile layout:

- `.projects-page` switches from `flex-direction: row` to `column`; the sidebar nav
  becomes a top bar
- `.files-layout` switches from row to column; the sidebar becomes a horizontal strip
  (max-height 200px)
- Font sizes reduce slightly across headings and the editor
- `.modal-actions` stacks buttons vertically (column-reverse)
- `.restore-btn` and `.compare-btn` lose their hover-reveal opacity and are always visible
- `.app-nav-username` is hidden; the avatar + sign-out link remain

A secondary breakpoint at `max-width: 380px` hides the project timestamp to prevent
overflow.

### Focus Mode

A class-based feature (`files-page.focus-mode`) that hides the topbar, summary bar,
sidebar, editor toolbar, and footer:

```css
.files-page.focus-mode > .topbar           { display: none; }
.files-page.focus-mode > .project-summary-bar { display: none; }
.files-page.focus-mode .file-sidebar       { display: none; }
.files-page.focus-mode .editor-toolbar     { display: none; }
.files-page.focus-mode .editor-footer      { display: none; }
.files-page.focus-mode .editor {
  padding: 80px 120px;
  font-size: 18px !important;
}
```

---

## Plain-Language Translations in the UI

The following are verified examples where GitHub concepts are translated into plain
language in the existing interface.

| Context | GitHub / technical term | Yourkly UI wording |
|---|---|---|
| `Projects.jsx` — page title, card label | Repository | Project |
| `Files.jsx` — save button | Commit | Save point |
| `Files.jsx` — topbar button | git log / commits | History |
| `History.jsx` — restore button | Revert / checkout | Go back to this version |
| `History.jsx` — diff button | Diff / compare commits | Compare with now |
| `History.jsx` — history banner | N commits | N save points |
| `History.jsx` — restored confirmation | Restored | Restored ✓ |
| `Files.jsx` — auto-save phrase | Commit message | "Saved progress", "Checkpoint saved", "Version saved", "Kept this version", "Saved a copy" (random) |
| `SignIn.jsx` — tagline | Version control | "Version control in plain words" |
| `SignIn.jsx` — feature bullets | Commits, history | "Every version of your work is kept safe", "Go back to any save point" |
| `Help.jsx` — glossary term | Repository | Project |
| `Help.jsx` — glossary term | Commit | Save point |
| `Help.jsx` — glossary term | git log | History |
| `Help.jsx` — glossary term | Revert | Go back to this version |
| `time.js` — `formatCommitLabel` | `Created <path>` (API message) | "First version" |
| `time.js` — `formatCommitLabel` | `Restored version from …` | "Restored to an earlier version" |
| `Files.jsx` — editor footer | Unsaved changes | "Unsaved · Cmd+S to save" |
| `Files.jsx` — 409 conflict error | Conflict / SHA mismatch | "This didn't save because the file changed somewhere else. Open it again to see the latest version." |

---

## Accessibility Notes (Verified)

- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions
- `:focus-visible` is defined globally with a purple 2px outline
- Modals use `role="dialog"` and `aria-modal="true"`
- The editor textarea uses `aria-label={Editing ${activeFile.name}}`
- Toast notifications use `role="status"`
- Decorative arrow glyphs use `aria-hidden="true"`
