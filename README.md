# claude-mods

A couple of [Claude Code](https://claude.com/claude-code) mods: small plugins that hook into the agent loop to add a live status line, a sidebar pane, or both. Written up on [hereshecodes.com](https://hereshecodes.com).

## agent-watch

A tool-call risk monitor. It never blocks anything, it just watches `Bash`, `Write`, and `Edit` calls and flags the ones worth a second look: risky shell patterns (`sudo`, `rm -rf`, `curl | sh`, force pushes) and writes to sensitive paths (`.env`, `.ssh/`, `id_rsa`, credentials). A sidebar pane opens automatically and lists every flagged call as it happens; a live status line tallies total calls vs. flagged ones alongside it. Reopen the pane anytime with `/agent-watch` if you close it.

This is OWASP LLM08 (excessive agency) made visible: the point isn't to stop the agent, it's to make sure a human notices what it's doing.

```
/plugin install agent-watch --marketplace hereshecodes/claude-mods
```

## throttle

A motorcycle-themed activity gauge, just for fun. The status line revs up (idle → cruising → revving → full throttle) with how many tool calls happen in the current turn.

```
/plugin install throttle --marketplace hereshecodes/claude-mods
```

## Developing

Each mod is a plugin of function hooks: `<mod>/.claude-plugin/plugin.json` (manifest) and `<mod>/hooks/register.ts` (the hooks themselves). Validate and test with the Claude Code CLI:

```
claude plugin validate ./agent-watch
claude plugin test ./agent-watch
```
