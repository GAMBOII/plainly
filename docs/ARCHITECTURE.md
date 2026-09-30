# Yourkly — Architecture

This document describes the verified current architecture of Yourkly based on the
existing codebase. It does not describe planned systems as though they already exist.

---

## Overview

Yourkly is a client-rendered single-page application (SPA) that uses GitHub as its
backend. The React frontend communicates directly with the GitHub REST API for all
data operations. A thin Node.js/Express server (or equivalent Vercel serverless function)
exists solely to protect the GitHub OAuth client secret during the authentication handshake.

There is no Yourkly database. There is no Yourkly-specific backend for data storage.
All user data lives inside GitHub repositories under the user's own GitHub account.

---

## Repository Layout

```
yourkly/
├── api/
│   └── oauth/
│       └── exchange.js        # Vercel serverless function (production OAuth)
├── docs/                      # Project documentation
├── src/
│   ├── api/
│   │   └── github.js          # All GitHub REST API calls
│   ├── hooks/
│   │   └── useAuth.js         # Authentication state management
│   ├── pages/
│   │   ├── AuthCallback.jsx   # Handles the GitHub OAuth redirect
│   │   ├── Files.jsx          # Project file editor (largest page component)
│   │   ├── Help.jsx           # Help / glossary page
│   │   ├── History.jsx        # File version history and restore
│   │   ├── Projects.jsx       # Project list and creation
│   │   └── SignIn.jsx         # Unauthenticated landing / sign-in page
│   ├── utils/
│   │   └── time.js            # Relative time formatting and commit label helpers
│   ├── App.jsx                # Route definitions and auth gate
│   ├── index.css              # Global styles and design tokens
│   └── main.jsx               # React DOM entry point
├── .env.example               # Required environment variable reference
├── index.html                 # Vite HTML entry point
├── package.json
├── server.js                  # Local development OAuth server (Express)
├── vite.config.js             # Vite configuration with /api proxy
└── vercel.json                # Vercel deployment and rewrite rules
```

**Note:** `plainly-app.jsx` exists at the root but is not imported anywhere in the
application. It is a disconnected prototype and not part of the running product.

---

## Technology Stack

| Concern | Technology | Version |
|---|---|---|
| UI framework | React | 18.3.1 |
| Build tool | Vite | 6.0.5 |
| Routing | React Router DOM | 6.28.0 |
| Markdown parsing | marked | 18.0.5 |
| Diff rendering | diff | 9.0.0 |
| ZIP export | JSZip | 3.10.1 |
| Local dev server | Express | 4.21.2 |
| CORS middleware | cors | 2.8.5 |
| Dev process runner | concurrently | 9.1.2 |

All dependencies are listed in `package.json`. There is no TypeScript; all files use
plain JavaScript with JSX.

---

## Authentication Flow

Yourkly uses the **GitHub OAuth Web Application Flow** (Authorization Code Grant).
The client secret never leaves the server.

```
Browser                       Yourkly Server              GitHub
  │                                │                         │
  │── clicks "Get started" ────────│                         │
  │── redirect to github.com ──────│─────────────────────────▶
  │                                │       user approves     │
  │◀── redirect to /auth/callback?code=XXXX ────────────────│
  │                                │                         │
  │── POST /api/oauth/exchange ───▶│                         │
  │    { code: "XXXX" }            │── POST access_token ───▶│
  │                                │◀── { access_token } ───│
  │◀── { token: "gho_..." } ───────│                         │
  │                                │                         │
  │  stores token in localStorage  │                         │
  │── GET api.github.com/user ──────────────────────────────▶│
  │◀── { login, avatar_url, ... } ──────────────────────────│
```

### Dev vs Production OAuth Endpoint

| Environment | Endpoint | Implementation |
|---|---|---|
| Local development | `http://localhost:3001/api/oauth/exchange` | `server.js` (Express) |
| Production (Vercel) | `/api/oauth/exchange` (serverless) | `api/oauth/exchange.js` |

Vite's dev-server proxy (`vite.config.js`) forwards all `/api/*` requests to port 3001,
so the frontend code is identical in both environments.

---

## Frontend Responsibilities

The React frontend is responsible for all user-facing logic:

- **Routing** — `App.jsx` defines all routes and guards authenticated routes
- **Authentication state** — `useAuth.js` hook reads/writes `localStorage`,
  calls `getUser()` on mount to validate the stored token
- **All GitHub API communication** — `src/api/github.js` contains every fetch call;
  the GitHub token is sent as `Authorization: Bearer <token>` on each request
- **Editor state** — file content, dirty tracking, auto-save timer, font size, word goal
- **Modal management** — new file, delete file, rename, project settings, delete project
- **Diff computation** — `diff` library runs client-side in `History.jsx`
- **ZIP export** — `JSZip` runs client-side in `Files.jsx`

