// GitHub credentials stay in the encrypted server-side session. Every request
// goes through the same-origin proxy, which only forwards the narrow GitHub
// API surface this app uses.
const API = '/api/github'

let csrfToken = ''

export function setCsrfToken(value) {
  csrfToken = value || ''
}

export function getCsrfToken() {
  return csrfToken
}

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'X-CSRF-Token': csrfToken,
  }
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str)
  const binString = Array.from(bytes, b => String.fromCharCode(b)).join('')
  return btoa(binString)
}

function fromBase64(b64) {
  const binString = atob(b64.replace(/\s/g, ''))
  const bytes = Uint8Array.from(binString, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function getRepoInfo(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  if (!r.ok) return null
  return r.json()
}

export async function getUser(token) {
  const r = await fetch(`${API}/user`, { headers: headers(token) })
  if (!r.ok) throw new Error('Could not load your account.')
  return r.json()
}

/**
 * Every project this account can reach.
 *
 * No `affiliation` parameter, deliberately. GitHub's own default is
 * `owner,collaborator,organization_member`; this used to narrow it to `owner`,
 * which meant a project shared with you, or belonging to a team, had never
 * once appeared in Yourkly.
 *
 * Paged, because that change can turn four projects into several hundred. The
 * cap exists so a very large account can't hang the screen — and `truncated`
 * says so rather than presenting a partial list as the whole truth.
 */
const REPO_PAGE_CAP = 5   // 500 projects

export async function getRepos(token) {
  const all = []
  let truncated = false

  for (let page = 1; page <= REPO_PAGE_CAP; page++) {
    const r = await fetch(`${API}/user/repos?sort=updated&per_page=100&page=${page}`, {
      headers: headers(token),
    })
    if (!r.ok) {
      if (page === 1) throw new Error('Could not load your projects. Try refreshing the page.')
      break                        // keep what we already have
    }
    const batch = await r.json()
    if (!Array.isArray(batch) || batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break  // that was the last page
    if (page === REPO_PAGE_CAP) truncated = true
  }

  all.truncated = truncated
  return all
}

export async function createRepo(token, name, description, options = {}) {
  const r = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    // description is what /new asks for in "what is it for?" — it shows on the
    // dashboard and goes into every AI handoff, so it has to reach GitHub.
    body: JSON.stringify({ name, description: description || '', auto_init: options.addAbout !== false, private: options.isPrivate !== false })
  })
  if (r.status === 422) throw new Error('A project with that name already exists. Try a different name.')
  if (!r.ok) throw new Error('Could not create the project. Try again.')
  return r.json()
}

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.mdx', '.text', '.rst']

export async function getFiles(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents`, { headers: headers(token) })
  if (r.status === 404) return []
  if (!r.ok) throw new Error('Could not load the files in this project. Try refreshing the page.')
  const all = await r.json()
  if (!Array.isArray(all)) return []
  return all.filter(f => f.type === 'file' && TEXT_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
}

export async function getFileContent(token, owner, repo, path) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: headers(token)
  })
  if (!r.ok) throw new Error('Could not open this file. Try again.')
  const data = await r.json()
  return { content: fromBase64(data.content), sha: data.sha }
}

export async function saveFile(token, owner, repo, path, content, sha, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(content), sha })
  })
  if (r.status === 409) {
    throw new Error("This didn't save because the file changed somewhere else. Open it again to see the latest version.")
  }
  if (!r.ok) throw new Error('Could not save. Try again.')
  return r.json()
}

export async function createFile(token, owner, repo, path) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `Created ${path}`, content: toBase64('') })
  })
  if (r.status === 422) throw new Error('A file with that name already exists.')
  if (!r.ok) throw new Error('Could not create the file. Try again.')
  return r.json()
}

export async function getFileHistory(token, owner, repo, path) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=50`,
    { headers: headers(token) }
  )
  if (!r.ok) throw new Error('Could not load the history for this file. Try refreshing.')
  return r.json()
}

