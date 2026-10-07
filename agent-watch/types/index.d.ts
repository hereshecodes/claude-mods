export type FlaggedEntry = { id: string; kind: 'command' | 'path'; summary: string; detail: string }

declare module 'claude-code' {
  interface PluginState {
    'agent-watch': { flagged: FlaggedEntry[] }
  }
}