---

## Server Responsibilities

`server.js` (development) and `api/oauth/exchange.js` (production) share identical logic.
They handle **one route only**:

```
POST /api/oauth/exchange
Body: { code: string }
Response: { token: string }
```

The server holds `GITHUB_CLIENT_SECRET` and forwards the OAuth code to GitHub's token
endpoint. It returns the resulting access token to the browser. That is the server's
entire function. It does not store sessions, user data, or any application state.

---

## Data Flow

### Reading a file

```
Files.jsx
  └── getFileContent(token, owner, repo, path)
        └── GET api.github.com/repos/:owner/:repo/contents/:path
              └── response.content (base-64)
                    └── fromBase64() → plain text string
                          └── stored in React state (content, sha)
```

### Saving a file (save point)

```
Files.jsx → doSave(message)
  └── saveFile(token, owner, repo, path, content, sha, message)
        └── PUT api.github.com/repos/:owner/:repo/contents/:path
              body: { message, content: toBase64(text), sha }
              └── response.content.sha → new sha stored in state
```

The `sha` is GitHub's file blob SHA, required for optimistic concurrency. A 409 response
means the file changed on GitHub since it was last opened; the app surfaces a plain-language
error telling the user to reopen the file.

### Restoring a past version

```
History.jsx → handleRestore(commit)
  └── getFileAtCommit(token, owner, repo, path, commit.sha)
        └── GET …/contents/:path?ref=:sha → old content
  └── getFileContent(token, owner, repo, path)
        └── GET …/contents/:path → current sha
  └── saveFile(…, oldContent, currentSha, "Restored version from …")
        └── creates a new commit with the old content as its text
```

---

## Routing

All routes are defined in `src/App.jsx`.

| Path | Component | Auth required |
|---|---|---|
| `/` | `Projects` (or `SignIn` if not authenticated) | No (conditional) |
| `/auth/callback` | `AuthCallback` | No |
| `/p/:repo` | `Files` | Yes — redirects to `/` if not signed in |
| `/p/:repo/h/*` | `History` | Yes — redirects to `/` if not signed in |
| `/help` | `Help` | No (renders differently when signed in) |
| `*` (catch-all) | Redirect to `/` | — |

---

## External Services

| Service | How it is used |
|---|---|
| `github.com/login/oauth/authorize` | Redirect target for user sign-in |
| `github.com/login/oauth/access_token` | Token exchange (called server-side) |
| `api.github.com` | All data operations (called client-side, direct) |
| Google Fonts (Inter) | Loaded in `index.html` via `<link>` tag |

There are no analytics services, error tracking services, or third-party auth providers
currently integrated.

---

## Environment Variables

| Variable | Used by | Notes |
|---|---|---|
| `GITHUB_CLIENT_ID` | `server.js`, `api/oauth/exchange.js` | Server-side only |
| `GITHUB_CLIENT_SECRET` | `server.js`, `api/oauth/exchange.js` | Server-side only — never exposed to browser |
| `VITE_GITHUB_CLIENT_ID` | `src/pages/SignIn.jsx` | Baked into client bundle at build time. Must match `GITHUB_CLIENT_ID`. |
| `FRONTEND_URL` | `server.js` CORS origin | Optional; defaults to `http://localhost:5173` |
| `PORT` | `server.js` | Optional; defaults to `3001` |

**Known documentation gap:** `.env.example` currently omits `VITE_GITHUB_CLIENT_ID`.
This will break auth for new contributors who follow only the example file.

---

## How to Run Locally

```bash
# 1. Copy and fill in environment variables
cp .env.example .env
# Add: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, VITE_GITHUB_CLIENT_ID (same value as CLIENT_ID)

# 2. Install dependencies
npm install

# 3. Start both servers (Vite + Express OAuth server)
npm run dev
```

Vite serves the frontend at `http://localhost:5173`.
The Express OAuth server runs at `http://localhost:3001`.
Vite proxies `/api/*` to 3001 automatically.

The GitHub OAuth App callback URL must be set to `http://localhost:5173/auth/callback`.

---

## Production Deployment (Current: Vercel)

`vercel.json` configures three things:

1. Build command: `npm run build` (produces `dist/`)
2. Output directory: `dist/`
3. Rewrites:
   - `/api/(.*)` → `/api/$1` (routes to `api/oauth/exchange.js` serverless function)
   - `/(.*)` → `/index.html` (client-side routing fallback)

Required Vercel environment variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`VITE_GITHUB_CLIENT_ID`.

**Intended future hosting:** Cloudflare. See `docs/DECISIONS.md`.
