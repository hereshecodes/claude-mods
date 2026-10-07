import type { Register } from 'claude-code'

const STAGES: { max: number; label: string }[] = [
  { max: 2, label: '🏍️ idle' },
  { max: 6, label: '🏍️💨 cruising' },
  { max: 12, label: '🏍️🔥 revving' },
  { max: Infinity, label: '🏍️🔥💨 full throttle' },
]

function stageFor(calls: number): string {
  return STAGES.find((s) => calls <= s.max)!.label
}

export const register: Register = (on) => {
  let callsThisTurn = 0
  let hitFullThrottle = false

  on('prompt.submit', ($, e, next) => {
    callsThisTurn = 0
    hitFullThrottle = false
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    callsThisTurn += 1
    $.ui.status(`throttle: ${stageFor(callsThisTurn)} (${callsThisTurn})`)
    if (callsThisTurn === 13) {
      hitFullThrottle = true
    }
    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (hitFullThrottle) {
      $.ui.toast(`🏍️ full throttle: ${callsThisTurn} tool calls this turn. Hope you're wearing a (coding) helmet.`)
    }
    $.ui.status(undefined)
    return next(e)
  })
}
