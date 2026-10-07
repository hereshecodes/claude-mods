import { test, expect } from 'claude-code/testing'

test('status line revs up as calls happen', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  await $.tool.call({ tool: 'Read', file_path: '/repo/a.md' })
  expect(statuses.at(-1)).toContain('idle')

  await $.tool.call({ tool: 'Read', file_path: '/repo/b.md' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/c.md' })
  expect(statuses.at(-1)).toContain('cruising')
})

test('reaches full throttle past 12 calls in a turn', async ($, on) => {
  const statuses: (string | undefined)[] = []
  on('ui.status', ($, e, next) => {
    statuses.push(e.text)
    return next(e)
  })
  on('tool.call', () => ({ deny: 'test stub' }))

  for (let i = 0; i < 13; i++) {
    await $.tool.call({ tool: 'Read', file_path: `/repo/f${i}.md` })
  }

  expect(statuses.at(-1)).toContain('full throttle')
})
