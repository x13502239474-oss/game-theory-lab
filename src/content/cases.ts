import { lessons } from './index'

/** 案例库由讲义内案例自动汇总，保证「讲义改了，案例库同步变」 */
export type CaseStudy = {
  id: string
  title: string
  stage: number
  lessonId: string
  lessonTitle: string
  kind?: string
  players?: string
  strategies?: string
  payoffs?: string
  body: string
  caveat?: string
  numbers?: { label: string; value: string }[]
}

export const cases: CaseStudy[] = lessons.flatMap((l) =>
  l.cases.map((c, i) => ({
    id: `${l.id}-c${i + 1}`,
    title: c.title,
    stage: l.stage,
    lessonId: l.id,
    lessonTitle: l.title,
    kind: c.kind,
    players: c.players,
    strategies: c.strategies,
    payoffs: c.payoffs,
    body: c.body,
    caveat: c.caveat,
    numbers: c.numbers,
  })),
)
