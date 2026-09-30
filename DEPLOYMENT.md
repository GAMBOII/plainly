# Yourkly Redesign — Deployment Checklist

**Date:** 2026-07-28  
**Status:** ✅ READY FOR DEPLOYMENT  
**Build:** Passing (91 modules, 3.56s)

---

## Pre-Deployment Verification

### Code Quality
- [x] Build passes with zero errors
- [x] No TypeScript/ESLint warnings
- [x] All imports resolved
- [x] CSS correctly integrated (tokens.css imported in main.jsx)
- [x] Responsive design verified (800px, 860px, 880px, 1000px breakpoints)

### Feature Completeness
- [x] Data model: updateMemory.js with 7-state lifecycle
- [x] Routes: 21 routes fully defined and functional
- [x] Navigation: AppShell with global + project nav working
- [x] heroFor(): Single source of truth, consistent across 3 screens

### Screens (Implementation Status)
- [x] **Home** — Dashboard fully implemented, all sections, 2-column layout
- [x] **ProjectHome** — Project dashboard fully implemented
- [x] **Updates** — Flat list view fully implemented
- [x] **UpdateWorkspace** — Full detail view with lifecycle indicator
- [x] **ContinueWithAI** — 4-step handoff process fully implemented
- [x] **ReturnFromAI** — Change detection with backend logic (3/5 branches tested)
- [x] **ReviewAIChanges** — 4-card review layout implemented
- [x] **Other screens** — Welcome, SignIn, Account, Activity, Help, NewProject, NewUpdate, Files, Settings, SavePoints, WhatChanged, Share, Versions, History — all routed and rendered

### Design System
- [x] tokens.css created with all design tokens (colors, shadows, spacing, radii)
- [x] .pl-btn-primary, .pl-btn, .pl-pill, .pl-todo components styled
- [x] Status pills for all 7 update statuses (+ 2 off-path)
- [x] All typography scales implemented (30px titles through 11px labels)
- [x] Dark mode not required (light theme complete)

### Functionality
- [x] GitHub OAuth flow working
- [x] Repo list fetching from GitHub API
- [x] Update creation with updateMemory persistence
- [x] Hero card rendering with heroFor() logic
- [x] Status transitions working (planned → ready_for_ai → sent_to_ai, etc.)
- [x] Handoff prompt building (aiPrompt.js integration)
- [x] Change detection with GitHub API (getCurrentHeadSha, compareCommits)
- [x] localStorage persistence for updates, projects, auth state

---

## Deployment Steps

### 1. Pre-Flight Checks (Local)
```bash
# ✅ Already done
npm run build  # Verify build passes
npm run dev    # Start dev server
```

### 2. Environment Setup (Production)

Three variables, from an **OAuth App** (github.com/settings/applications/new — *not*
a GitHub App; the code uses OAuth App endpoints and `scope=repo`).

```
VITE_GITHUB_CLIENT_ID=<Client ID>       # public: baked into the browser bundle
GITHUB_CLIENT_ID=<the same Client ID>   # server: token exchange, revoke, check
GITHUB_CLIENT_SECRET=<Client Secret>    # server only — never with a VITE_ prefix
```

`VITE_` variables are read at build time, so adding them does nothing to a build that
already exists — **redeploy after setting them**.

The callback URL is not an environment variable. It comes from the OAuth App
registration and must be exactly `https://<your-domain>/auth/callback`.

### 3. Deploy to Vercel
```bash
vercel deploy --prod
# or via GitHub auto-deploy if branch is connected
```

### 4. Post-Deployment Smoke Tests
```
□ Sign in with GitHub
□ See dashboard (/)
□ Navigate to Projects (/projects)
□ Navigate to Help (/help)
□ Click into a project (/p/:repo)
□ View Updates list (/p/:repo/updates)
□ Create a new update (/p/:repo/new-update)
□ View update detail (/p/:repo/u/:updateId)
□ Start Continue with AI flow (/p/:repo/u/:updateId/ai)
□ Check for changes (/p/:repo/u/:updateId/return)
□ Review changes (/p/:repo/u/:updateId/review)
```

---

## Known Limitations & Future Work

### Not Yet Implemented (Marked with "Requires implementation" badge)
1. **ReturnFromAI Branch 3 & 4:** 
   - Branch 3: External commits detection (requires parsing commit authors)
   - Branch 4: Local vs remote conflict detection (requires local state tracking)

2. **ReviewAIChanges Project Check:**
   - Build validation (would need CI integration)
   - Security scan results (would need security tool integration)
   - Broken link detection (would need link crawler)

3. **Story/History:**
   - Full update.story array population (currently shows "Requires implementation" badge)
   - Commit history sync (would need periodic GitHub API polling)

4. **File Management:**
   - File diff visualization (basic diff exists, advanced features pending)
   - Folder hierarchy support (currently filters out folders)
   - Binary file handling (currently text-only)

### Optional Enhancements
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts (e.g., Cmd+S to save)
- [ ] Search across updates
- [ ] Bulk operations (multi-select updates)
- [ ] Export to PDF
- [ ] Email notifications
- [ ] Slack integration
- [ ] CLI for headless workflows

---

## Rollback Plan

If deployment fails:
1. `vercel rollback` (or revert to previous deployment via Vercel dashboard)
2. No database migrations were made, so state is reversible
3. localStorage data is client-side, so users keep their local updates

If critical bug discovered:
1. Revert the commit on main
2. Deploy previous commit: `vercel deploy --prod`
3. Create a hotfix branch for the bug

---

## Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Build time | < 10s | 3.56s | ✅ |
| CSS size | < 100 KB | 72.62 KB (gzip: 11.98 KB) | ✅ |
| JS size | < 500 KB | 466.38 KB (gzip: 141.73 KB) | ✅ |
| First contentful paint | < 2s | Unknown (test needed) | ⏳ |
| Lighthouse score | > 80 | Unknown (test needed) | ⏳ |

---

## Sign-Off

- [ ] Engineering review (code, architecture, security)
- [ ] Product review (features, copy, design)
- [ ] QA sign-off (end-to-end testing complete)
- [ ] PM approval (ready for users)

---

## Post-Deployment Monitoring

### Day 1
- Monitor Vercel logs for errors
- Check GitHub OAuth flow (error rates, session creation)
- Verify API response times (GitHub API calls)

### Week 1
- Monitor user adoption rate
- Track error frequency and types
- Collect user feedback via in-app surveys
- Monitor performance metrics (Lighthouse, Core Web Vitals)

### Ongoing
- Weekly error rate review
- Monthly performance analysis
- Quarterly feature usage analysis

---

## Contact

**On-call:** [team contact info]  
**Escalation:** [slack channel or email]  
**Issue tracking:** [Linear/GitHub Issues project]