export async function getFileAtCommit(token, owner, repo, path, sha) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${sha}`,
    { headers: headers(token) }
  )
  if (!r.ok) throw new Error('Could not load that version of the file.')
  const data = await r.json()
  return fromBase64(data.content)
}

export async function deleteFile(token, owner, repo, path, sha, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'DELETE',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha })
  })
  if (!r.ok) throw new Error('Could not delete this file. Try again.')
  return r.json()
}

export async function createFileWithContent(token, owner, repo, path, content, message) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: toBase64(content) })
  })
  if (r.status === 422) throw new Error('A file with that name already exists.')
  if (!r.ok) throw new Error('Could not create the file. Try again.')
  return r.json()
}

export async function updateRepoSettings(token, owner, repo, settings) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!r.ok) throw new Error('Could not update project settings. Try again.')
  return r.json()
}

export async function deleteRepo(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, {
    method: 'DELETE',
    headers: headers(token)
  })
  if (!r.ok) throw new Error('Could not delete the project. Try again.')
}

/**
 * Get the current HEAD SHA for the repo's default branch
 */
export async function getCurrentHeadSha(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) })
  if (!r.ok) throw new Error('Could not get repo info.')
  const data = await r.json()
  const branch = data.default_branch || 'main'

  const br = await fetch(`${API}/repos/${owner}/${repo}/branches/${branch}`, { headers: headers(token) })
  if (!br.ok) throw new Error('Could not get branch info.')
  const branchData = await br.json()
  return branchData.commit.sha
}

/**
 * Compare two commits and return files that changed between them
 * Returns: { filesChanged: number, commitCount: number, commits: [] }
 */
export async function compareCommits(token, owner, repo, baseSha, headSha) {
  if (!baseSha || !headSha) return { filesChanged: 0, commitCount: 0, commits: [] }
  if (baseSha === headSha) return { filesChanged: 0, commitCount: 0, commits: [] }

  try {
    const r = await fetch(
      `${API}/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`,
      { headers: headers(token) }
    )
    if (!r.ok) return { filesChanged: 0, commitCount: 0, commits: [] }

    const data = await r.json()
    return {
      filesChanged: data.files?.length || 0,
      commitCount: data.commits?.length || 0,
      commits: data.commits || [],
      files: data.files || []
    }
  } catch {
    throw new Error('Could not compare commits.')
  }
}

/**
 * Get commit details including author
 */
export async function getCommitDetails(token, owner, repo, sha) {
  try {
    const r = await fetch(`${API}/repos/${owner}/${repo}/commits/${sha}`, { headers: headers(token) })
    if (!r.ok) throw new Error('Could not get commit details.')
    return r.json()
  } catch {
    return null
  }
}

/**
 * Everything in a folder — files *and* folders, nothing filtered out.
 *
 * getFiles() above keeps its text-file filter for the editor's file list.
 * This is what the Project Files screen and the AI handoff use, because the
 * design shows folders (HANDOFF §7.14).
 */
export async function getContents(token, owner, repo, path = '') {
  const url = path
    ? `${API}/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
    : `${API}/repos/${owner}/${repo}/contents`
  const r = await fetch(url, { headers: headers(token) })
  if (r.status === 404) return []
  if (!r.ok) throw new Error('Could not load the files in this project. Try refreshing the page.')
  const all = await r.json()
  if (!Array.isArray(all)) return []
  // Folders first, then files, each alphabetically — the order the design shows.
  return all.sort((a, b) =>
    a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1
  )
}

/**
 * How many Save Points this project has on its main version.
 *
 * This is what makes "v18" a real number rather than a label: ask for a single
 * commit and read the last page number out of the Link header, which is the
 * total. GitHub lists Link in Access-Control-Expose-Headers, so the browser is
 * allowed to read it.
 *
 * Returns null when it can't be counted. Callers must render null as no version
 * at all — never v0, never vNaN.
 */
export async function getSavePointCount(token, owner, repo) {
  try {
    const r = await fetch(`${API}/repos/${owner}/${repo}/commits?per_page=1`, {
      headers: headers(token),
    })
    if (r.status === 404 || r.status === 409) return 0   // no repo, or no commits yet
    if (!r.ok) return null

    // With 0 or 1 commits there is nothing to paginate and no Link header.
    const link = r.headers.get('Link')
    if (!link) {
      const data = await r.json()
      return Array.isArray(data) ? data.length : null
    }

    const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/)
    return match ? Number(match[1]) : 1
  } catch {
    return null
  }
}

/**
 * Recent Save Points (commits) on the project's main version.
 */
