# Yourkly — Project Definition

## Core Definition

**Yourkly is GitHub translated into normal human language for nontechnical users.**

GitHub is the most reliable, free, and permanent system available for storing, versioning,
and collaborating on text. Its weakness is that it was built by and for software engineers.
Every concept — repositories, commits, branches, diffs, pull requests — is named in
developer language and presented through a developer interface.

Yourkly removes that barrier. It exposes GitHub's power through plain words and simple
actions that any person can understand, regardless of their technical background.

---

## Who Yourkly Serves

Yourkly is for people who need reliable version control for their writing or project work
but have no software development background. This includes:

- Writers working on long-form projects (books, essays, scripts) who need to track drafts
  and recover earlier versions
- Freelancers managing project documentation, proposals, and client deliverables
- Small business owners keeping records, notes, and operational documents
- Students and researchers managing evolving documents over time
- Anyone who has lost work because they could not navigate developer tools

Yourkly does not require the user to know what GitHub is, what a repository is, or what
a commit means. Those concepts exist in the background; the user sees only plain equivalents.

---

## The Problem Yourkly Solves

Version control is a solved problem in software engineering. For everyone else, it is not
solved at all. Existing options fall into two categories:

1. **Developer tools** (GitHub, GitLab, raw Git): powerful, permanent, free — and
   completely inaccessible to nontechnical users due to terminology, interface complexity,
   and the assumption of command-line familiarity.

2. **Consumer tools** (Google Docs history, Dropbox versions, iCloud): accessible but
   limited, locked to specific platforms, and not designed for long-term archival or
   structured version management.

Yourkly occupies the gap: the full power of GitHub's versioning, storage, and collaboration
infrastructure, presented through an interface that any person can use on day one.

---

## Current Features (Verified)

The following features are built and working in the current codebase.

### Authentication
- Sign in with an existing GitHub account (OAuth)
- No separate Yourkly account or password required
- Session persisted in browser local storage

### Projects
- View all of the user's GitHub repositories as a list of Projects
- Create a new Project (creates a new GitHub repository)
- Open a Project to see its files
- Edit Project description and public/private visibility
- Delete a Project (with a name-confirmation safety step)

### Files
- View all text files in a Project (`.txt`, `.md`, `.markdown`, `.mdx`, `.text`, `.rst`)
- Create a new file with a chosen name
- Open a file in a plain-text editor
- Rename a file
- Delete a file (with a confirmation dialog)
- Download the current file
- Download all files in a project as a ZIP archive
- Copy a direct link to a file on GitHub

### Writing and Editing
- Plain-text editor with no visible developer interface
- Markdown preview toggle (for `.md` files)
- Adjustable font size (4 steps: 14, 16, 18, 20px)
- Focus mode (hides all navigation and chrome)
- Word count display in the footer
- Character count display in the footer
- Optional word goal with a progress bar
- Unsaved-changes indicator

### Saving and Version Control
- Manual save point with an optional plain-language label
- Auto-save every 30 seconds when there are unsaved changes
- Keyboard shortcut to open the save dialog (Cmd/Ctrl + S)
- Visual pulse animation on the Save Point button when changes are unsaved

### History and Restore
- Full history view for any file, presented as a timeline
- Each save point shows its label and a human-readable time (e.g. "3 days ago")
- "Go back to this version" restores any past save point as a new commit
- "Compare with now" shows a line-by-line diff between a past version and the current one
- Diff stats (lines added, lines removed)

### Help
- Help page accessible before and after sign-in
- Plain-English glossary of all product concepts
- Step-by-step "How it works" guide

---

## Intended Expansion

The current editor workflow is the first complete feature set within Yourkly. The product
is intended to grow into a complete plain-language interface for all the core things
GitHub can do.

The following areas are planned but not yet built:

### Collaboration
Allowing multiple users to work on the same Project, with plain-language equivalents for
GitHub's contributor and reviewer concepts.

### Publishing
Allowing a Project or file to be made visible with a readable URL, using GitHub Pages or
equivalent, without the user needing to configure anything.

### AI-Assisted Project Work
Allowing users to pass file content to an AI assistant (Claude, ChatGPT, Gemini, or
others) directly from within Yourkly. The first version of this feature — working title
"Continue with Another AI" — will copy a structured prompt containing the file's content
and open the user's chosen AI tool in a new tab.

This feature is one expansion of the existing Yourkly workflow. It is not a separate
product.

### Broader GitHub Translation
As GitHub adds or changes features, Yourkly's roadmap includes translating more of those
capabilities into plain language: issues as task lists, pull requests as proposed changes
for review, releases as published versions, and so on.

---

## What Yourkly Is Not

- Yourkly is not a general-purpose note-taking app.
- Yourkly is not a replacement for Google Docs or Word.
- Yourkly is not a Git client for developers.
- Yourkly is not an AI product — AI assistance is one feature, not the core.
- Yourkly is not a content management system.

The product is defined by its translation mission: GitHub's power, in plain language.
