import { test, expect } from 'claude-code/testing'

test('flags a risky bash command', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  await $.tool.call({ tool: 'Bash', command: 'sudo rm -rf /tmp/whatever' })

  expect(statuses.at(-1)).toContain('1 flagged')
})

test('stays quiet for an ordinary bash command', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  await $.tool.call({ tool: 'Bash', command: 'ls -la' })

  expect(statuses.at(-1)).toContain('0 flagged')
})

test('flags a write to a protected path', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  await $.tool.call({ tool: 'Write', file_path: '/repo/.env', content: 'SECRET=1' })

  expect(statuses.at(-1)).toContain('1 flagged')
})

test('status line counts every call', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  await $.tool.call({ tool: 'Read', file_path: '/repo/README.md' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/package.json' })

  expect(statuses.at(-1)).toContain('2 calls')
})
