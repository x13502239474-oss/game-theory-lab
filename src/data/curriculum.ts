import type { Lesson, Stage } from './types';
import { CASES } from './cases';
import { stage1 } from './lessons/stage1';
import { stage2 } from './lessons/stage2';
import { stage3 } from './lessons/stage3';
import { stage4 } from './lessons/stage4';
import { stage5 } from './lessons/stage5';
import { stage6 } from './lessons/stage6';
import { stage7 } from './lessons/stage7';

export const STAGES: Stage[] = [
  {
    no: 1,
    title: '博弈论基础',
    en: 'FOUNDATIONS',
    summary: '把一团乱麻拆成参与者、策略与收益，学会读一张收益矩阵。',
    lessons: stage1,
  },
  {
    no: 2,
    title: '静态博弈',
    en: 'STATIC GAMES',
    summary: '同时出招的世界：囚徒困境、纳什均衡、混合策略与协调问题。',
    lessons: stage2,
    lab: 'pd',
  },
  {
    no: 3,
    title: '动态博弈',
    en: 'DYNAMIC GAMES',
    summary: '先后出招的世界：博弈树、逆向归纳、可信威胁与承诺。',
    lessons: stage3,
    lab: 'entry',
  },
  {
    no: 4,
    title: '重复博弈与合作',
    en: 'REPEATED GAMES',
    summary: '有明天就有合作：折现、惩罚、声誉与自发秩序。',
    lessons: stage4,
    lab: 'repeat',
  },
  {
    no: 5,
    title: '不完全信息博弈',
    en: 'INCOMPLETE INFORMATION',
    summary: '有人知道得更多：贝叶斯博弈、信号、甄别、逆向选择与道德风险。',
    lessons: stage5,
    lab: 'signal',
  },
  {
    no: 6,
    title: '博弈论的现实应用',
    en: 'APPLICATIONS',
    summary: '把工具带回现实：价格战、谈判、拍卖、威慑与制度设计。',
    lessons: stage6,
    lab: 'price',
  },
  {
    no: 7,
    title: '演化博弈与机制设计',
    en: 'EVOLUTION & DESIGN',
    summary: '往两头延伸：群体里的策略如何自己长出来，制度又该如何被反向设计。',
    lessons: stage7,
  },
];

export const ALL_LESSONS: Lesson[] = STAGES.flatMap((s) => s.lessons);

export const LESSON_MAP: Record<string, Lesson> = Object.fromEntries(
  ALL_LESSONS.map((l) => [l.id, l])
);

export const STAGE_MAP: Record<number, Stage> = Object.fromEntries(STAGES.map((s) => [s.no, s]));

export interface QuestionRef {
  id: string;
  lessonId: string;
  lessonNo: number;
  lessonTitle: string;
  stage: number;
  /** lesson=课程题；case=案例情景题 */
  kind: 'lesson' | 'case';
  /** 案例题所属案例 id（仅 kind==='case' 时有值） */
  caseId?: string;
}

const lessonRefs: [string, QuestionRef][] = ALL_LESSONS.flatMap((l) =>
  l.quiz.map((q) => [
    q.id,
    { id: q.id, lessonId: l.id, lessonNo: l.no, lessonTitle: l.title, stage: l.stage, kind: 'lesson' as const },
  ])
);

const caseRefs: [string, QuestionRef][] = CASES.flatMap((c) =>
  (c.quiz ?? []).map((q) => [
    q.id,
    {
      id: q.id,
      lessonId: c.id,
      lessonNo: 0,
      lessonTitle: c.title,
      stage: 0,
      kind: 'case' as const,
      caseId: c.id,
    },
  ])
);

export const QUESTION_MAP: Record<string, QuestionRef> = Object.fromEntries([...lessonRefs, ...caseRefs]);

export function getQuestion(qid: string) {
  const ref = QUESTION_MAP[qid];
  if (!ref) return null;
  if (ref.kind === 'case') {
    const c = CASES.find((x) => x.id === ref.caseId);
    const q = c?.quiz?.find((x) => x.id === qid);
    if (!q) return null;
    return { q, ref, lesson: null };
  }
  const lesson = LESSON_MAP[ref.lessonId];
  const q = lesson?.quiz.find((x) => x.id === qid);
  if (!q) return null;
  return { q, ref, lesson };
}

export const TOTAL_MINUTES = ALL_LESSONS.reduce((a, l) => a + l.minutes, 0);
export const TOTAL_QUESTIONS = ALL_LESSONS.reduce((a, l) => a + l.quiz.length, 0);

export function nextLessonId(id: string): string | null {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1].id : null;
}

export function prevLessonId(id: string): string | null {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i > 0 ? ALL_LESSONS[i - 1].id : null;
}
