/**
 * useProject.js — who owns the project you're looking at, and what it's called.
 *
 * The URL carries both: /p/:owner/:repo. It didn't always — it used to be
 * /p/:repo with the owner assumed to be you, which meant a project shared with
 * you or owned by a team could never open, because every GitHub call was built
 * against the wrong account.
 *
 * Every project screen reads the pair from here rather than from the signed-in
 * user, so there is one answer to "whose project is this".
 */

import { useParams } from 'react-router-dom'

export function useProject(auth) {
  const { owner, repo } = useParams()
  return {
    // The fallback matters only for a route that somehow lost its owner
    // segment; every real project route carries one.
    owner: owner || auth?.user?.login || null,
    repo,
  }
}

/** Where a project lives in Yourkly. Use this instead of writing the path out. */
export function projectPath(owner, repo, page = '') {
  const base = `/p/${owner}/${repo}`
  return page ? `${base}/${page}` : base
}

/**
 * Who owns a repository object from the GitHub API.
 *
 * The lists on Home, My Projects and Recent Activity link into projects that
 * may belong to someone else, so the owner has to come from the repository
 * rather than from whoever is signed in. `fallback` covers a stored record
 * written before the owner was tracked.
 */
export function ownerOf(repo, fallback) {
  return repo?.owner?.login || repo?.full_name?.split('/')[0] || fallback || null
}
