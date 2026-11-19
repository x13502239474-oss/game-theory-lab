import type { Lesson, Stage } from '../types'
import { p1 } from './p1'
import { p2a } from './p2a'
import { p2b } from './p2b'
import { p3 } from './p3'
import { p4 } from './p4'
import { p5 } from './p5'
import { p6 } from './p6'
import { p7 } from './p7'
import { p8 } from './p8'

export const stages: Stage[] = [
  {
    id: 1,
    title: '博弈论基础',
    en: 'Foundations',
    chapters: '§1.1–1.4',
    blurb: '从「互动决策」讲起：博弈由什么组成、理性意味着什么、如何分类。先把共同语言建立起来。',
    question: '博弈论究竟在研究什么？',
  },
  {
    id: 2,
    title: '完全信息静态博弈',
    en: 'Simultaneous Games',
    chapters: '§2.1–2.5',
    blurb: '收益矩阵、占优策略、纳什均衡、三大经典模型与多重均衡。这是整套理论的语法。',
    question: '当所有人同时行动且彼此知情，结果会停在哪里？',
  },
  {
    id: 3,
    title: '混合策略与均衡分析',
    en: 'Mixed Strategies',
    chapters: '§3.1–3.4',
    blurb: '当纯策略不存在时，概率如何成为策略：期望收益、无差异条件与 2×2 的完整求解。',
    question: '随机化为什么也是一种理性策略？',
  },
  {
    id: 4,
    title: '完全信息动态博弈',
    en: 'Sequential Games',
    chapters: '§4.1–4.4',
    blurb: '博弈树、信息集、逆向归纳、承诺与可信威胁、子博弈完美。先行动是优势还是负担？',
    question: '当行动有先后，什么样的威胁才可信？',
  },
  {
    id: 5,
    title: '不完全信息博弈',
    en: 'Incomplete Information',
    chapters: '§5.1–5.4',
    blurb: '类型、信念、贝叶斯更新、信号传递与筛选，以及逆向选择与道德风险。',
    question: '当我看不见你的底牌，我该如何行动？',
  },
  {
    id: 6,
    title: '重复博弈',
    en: 'Repeated Games',
    chapters: '§6.1–6.3',
    blurb: '有限重复与无限重复、贴现因子、触发策略，以及合作究竟需要什么条件。',
    question: '如果明天还会见面，今天的背叛还划算吗？',
  },
  {
    id: 7,
    title: '其他重要理论',
    en: 'Frontiers',
    chapters: '§7.1–7.4',
    blurb: '零和与极大极小、演化博弈、机制设计与拍卖、委托代理。四块通往现实应用的桥。',
    question: '如何设计规则，让自利的人做出你想要的选择？',
  },
  {
    id: 8,
    title: '综合实战',
    en: 'Capstone',
    chapters: '§8.1',
    blurb: '用一套五步建模法，把现实问题变成矩阵、求解、解释，并写清模型的边界。',
    question: '拿到一个陌生场景，你能不能独立完成一次博弈分析？',
  },
]

export const lessons: Lesson[] = [...p1, ...p2a, ...p2b, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8].sort(
  (a, b) => a.order - b.order,
)

export const totalLessons = lessons.length
export const totalQuestions = lessons.reduce((n, l) => n + l.quiz.length, 0)
export const totalMinutes = lessons.reduce((n, l) => n + l.minutes, 0)

export const lessonById = new Map(lessons.map((l) => [l.id, l]))

export function getLesson(id?: string) {
  return id ? lessonById.get(id) : undefined
}

export function stageLessons(stage: number) {
  return lessons.filter((l) => l.stage === stage)
}

export function nextLesson(id: string) {
  const i = lessons.findIndex((l) => l.id === id)
  return i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : undefined
}

export function prevLesson(id: string) {
  const i = lessons.findIndex((l) => l.id === id)
  return i > 0 ? lessons[i - 1] : undefined
}

export function stageOf(stage: number) {
  return stages.find((s) => s.id === stage)
}

// 内容自检：编号唯一、顺序连续、每讲至少 5 题
const ids = new Set<string>()
for (const l of lessons) {
  if (ids.has(l.id)) throw new Error(`课程编号重复：${l.id}`)
  ids.add(l.id)
  if (l.quiz.length < 5) throw new Error(`课程 ${l.id} 的练习题少于 5 题`)
  if (l.cases.length < 2) throw new Error(`课程 ${l.id} 的案例少于 2 个`)
}
lessons.forEach((l, i) => {
  if (l.order !== i + 1) throw new Error(`课程顺序不连续：${l.id} 期望 ${i + 1}，实际 ${l.order}`)
})
