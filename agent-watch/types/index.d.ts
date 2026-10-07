export type FlaggedEntry = { id: string; summary: string; detail: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-watch': { flagged: FlaggedEntry[] }
  }
}
