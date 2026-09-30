/**
 * commitText.js — turning a commit message into something a person can read.
 *
 * A commit message is written for git: a subject line, then as many paragraphs
 * as the author felt like, then machine-readable trailers. Printing all of it
 * as the summary is how What Changed became a wall of text.
 *
 * Every screen that shows a Save Point uses this, so the same commit reads the
 * same way everywhere:
 *
 *   title    the first line, in Yourkly's words
 *   summary  ONE line — the first paragraph, cut at a word boundary
 *   body     everything else, for behind "See details". Nothing is discarded,
 *            it just stops being the first thing you see.
 */

import { formatCommitLabel } from './time'

/** Trailers: the `Key: value` block git conventionally puts last.
 *  Co-Authored-By, Signed-off-by, Reviewed-by, Claude-Session… all metadata,
 *  none of it meaningful to someone who has never used GitHub. */
const TRAILER = /^[A-Za-z][A-Za-z0-9-]*:\s/

const SUMMARY_MAX = 160

/** Drop the trailing run of trailer lines. Only the trailing run: a line like
 *  "Note: this also fixes X" mid-paragraph is prose and stays. */
function stripTrailers(lines) {
  let end = lines.length
  while (end > 0) {
    const line = lines[end - 1].trim()
    if (line === '' || TRAILER.test(line)) end--
    else break
  }
  return lines.slice(0, end)
}

/** One line, no runs of whitespace, cut at a word boundary if it's long. */
function oneLine(text) {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= SUMMARY_MAX) return flat
  const cut = flat.slice(0, SUMMARY_MAX)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > SUMMARY_MAX * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

/**
 * @param {string} message a raw commit message
 * @returns {{ title: string, summary: string, body: string }}
 *          summary and body are '' when there is nothing to show — callers
 *          should not render an empty element for them.
 */
export function splitCommitMessage(message) {
  const raw = (message || '').replace(/\r\n/g, '\n')
  const [firstLine = '', ...rest] = raw.split('\n')
  const title = formatCommitLabel(firstLine.trim())

  const kept = stripTrailers(rest)
  // Paragraphs, in order, with the blank line that separated them gone.
  const paragraphs = kept
    .join('\n')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)

  return {
    title,
    summary: paragraphs.length ? oneLine(paragraphs[0]) : '',
    body: paragraphs.join('\n\n'),
  }
}

/**
 * "You" for your own Save Points, the GitHub login for anyone else's. Yourkly
 * says "You" everywhere else; a project owner reading their own name in a list
 * of their own work is jarring.
 */
export function commitAuthor(commit, viewerLogin) {
  const login = commit.author?.login
  if (login && viewerLogin && login.toLowerCase() === viewerLogin.toLowerCase()) return 'You'
  return login || commit.commit?.author?.name || 'Someone'
}
