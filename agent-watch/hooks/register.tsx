import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { FlaggedEntry } from '../types'

const PANE = 'agent-watch'
const flaggedLog = atom({ plugin: 'agent-watch', key: 'flagged' } as const, [])

// Patterns that read as "this agent is about to do something hard to undo."
// Not a blocklist: agent-watch never denies a call, it just surfaces the
// moment so a human notices it (OWASP LLM08: excessive agency).
const RISKY_BASH: RegExp[] = [
  /(^|\s)sudo(\s|$)/,
  /\brm\s+-[a-z]*r[a-z]*f[a-z]*\b/i,
  /\brm\s+-[a-z]*f[a-z]*r[a-z]*\b/i,
  /curl[^\n|]*\|\s*(sh|bash)\b/,
  /wget[^\n|]*\|\s*(sh|bash)\b/,
  /chmod\s+777/,
  /git\s+push\s+--force(?!-with-lease)/,
  />\s*\/dev\/sd[a-z]\b/,
]

const PROTECTED_PATH = /(^|\/)(\.env(\.[^/]*)?$|\.ssh\/|id_rsa|credentials\.json|\.pem)$/

function riskyBashHit(command: string): boolean {
  return RISKY_BASH.some((pattern) => pattern.test(command))
}

let idCounter = 0
function nextFlagId(): string {
  idCounter += 1
  return `flag-${idCounter}`
}

export const register: Register = (on) => {
  let totalCalls = 0
  let flaggedCalls = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-watch',
      description: 'Show the agent-watch flagged-calls pane',
    })
    void $.ui.open({ id: PANE, title: 'agent-watch' })

    return next(e)
  })

  on('command.run', { command: 'agent-watch' }, async ($) => {
    await $.ui.open({ id: PANE, title: 'agent-watch' })
    return { text: 'agent-watch pane opened.' }
  })

  on('tool.call', ($, e, next) => {
    totalCalls += 1
    $.ui.status(`agent-watch: ${totalCalls} calls : ${flaggedCalls} flagged`)
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (riskyBashHit(e.command)) {
      flaggedCalls += 1
      const entry: FlaggedEntry = {
        id: nextFlagId(),
        summary: 'risky command',
        detail: e.command.slice(0, 80),
      }
      await update($, flaggedLog, (list) => [...list, entry].slice(-200))
      $.ui.status(`agent-watch: ${totalCalls} calls : ${flaggedCalls} flagged`)
    }
    return next(e)
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    if (PROTECTED_PATH.test(e.file_path)) {
      flaggedCalls += 1
      const entry: FlaggedEntry = {
        id: nextFlagId(),
        summary: 'write to a sensitive path',
        detail: e.file_path,
      }
      await update($, flaggedLog, (list) => [...list, entry].slice(-200))
      $.ui.status(`agent-watch: ${totalCalls} calls : ${flaggedCalls} flagged`)
    }
    return next(e)
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    if (PROTECTED_PATH.test(e.file_path)) {
      flaggedCalls += 1
      const entry: FlaggedEntry = {
        id: nextFlagId(),
        summary: 'edit to a sensitive path',
        detail: e.file_path,
      }
      await update($, flaggedLog, (list) => [...list, entry].slice(-200))
      $.ui.status(`agent-watch: ${totalCalls} calls : ${flaggedCalls} flagged`)
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, flaggedLog)
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 2)

    return (
      <Box flexDirection="column">
        {list.length === 0 && (
          <Text dimColor>No flags yet. Watching Bash, Write, and Edit calls.</Text>
        )}
        {list.slice(-room).map((entry) => (
          <Text key={entry.id}>
            {entry.summary}: {entry.detail}
          </Text>
        ))}
      </Box>
    )
  })
}
