/** 全站数据类型定义 —— 博弈论研究所 */

export type Stage = {
  id: number
  title: string
  en: string
  chapters: string
  blurb: string
  /** 本部分要回答的核心问题 */
  question: string
}

/** 收益矩阵单元格：a 为行参与者收益，b 为列参与者收益 */
export type MatrixCell = {
  a: number | string
  b?: number | string
  /** 行参与者的最优反应（a 加下划线） */
  brRow?: boolean
  /** 列参与者的最优反应（b 加下划线） */
  brCol?: boolean
  /** 高亮该格（均衡） */
  eq?: boolean
}

export type MatrixSpec = {
  rowPlayer: string
  colPlayer: string
  cols: string[]
  rows: { label: string; cells: MatrixCell[] }[]
  corner?: string
  caption?: string
  note?: string
  showBR?: boolean
}

export type TreeNode = {
  id: string
  /** 决策者下标（从 0 开始）；终端节点不填 */
  player?: number
  label?: string
  branches?: { label: string; to: TreeNode }[]
  /** 终端收益 [参与者1, 参与者2] */
  payoff?: [number, number]
}

export type TreeSpec = {
  players: string[]
  root: TreeNode
  caption?: string
  note?: string
  /** 标注逆向归纳的最优路径，如 ['进入', '容忍'] */
  solution?: string[]
}

export type Block =
  | { k: 'p'; t: string }
  | { k: 'sub'; t: string }
  | { k: 'list'; items: string[]; ordered?: boolean }
  | { k: 'formula'; tex: string; vars?: { s: string; m: string }[]; note?: string }
  | { k: 'table'; head: string[]; rows: string[][]; caption?: string }
  | { k: 'note'; title: string; t: string; tone?: 'copper' | 'navy' | 'warn' }
  | { k: 'matrix'; spec: MatrixSpec }
  | { k: 'steps'; title?: string; items: { label: string; text: string; tex?: string }[] }
  | { k: 'tree'; spec: TreeSpec }
  | { k: 'assumptions'; items: string[] }
  | { k: 'scope'; works: string[]; limits: string[] }
  | { k: 'quote'; t: string; source?: string }

export type QuizQuestion = {
  id: string
  type: 'single' | 'judge' | 'fill' | 'numeric'
  stem: string
  options?: string[]
  /** 选择题为选项字母；判断题为 '对'/'错'；填空为参考答案；数值题为数字字符串 */
  answer: string
  accepted?: string[]
  tol?: number
  explanation: string
  /** 解题步骤，答题后展示 */
  steps?: string
}

export type LessonCase = {
  title: string
  players?: string
  strategies?: string
  payoffs?: string
  kind?: string
  body: string
  /** 模型解释不了的部分，必填 */
  caveat?: string
  numbers?: { label: string; value: string }[]
}

export type Lesson = {
  id: string
  stage: number
  order: number
  title: string
  subtitle: string
  chapter: string
  minutes: number
  objectives: string[]
  hook: { title: string; paragraphs: string[] }
  concepts: { term: string; plain: string; detail: string }[]
  theory: Block[]
  derivation?: {
    title: string
    intro?: string
    formula?: string
    vars?: { s: string; m: string }[]
    steps: string[]
    note?: string
  }
  model?: {
    title: string
    intro: string
    matrix?: MatrixSpec
    tree?: TreeSpec
    steps: string[]
    conclusion: string
    /** 现实解释 */
    meaning?: string
  }
  lab?: 'matrix' | 'repeat' | 'bayes'
  cases: LessonCase[]
  mistakes: { wrong: string; right: string }[]
  structure: string[]
  summary: string[]
  quiz: QuizQuestion[]
  extend?: string
}

export type Attempt = {
  key: string
  lessonId: string
  qid: string
  stage: number
  stem: string
  type: QuizQuestion['type']
  chosen: string
  correct: boolean
  wrongCount: number
  firstAt: number
  lastAt: number
}

export type Favorite = { id: string; title: string; stage: number; at: number }
export type Note = { lessonId: string; text: string; at: number }

export type DailyTask = { id: string; label: string; kind: 'lesson' | 'quiz' | 'review'; done: boolean }

export type Persisted = {
  version: number
  completed: Record<string, number>
  quizPassed: Record<string, { score: number; total: number; at: number }>
  secondsByDay: Record<string, number>
  lastStudyDay: string
  streak: number
  bestStreak: number
  attempts: Record<string, Attempt>
  favorites: Favorite[]
  notes: Record<string, Note>
  taskDay: string
  tasks: DailyTask[]
  createdAt: number
}
