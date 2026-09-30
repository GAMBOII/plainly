/**
 * projectPicker.js — which projects appear in Yourkly.
 *
 * Yourkly now asks GitHub for everything the account can reach: your own
 * projects, ones shared with you, and every repository in every organisation
 * you belong to. For some accounts that is four projects. For others it is
 * several hundred, most of which you will never touch.
 *
 * So you can choose. Two rules, both about not lying:
 *
 *   1. Choosing nothing shows everything. A first-time user must never open
 *      Yourkly to an empty list because of a setting they didn't set.
 *   2. When a choice is active, the screen says how many are hidden. A
 *      filtered list presented as the whole list is a false statement.
 *
 * Hiding affects the lists only. A direct link to a hidden project still
 * opens — this is about what you scroll past, not about access.
 */

const key = login => `plainly_projects_${login}`

/** Full names ("owner/repo") the user picked, or [] when they haven't picked. */
export function getChosen(login) {
  if (!login) return []
  try {
    const raw = localStorage.getItem(key(login))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function setChosen(login, fullNames) {
  if (!login) return
  try {
    localStorage.setItem(key(login), JSON.stringify([...new Set(fullNames)]))
  } catch { /* the choice just won't persist */ }
}

/** "owner/repo" for a repository object, however GitHub returned it. */
export function fullName(repo, fallbackOwner) {
  if (repo?.full_name) return repo.full_name
  const owner = repo?.owner?.login || fallbackOwner
  return owner ? `${owner}/${repo?.name}` : repo?.name || ''
}

/**
 * The projects to show. An empty choice means all of them — see rule 1.
 * A choice that matches nothing in the list also means all of them, so a
 * stale entry (a project since renamed or removed) can't empty the screen.
 */
export function visibleProjects(login, repos = []) {
  const chosen = getChosen(login)
  if (chosen.length === 0) return repos
  const set = new Set(chosen)
  const kept = repos.filter(r => set.has(fullName(r, login)))
  return kept.length ? kept : repos
}

/** True when a choice is actually hiding something right now. */
export function isFiltering(login, repos = []) {
  return visibleProjects(login, repos).length < repos.length
}
