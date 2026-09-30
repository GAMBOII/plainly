# Yourkly Redesign — End-to-End Test Plan

**Test Scope:** All 7 core user workflows  
**Environment:** Development (localhost:5173)  
**Browser:** Chrome/Chromium  
**Date:** 2026-07-28

---

## Test Environment Setup

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open browser to http://localhost:5173
# Or run automated tests (when available)
```

**Test Account:**
- GitHub OAuth configured for development
- Test repo created: `{username}/plainly-test`

---

## Test Cases

### 1. Sign-In Flow ✅

**Path:** `/` → GitHub OAuth → `/`

#### Steps:
1. Load http://localhost:5173
2. Click "Continue with GitHub"
3. Approve OAuth scope
4. Should redirect to home dashboard
5. Should show GitHub username + avatar in sidebar footer

**Expected:** Homepage loads with active user profile

**Result:** _To be tested_

---

### 2. Dashboard & Project Navigation ✅

**Path:** `/` → `/projects` → `/p/:repo` → back

#### Steps:
1. From home, click "All projects" button
2. Should see list of user's repos
3. Click on a repo name
4. Should load project dashboard
5. Verify sidebar shows project nav items
6. Click "Home" in sidebar
7. Should return to main dashboard

**Expected:** Navigation is smooth, sidebar updates based on route

**Result:** _To be tested_

---

### 3. Create & View Update ✅

**Path:** `/p/:repo/new-update` → `/p/:repo/updates` → `/p/:repo/u/:updateId`

#### Steps:
1. On project page, click "Make an update"
2. Fill form: Title "Add dark mode" + Goal "User can toggle dark/light theme"
3. Click submit
4. Should show summary card with next step
5. Click "See all updates"
6. Should see update in list with status pill
7. Click the update
8. Should show full update detail with lifecycle indicator
9. Verify hero card shows all 4 fields from heroFor()

**Expected:** Update created, persisted in localStorage, displays correctly

**Result:** _To be tested_

---

### 4. Continue with AI Workflow ✅

**Path:** `/p/:repo/u/:updateId/ai` (4 steps)

#### Step 1: AI Selection
1. From update detail, click "Continue with AI"
2. Should show AI selection chips (Claude, ChatGPT, Bob, Codex, Other)
3. Click "Claude"
4. Chip should highlight in purple
5. Auto-advance to step 2

**Expected:** AI selection works, chip highlights, step advances

#### Step 2: Context Selection
1. Should show 8 context items
2. First 3 are disabled (always-on): Project, Goal, Where left off
3. Click "Build handoff"
4. Should build prompt and advance to step 3

**Expected:** Context items disabled properly, handoff builds

#### Step 3: Copy Handoff
1. Should show monospace handoff preview (scrollable)
2. Click "Copy handoff"
3. Button text should change to "Copied ✓"
4. Should be copyable to clipboard

**Expected:** Handoff shown, copyable

#### Step 4: Mark as Sent
1. Click "Mark as sent to Claude"
2. Update status should change to "sent_to_ai"
3. Should show "Marked as sent" confirmation
4. sidebar should update to show new status

**Expected:** Status transition works, UI updates

**Result:** _To be tested_

---

### 5. Return from AI (Change Detection) ✅

**Path:** `/p/:repo/u/:updateId/return` (5 branches)

#### Setup:
- Must have a previous handoff with commitShaAtSend recorded

#### Branch 1: Changes Detected
1. Manually create a commit in GitHub
2. Load return screen
3. Should auto-check for changes
4. Should show "X files changed" message
5. Button should say "Review changes"

**Expected:** Detects real GitHub changes

#### Branch 2: Nothing Yet
1. Don't make any commits after handoff
2. Load return screen
3. Should show "Nothing has changed yet"
4. Should offer "Check again" and "Resend to AI" options

**Expected:** Correctly detects no changes

**Result:** _To be tested_

---

### 6. Review Changes ✅

**Path:** `/p/:repo/u/:updateId/review` (4 cards)

#### Steps:
1. From return screen, click "Review changes"
2. Should show 4 cards:
   - Card 1: WHAT YOU ASKED FOR (shows goal verbatim)
   - Card 2: WHAT CHANGED (shows file count)
   - Card 3: WHAT ELSE CHANGED (amber card, shows "Nothing else touched")
   - Card 4: PROJECT CHECK (shows "Requires implementation" badge)
3. Below cards: Files affected section with chips
4. "Show technical details" link
5. Decision section with:
   - Accept and save (purple button)
   - Ask AI to fix (secondary button)
6. Click "Accept and save"
7. Should redirect to `/p/:repo/save`
8. Update status should be "ready_to_save"

**Expected:** 4 cards display correctly, actions work, status transitions

**Result:** _To be tested_

---

### 7. Help & Account Pages ✅

**Path:** `/help` → `/account` → back

#### Help Page:
1. Click Help in sidebar
2. Should show help content (sections visible)
3. Page should have max-width of 680px

#### Account Page:
1. Click Account in sidebar
2. Should show user profile, GitHub connection status
3. Verify avatar from GitHub shows correctly

**Expected:** Pages load and display

**Result:** _To be tested_

---

## Responsive Design Tests

### Desktop (1920x1080)
- [ ] All cards have proper max-widths
- [ ] Two-column layouts work (Projects + Activity on Home)
- [ ] Sidebar sticky positioning works on scroll

### Tablet (800x1024)
- [ ] Single-column layouts activate
- [ ] Buttons stay clickable (min 44px touch targets)
- [ ] Sidebar may collapse or scroll

### Mobile (375x667)
- [ ] All fonts readable without zooming
- [ ] Touch targets are 44px minimum
- [ ] Forms are full-width but padded
- [ ] Modals center properly

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Test required |
| Firefox | Latest | ✅ Test required |
| Safari | Latest | ✅ Test required |
| Edge | Latest | ✅ Test required |

---

## Accessibility Tests

- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] Screen reader friendly (test with NVDA/JAWS)
- [ ] Color contrast meets WCAG AA (check all text on backgrounds)
- [ ] Focus indicators visible on all buttons
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers

---

## Performance Tests

### Metrics to Check
- [ ] Lighthouse score > 80 (Performance, Accessibility, Best Practices, SEO)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 4s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3s

### Tools
```bash
# Local performance check
npm run build
npx http-server dist -p 8080
# Open DevTools > Lighthouse
```

---

## Security Tests

- [ ] CSRF tokens present if needed
- [ ] XSS protection: no unescaped HTML injection
- [ ] SQL injection: not applicable (using GitHub API)
- [ ] OAuth token not exposed in console/network
- [ ] localStorage doesn't contain sensitive data
- [ ] API calls use HTTPS

---

## Network Tests

### Simulated Slow Network
1. DevTools > Network > Slow 3G
2. Load home page
3. Should show loading states
4. Should eventually load without hanging

### Offline
1. DevTools > Network > Offline
2. Try to load page
3. Should show appropriate error message
4. Should allow cached content if available

---

## Error Handling Tests

- [ ] Network error on GitHub OAuth → Show error message
- [ ] GitHub API rate limit → Show helpful message
- [ ] Invalid JWT token → Redirect to sign-in
- [ ] 404 route → Show 404 page
- [ ] Missing update ID → Show error + back button

---

## Data Persistence Tests

- [ ] localStorage updates survive page reload
- [ ] New update created → still there after close/reopen
- [ ] Update status changes → persisted in localStorage
- [ ] Handoff state saved → can return to continue flow

---

## Cross-Window Tests

- [ ] Open app in 2 tabs
- [ ] Create update in tab 1
- [ ] Switch to tab 2
- [ ] Updates list should show new update (if using event listeners)

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Sign-In | ⏳ | |
| 2. Navigation | ⏳ | |
| 3. Create Update | ⏳ | |
| 4. Continue with AI (4 steps) | ⏳ | |
| 5. Return from AI (5 branches) | ⏳ | |
| 6. Review Changes (4 cards) | ⏳ | |
| 7. Help & Account | ⏳ | |
| Responsive (Desktop) | ⏳ | |
| Responsive (Tablet) | ⏳ | |
| Responsive (Mobile) | ⏳ | |
| Accessibility | ⏳ | |
| Performance | ⏳ | |
| Security | ⏳ | |

---

## Known Test Issues

- ReturnFromAI Branch 3 & 4 require manual setup (external commits, local conflicts)
- ReviewAIChanges Project Check shows "Requires implementation" (real checks would need CI)
- Lighthouse may show warnings about third-party scripts (GitHub OAuth)

---

## Test Sign-Off

- [ ] All 7 workflows tested end-to-end
- [ ] Responsive design verified on 3+ screen sizes
- [ ] No console errors or warnings
- [ ] All navigation links work
- [ ] Accessibility basics passed
- [ ] Performance acceptable

**Tested by:** _______________  
**Date:** _______________  
**Approved for deployment:** _______________
