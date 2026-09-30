/**
 * handoff.js
 *
 * Builds the text Yourkly hands to an AI, in exactly the shape HANDOFF §7.7
 * specifies. Sections the user unticked are left out — that is the whole point
 * of the checklist, and a toggle that changes nothing is worse than no toggle.
 *
 * Everything here comes from real data. Where a value isn't available, the
 * line says so rather than guessing.
 */

import { STATUS_LABEL } from './updateMemory'

/** The eight context items, in the order the design lists them. */
export const CONTEXT_ITEMS = [
  { id: 'overview', label: 'What this project is', detail: 'Your project description and README', locked: true },
  { id: 'goal',     label: 'What you asked for',   detail: 'The goal of this update, in your words', locked: true },
  { id: 'left',     label: 'Where you left off',   detail: 'Last file, last Save Point, last AI', locked: true },
  { id: 'rules',    label: 'Your project instructions', detail: 'DESIGN.md and AGENTS.md', locked: false },
  { id: 'files',    label: 'files you picked',     detail: "the update's file list", locked: false },
  { id: 'recent',   label: 'Recent changes',       detail: 'Your last 3 Save Points and what they changed', locked: false },
  { id: 'limits',   label: 'What not to touch',    detail: 'Do not change anything outside this update', locked: false },
  { id: 'report',   label: 'How to report back',   detail: 'List the files changed, in plain English', locked: false },
]

/** "src/ (App.jsx, index.css, pages/)" — the flat listing the design asks for. */
export function describeTree(entries) {
  if (!entries || entries.length === 0) return '(Yourkly could not read the file list.)'
  return entries
    .map(e => {
      if (e.type !== 'dir') return e.name
      const children = (e.children || []).map(c => c.name + (c.type === 'dir' ? '/' : ''))
      return children.length ? `${e.name}/ (${children.join(', ')})` : `${e.name}/`
    })
    .join(', ')
}

/**
 * @param {object}   p
 * @param {Set}      p.checked        ids from CONTEXT_ITEMS that are switched on
 * @param {string}   p.owner
 * @param {string}   p.repo           the real repository name
 * @param {string}   p.projectLabel   the display name
 * @param {string}   p.description    repo description, or null
 * @param {object}   p.update         the update record
 * @param {string}   p.lastFile       last file opened, or null
 * @param {string}   p.branch         default branch name, or null
 * @param {string}   p.lastSaveLabel  last Save Point title, or null
 * @param {Array}    p.tree           top-level entries, dirs may carry .children
 * @param {Array}    p.savePoints     recent commit messages, newest first
 * @param {string}   p.instructions   DESIGN.md contents, or null
 */
export function buildHandoff({
  checked, owner, repo, projectLabel, description, update,
  lastFile, branch, lastSaveLabel, tree, savePoints, instructions,
}) {
  const on = id => checked.has(id)
  const parts = [
    `PROJECT: ${projectLabel} (GitHub: ${owner}/${repo})`,
    `WHAT IT IS: ${description || '(no description yet)'}`,
    '',
    `THE UPDATE I AM WORKING ON: ${update.title}`,
    'WHAT I WANT YOU TO DO:',
    update.goal || update.title,
    '',
  ]

  if (on('left')) {
    parts.push(
      'WHERE I LEFT OFF:',
      `- Status of this update: ${STATUS_LABEL[update.status] || update.status}`,
      `- Last worked on with: ${update.ai || 'nobody yet'}`,
      `- Last file open: ${lastFile || '(none recorded)'}`,
      `- Current version: ${branch || 'main'}${lastSaveLabel ? `, ${lastSaveLabel}` : ''}`,
      '',
    )
  }

  if (on('rules')) {
    parts.push('PROJECT INSTRUCTIONS (from DESIGN.md):')
    parts.push(instructions ? instructions.trim() : '(This project has no DESIGN.md.)')
    parts.push('', 'AGENTS.md also applies — follow it for anything about how you work.', '')
  }

  if (on('files')) {
    parts.push(
      'FILES FOR THIS UPDATE:',
      (update.files && update.files.length)
        ? update.files.join(', ')
        : '(none picked yet — find them yourself and tell me which ones you used)',
      '',
      'EVERYTHING IN THIS PROJECT:',
      describeTree(tree),
      '',
    )
  }

  if (on('recent')) {
    parts.push('RECENT SAVE POINTS:')
    if (savePoints && savePoints.length) {
      savePoints.slice(0, 3).forEach((s, i) => parts.push(`${i + 1}. ${s}`))
    } else {
      parts.push('(No Save Points yet.)')
    }
    parts.push('')
  }

  if (on('limits')) {
    parts.push(
      'WHAT NOT TO TOUCH:',
      '- Do not change anything outside this update.',
      '- Do not save or push anything to GitHub — I will do that in Yourkly.',
      '',
    )
  }

  if (on('report')) {
    parts.push(
      'HOW TO REPORT BACK:',
      '- List every file you changed and say what you changed, in plain English.',
      '- Tell me anything you had to change that I did not ask about, and why.',
    )
  }

  return parts.join('\n').trim()
}