export async function getCommits(token, owner, repo, perPage = 20) {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/commits?per_page=${perPage}`,
    { headers: headers(token) }
  )
  if (r.status === 404 || r.status === 409) return []   // 409 = empty repository
  if (!r.ok) throw new Error('Could not load the Save Points for this project.')
  const data = await r.json()
  return Array.isArray(data) ? data : []
}

/* ── Things to do ──────────────────────────────────────────────────────────
   GitHub Issues, which is where a project's to-do list actually lives. */

/**
 * Open (or closed) things to do.
 *
 * GitHub's own note on this endpoint: "every pull request is an issue, but not
 * every issue is a pull request … 'Issues' endpoints may return both". A pull
 * request is not a thing to do, so anything carrying `pull_request` is dropped.
 */
export async function getIssues(token, owner, repo, state = 'open') {
  const r = await fetch(
    `${API}/repos/${owner}/${repo}/issues?state=${state}&sort=updated&per_page=50`,
    { headers: headers(token) }
  )
  if (r.status === 404 || r.status === 410) return []   // no repo, or issues turned off
  if (!r.ok) throw new Error('Could not load the things to do for this project.')
  const all = await r.json()
  return Array.isArray(all) ? all.filter(i => !i.pull_request) : []
}

export async function createIssue(token, owner, repo, title, body) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body: body || undefined }),
  })
  if (r.status === 410) throw new Error('This project has its to-do list turned off on GitHub.')
  if (r.status === 403) throw new Error("You don't have permission to add to this project's list.")
  if (!r.ok) throw new Error('Could not add that. Try again.')
  return r.json()
}

/** Tick one off, or put it back. `state` is 'closed' or 'open'. */
export async function setIssueState(token, owner, repo, number, state) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/issues/${number}`, {
    method: 'PATCH',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (r.status === 403) throw new Error("You don't have permission to change this project's list.")
  if (!r.ok) throw new Error('Could not change that. Try again.')
  return r.json()
}

/* ── Stars ─────────────────────────────────────────────────────────────────
   GitHub's way of saying "this one matters to me". The count is public; the
   endpoint below answers only for the signed-in account. */

/** 204 = starred, 404 = not. Anything else means we don't know — say so. */
export async function isStarred(token, owner, repo) {
  try {
    const r = await fetch(`${API}/user/starred/${owner}/${repo}`, { headers: headers(token) })
    if (r.status === 204) return true
    if (r.status === 404) return false
    return null
  } catch {
    return null
  }
}

export async function setStarred(token, owner, repo, starred) {
  const r = await fetch(`${API}/user/starred/${owner}/${repo}`, {
    method: starred ? 'PUT' : 'DELETE',
    headers: { ...headers(token), 'Content-Length': '0' },
  })
  if (!r.ok && r.status !== 204) throw new Error('Could not change that. Try again.')
  return starred
}

/* ── Separate versions (branches) ──────────────────────────────────────────── */

export async function getBranches(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/branches?per_page=100`, { headers: headers(token) })
  if (r.status === 404 || r.status === 409) return []
  if (!r.ok) throw new Error('Could not load the versions of this project. Try refreshing.')
  const data = await r.json()
  return Array.isArray(data) ? data : []
}

/**
 * How far a separate version has moved from the main one.
 * `ahead_by` is work in it that main doesn't have; `behind_by` is the reverse.
 * Returns null when GitHub can't compare them — never guess a number.
 */
export async function compareBranches(token, owner, repo, base, head) {
  try {
    const r = await fetch(
      `${API}/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      { headers: headers(token) }
    )
    if (!r.ok) return null
    const d = await r.json()
    return { ahead: d.ahead_by, behind: d.behind_by, status: d.status }
  } catch {
    return null
  }
}

/** Start a separate version from a Save Point. */
export async function createBranch(token, owner, repo, name, fromSha) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${name}`, sha: fromSha }),
  })
  if (r.status === 422) throw new Error('A separate version with that name already exists.')
  if (r.status === 403) throw new Error("You don't have permission to add a version to this project.")
  if (!r.ok) throw new Error('Could not make that version. Try again.')
  return r.json()
}

/* ── Pull Requests (Yourkly Updates) ────────────────────────────────────────── */

/**
 * Create a pull request to propose changes.
 * Branch must already exist with the commits. This links it to main.
 */
export async function createPullRequest(token, owner, repo, branchName, title, body) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      body: body || '',
      head: branchName,
      base: 'main', // or detect default_branch
    }),
  })
  if (r.status === 422) throw new Error('A pull request with that branch already exists.')
  if (r.status === 403) throw new Error("You don't have permission to create a pull request.")
  if (!r.ok) throw new Error('Could not create the proposal. Try again.')
  return r.json()
}

/**
 * Merge a pull request.
 * pr_number is the PR number (not OID).
 */
export async function mergePullRequest(token, owner, repo, prNumber) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commit_title: 'Merge Yourkly update',
      merge_method: 'squash', // squash for a cleaner history
    }),
  })
  if (r.status === 405) throw new Error('This proposal is not ready to merge yet.')
  if (r.status === 409) throw new Error('This proposal has merge conflicts.')
  if (!r.ok) throw new Error('Could not merge the proposal. Try again.')
  return r.json()
}

/* ── Publishing (GitHub Pages) ─────────────────────────────────────────────── */

/** null means this project isn't published. */
export async function getPagesSite(token, owner, repo) {
  const r = await fetch(`${API}/repos/${owner}/${repo}/pages`, { headers: headers(token) })
  if (r.status === 404) return null
  if (!r.ok) throw new Error("Yourk couldn't check whether this project is published.")
  return r.json()
}

export async function publishPagesSite(token, owner, repo, branch, path = '/') {
  const r = await fetch(`${API}/repos/${owner}/${repo}/pages`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: { branch, path } }),
  })
  if (r.status === 409) throw new Error('This project is already published.')
  if (r.status === 403) throw new Error("You don't have permission to publish this project.")
  if (r.status === 422) {
    throw new Error('GitHub would not publish from that version and folder. Try the main version and the top folder.')
  }
  if (!r.ok) throw new Error('Could not publish this project. Try again.')
  return r.json()
}

/* ── Automatic checks (GitHub Actions) ─────────────────────────────────────── */

/**
 * What GitHub's automatic checks say about a version of the project.
 *
 * `{ total: 0 }` means no checks are set up — which is not the same as passing,
 * and the screen must not draw a tick for it.
 */
export async function getCheckRuns(token, owner, repo, ref) {
  try {
    const r = await fetch(`${API}/repos/${owner}/${repo}/commits/${ref}/check-runs`, {
      headers: headers(token),
    })
    if (!r.ok) return null
    const d = await r.json()
    return { total: d.total_count || 0, runs: d.check_runs || [] }
  } catch {
    return null
  }
}
