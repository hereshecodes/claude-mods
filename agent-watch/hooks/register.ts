import type { Register } from 'claude-code'

// Patterns that read as "this agent is about to do something hard to undo."
// Not a blocklist — agent-watch never denies a call, it just surfaces the
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

export const register: Register = (on) => {
  let totalCalls = 0
  let flaggedCalls = 0

  on('tool.call', ($, e, next) => {
    totalCalls += 1
    $.ui.status(`agent-watch: ${totalCalls} calls · ${flaggedCalls} flagged`)
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    if (riskyBashHit(e.command)) {
      flaggedCalls += 1
      $.ui.toast(`agent-watch: risky command — ${e.command.slice(0, 60)}`)
      $.ui.status(`agent-watch: ${totalCalls} calls · ${flaggedCalls} flagged`)
    }
    return next(e)
  })

  on('tool.call', { tool: 'Write' }, ($, e, next) => {
    if (PROTECTED_PATH.test(e.file_path)) {
      flaggedCalls += 1
      $.ui.toast(`agent-watch: write to a sensitive path — ${e.file_path}`)
      $.ui.status(`agent-watch: ${totalCalls} calls · ${flaggedCalls} flagged`)
    }
    return next(e)
  })

  on('tool.call', { tool: 'Edit' }, ($, e, next) => {
    if (PROTECTED_PATH.test(e.file_path)) {
      flaggedCalls += 1
      $.ui.toast(`agent-watch: edit to a sensitive path — ${e.file_path}`)
      $.ui.status(`agent-watch: ${totalCalls} calls · ${flaggedCalls} flagged`)
    }
    return next(e)
  })
}
