import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_LESSONS } from '../data/curriculum';

export const STORAGE_KEY = 'gtl.state.v1';
export const STATE_VERSION = 1;

export interface LessonProgress {
  done: boolean;
  doneAt?: number;
  visits: number;
  seconds: number;
  lastAt?: number;
  fav?: boolean;
}

export interface QuizRecord {
  attempts: number;
  wrong: number;
  lastAnswer: string;
  lastAt: number;
  solved: boolean;
  fav?: boolean;
  mastered?: boolean;
}

export interface DailyRecord {
  predicted?: number;
  revealed?: boolean;
}

export interface State {
  version: number;
  createdAt: string;
  lessons: Record<string, LessonProgress>;
  quiz: Record<string, QuizRecord>;
  notes: Record<string, string>;
  daily: Record<string, DailyRecord>;
  /** 日期 -> 学习秒数 */
  days: Record<string, number>;
  meta: { name: string };
}

function initialState(): State {
  return {
    version: STATE_VERSION,
    createdAt: new Date().toISOString(),
    lessons: {},
    quiz: {},
    notes: {},
    daily: {},
    days: {},
    meta: { name: '' },
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as State;
    if (!parsed || typeof parsed !== 'object') return initialState();
    return {
      ...initialState(),
      ...parsed,
      lessons: parsed.lessons ?? {},
      quiz: parsed.quiz ?? {},
      notes: parsed.notes ?? {},
      daily: parsed.daily ?? {},
      days: parsed.days ?? {},
      meta: { name: parsed.meta?.name ?? '' },
    };
  } catch {
    return initialState();
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayKeyOffset(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return todayKey(d);
}

function emptyLesson(): LessonProgress {
  return { done: false, visits: 0, seconds: 0 };
}

interface StoreApi {
  state: State;
  markDone: (lessonId: string) => void;
  unmarkDone: (lessonId: string) => void;
  visitLesson: (lessonId: string) => void;
  addSeconds: (lessonId: string, sec: number) => void;
  recordAnswer: (qid: string, ok: boolean, answerText: string) => void;
  toggleFav: (qid: string) => void;
  toggleMastered: (qid: string) => void;
  toggleLessonFav: (lessonId: string) => void;
  setNote: (lessonId: string, text: string) => void;
  setDaily: (day: string, rec: DailyRecord) => void;
  setName: (name: string) => void;
  resetAll: () => void;
  importState: (json: string) => boolean;
  exportState: () => string;
  stats: {
    doneCount: number;
    totalCount: number;
    doneMinutes: number;
    totalSeconds: number;
    streak: number;
    bestStreak: number;
    todaySeconds: number;
    weekSeconds: number;
    wrongCount: number;
    answeredCount: number;
  };
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => load());
  const timer = useRef<number | null>(null);

  // 持久化（节流 400ms）
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* 存储配额或隐私模式，忽略 */
      }
    }, 400);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [state]);

  // 页面隐藏时立即落盘，避免丢失
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => setState((prev) => fn(structuredClone(prev))), []);

  const markDone = useCallback(
    (lessonId: string) =>
      update((s) => {
        const cur = s.lessons[lessonId] ?? emptyLesson();
        s.lessons[lessonId] = { ...cur, done: true, doneAt: cur.doneAt ?? Date.now(), lastAt: Date.now() };
        return s;
      }),
    [update]
  );

  const unmarkDone = useCallback(
    (lessonId: string) =>
      update((s) => {
        const cur = s.lessons[lessonId] ?? emptyLesson();
        s.lessons[lessonId] = { ...cur, done: false, doneAt: undefined };
        return s;
      }),
    [update]
  );

  const visitLesson = useCallback(
    (lessonId: string) =>
      update((s) => {
        const cur = s.lessons[lessonId] ?? emptyLesson();
        s.lessons[lessonId] = { ...cur, visits: cur.visits + 1, lastAt: Date.now() };
        return s;
      }),
    [update]
  );

  const addSeconds = useCallback(
    (lessonId: string, sec: number) =>
      update((s) => {
        if (sec <= 0) return s;
        const cur = s.lessons[lessonId] ?? emptyLesson();
        s.lessons[lessonId] = { ...cur, seconds: cur.seconds + sec, lastAt: Date.now() };
        const k = todayKey();
        s.days[k] = (s.days[k] ?? 0) + sec;
        return s;
      }),
    [update]
  );

  const recordAnswer = useCallback(
    (qid: string, ok: boolean, answerText: string) =>
      update((s) => {
        const cur = s.quiz[qid];
        s.quiz[qid] = {
          attempts: (cur?.attempts ?? 0) + 1,
          wrong: (cur?.wrong ?? 0) + (ok ? 0 : 1),
          lastAnswer: answerText,
          lastAt: Date.now(),
          solved: ok,
          fav: cur?.fav,
          mastered: ok ? true : cur?.mastered,
        };
        return s;
      }),
    [update]
  );

  const toggleFav = useCallback(
    (qid: string) =>
      update((s) => {
        const cur = s.quiz[qid];
        if (!cur) {
          s.quiz[qid] = { attempts: 0, wrong: 0, lastAnswer: '', lastAt: Date.now(), solved: false, fav: true };
        } else {
          s.quiz[qid] = { ...cur, fav: !cur.fav };
        }
        return s;
      }),
    [update]
  );

  const toggleMastered = useCallback(
    (qid: string) =>
      update((s) => {
        const cur = s.quiz[qid];
        if (!cur) return s;
        s.quiz[qid] = { ...cur, mastered: !cur.mastered };
        return s;
      }),
    [update]
  );

  const toggleLessonFav = useCallback(
    (lessonId: string) =>
      update((s) => {
        const cur = s.lessons[lessonId] ?? emptyLesson();
        s.lessons[lessonId] = { ...cur, fav: !cur.fav };
        return s;
      }),
    [update]
  );

  const setNote = useCallback(
    (lessonId: string, text: string) =>
      update((s) => {
        s.notes[lessonId] = text;
        return s;
      }),
    [update]
  );

  const setDaily = useCallback(
    (day: string, rec: DailyRecord) =>
      update((s) => {
        s.daily[day] = { ...(s.daily[day] ?? {}), ...rec };
        return s;
      }),
    [update]
  );

  const setName = useCallback(
    (name: string) =>
      update((s) => {
        s.meta.name = name;
        return s;
      }),
    [update]
  );

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState());
  }, []);

  const exportState = useCallback(() => JSON.stringify({ app: 'game-theory-lab', exportedAt: Date.now(), data: state }, null, 2), [state]);

  const importState = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      const data = parsed?.data ?? parsed;
      if (!data || typeof data !== 'object' || !data.lessons) return false;
      const raw: State = {
        ...initialState(),
        ...data,
        version: STATE_VERSION,
      };
      setState(raw);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stats = useMemo(() => {
    const totalCount = ALL_LESSONS.length;
    const doneCount = Object.values(state.lessons).filter((l) => l.done).length;
    let totalSeconds = 0;
    Object.values(state.lessons).forEach((l) => (totalSeconds += l.seconds || 0));
    const doneMinutes = Math.round(totalSeconds / 60);

    // 连续学习：从今天（或昨天）往前数，每天 >= 60 秒
    const has = (k: string) => (state.days[k] ?? 0) >= 60;
    let streak = 0;
    let start = 0;
    if (!has(todayKey()) && has(dayKeyOffset(-1))) start = -1;
    for (let i = start; i > -400; i--) {
      if (has(dayKeyOffset(i))) streak++;
      else break;
    }
    // 历史最长
    const keys = Object.keys(state.days).filter((k) => (state.days[k] ?? 0) >= 60).sort();
    let best = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of keys) {
      const d = new Date(k + 'T00:00:00');
      if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) run += 1;
      else run = 1;
      best = Math.max(best, run);
      prev = d;
    }
    let weekSeconds = 0;
    for (let i = 0; i < 7; i++) weekSeconds += state.days[dayKeyOffset(-i)] ?? 0;

    const recs = Object.values(state.quiz);
    return {
      doneCount,
      totalCount,
      doneMinutes,
      totalSeconds,
      streak,
      bestStreak: Math.max(best, streak),
      todaySeconds: state.days[todayKey()] ?? 0,
      weekSeconds,
      wrongCount: recs.filter((r) => r.wrong > 0 && !r.solved).length,
      answeredCount: recs.filter((r) => r.attempts > 0).length,
    };
  }, [state]);

  const api: StoreApi = {
    state,
    markDone,
    unmarkDone,
    visitLesson,
    addSeconds,
    recordAnswer,
    toggleFav,
    toggleMastered,
    toggleLessonFav,
    setNote,
    setDaily,
    setName,
    resetAll,
    exportState,
    importState,
    stats,
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

/** 综合判断某课状态 */
export function lessonStatus(l: LessonProgress | undefined): 'new' | 'done' | 'reading' {
  if (l?.done) return 'done';
  if ((l?.visits ?? 0) > 0) return 'reading';
  return 'new';
}
