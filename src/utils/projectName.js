/**
 * projectName.js
 *
 * The name Yourkly shows for a project. GitHub repositories are lowercase and
 * hyphenated ("plainly-extension"); the design shows a readable project name
 * ("Yourkly Extension").
 *
 * Presentation only — the real repository name is never changed, and anywhere
 * the exact repo name matters (renaming, delete confirmation, URLs) keeps
 * using the raw value.
 */
export function projectName(repo) {
  if (!repo) return ''
  return String(repo)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}
