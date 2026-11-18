import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LESSON_MAP, STAGE_MAP, ALL_LESSONS, prevLessonId, nextLessonId } from '../data/curriculum';
import { useStore } from '../store/store';
import { Prose, inline } from '../lib/prose';
import QuizBlock from '../components/QuizBlock';
import { LAB_MAP } from '../labs';

export default function LessonPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const lesson = LESSON_MAP[id];
  const { state, markDone, unmarkDone, visitLesson, addSeconds, toggleLessonFav, setNote } = useStore();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setLocalNote] = useState('');
  const visited = useRef<string>('');

  useEffect(() => {
    if (!lesson) return;
    if (visited.current !== lesson.id) {
      visited.current = lesson.id;
      visitLesson(lesson.id);
      setLocalNote(state.notes[lesson.id] ?? '');
    }
  }, [lesson, visitLesson, state.notes]);

  // 学习计时：可见时每 15 秒记一次
  useEffect(() => {
    if (!lesson) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') addSeconds(lesson.id, 15);
    }, 15000);
    return () => window.clearInterval(t);
  }, [lesson, addSeconds]);

  if (!lesson) {
    return (
      <div className="page-wrap">
        <p className="text-[13px] text-muted">课程不存在。</p>
        <Link to="/courses" className="mt-3 inline-block text-[12.5px] text-copper">
          返回课程目录 →
        </Link>
      </div>
    );
  }

  const stage = STAGE_MAP[lesson.stage];
  const p = state.lessons[lesson.id];
  const prev = prevLessonId(lesson.id);
  const next = nextLessonId(lesson.id);
  const lab = lesson.lab ? LAB_MAP[lesson.lab] : null;
  const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);

  return (
    <div className="page-wrap">
      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="tap flex items-center gap-1.5 text-[11.5px] text-muted">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M8.5 3 4.5 7l4 4" />
          </svg>
          返回
        </button>
        <div className="flex items-center gap-3">
          <span className="num text-[10.5px] text-muted">
            {String(idx + 1).padStart(2, '0')} / {ALL_LESSONS.length}
          </span>
          <button
            onClick={() => toggleLessonFav(lesson.id)}
            className={`tap ${p?.fav ? 'text-copper' : 'text-line-2'}`}
            aria-label="收藏本课"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill={p?.fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3">
              <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6 4.2 13.6l.7-4.3-3.1-3 4.3-.6z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 标题 */}
      <header className="mt-4">
        <div className="flex items-center gap-2">
          <span className="num text-[11px] text-copper">L{String(lesson.no).padStart(2, '0')}</span>
          <span className="h-px w-6 bg-line-2" />
          <span className="text-[10px] tracking-[0.12em] text-muted">第 {stage.no} 阶段 · {stage.title}</span>
        </div>
        <h1 className="masthead mt-2.5 text-[26px] leading-[1.25] text-ink">{lesson.title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{lesson.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-muted">
          <span>{lesson.minutes} 分钟</span>
          <span>{lesson.quiz.length} 道练习</span>
          <span>{lesson.concepts.length} 个概念</span>
          {p?.done && <span className="text-[#3F6B4E]">已学完</span>}
          {p && p.seconds > 0 && <span>本课已学 {Math.round(p.seconds / 60)} 分钟</span>}
        </div>
        <div className="mt-4 rule" />
      </header>

      {/* 目标 */}
      <section className="mt-4 border border-line bg-[#FCFBF7] px-4 py-3.5">
        <div className="label-copper mb-2">学完你能</div>
        <ul className="space-y-1.5">
          {lesson.goals.map((g, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2">
              <span className="mt-[7px] h-px w-2.5 shrink-0 bg-copper" />
              <span>{inline(g, `goal-${i}`)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lesson.concepts.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* 正文 */}
      <article className="mt-6">
        <Prose text={lesson.content} />
      </article>

      {/* 关联实验 */}
      {lab && (
        <Link to={`/lab/${lab.id}`} className="mt-6 block border border-navy/15 bg-[#F6F5F0] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="label-copper">LAB · {lab.no}</div>
              <div className="mt-1 text-[13.5px] font-semibold text-ink">{lab.title}</div>
              <div className="mt-0.5 text-[11px] text-muted">{lab.one}</div>
            </div>
            <span className="text-[16px] text-copper">→</span>
          </div>
        </Link>
      )}

      {/* 练习 */}
      <section className="mt-7">
        <QuizBlock questions={lesson.quiz} />
      </section>

      {/* 笔记 */}
      <section className="mt-7">
        <button onClick={() => setNoteOpen((v) => !v)} className="flex w-full items-center justify-between border-y border-line py-3">
          <span className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold tracking-[0.14em] text-ink">学习笔记</span>
            <span className="text-[10.5px] text-muted">{note ? `${note.length} 字` : '记录你的理解'}</span>
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#6E7C93"
            strokeWidth="1.3"
            className={`transition-transform ${noteOpen ? 'rotate-180' : ''}`}
          >
            <path d="M2 4.5 6 8.5 10 4.5" />
          </svg>
        </button>
        {noteOpen && (
          <div className="fade py-3">
            <textarea
              value={note}
              onChange={(e) => {
                setLocalNote(e.target.value);
                setNote(lesson.id, e.target.value);
              }}
              rows={5}
              placeholder="这一课最反直觉的地方是什么？你能想到哪个现实例子？"
              className="w-full resize-y border border-line bg-panel px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-line-2 focus:border-slateblue"
            />
            <p className="mt-1 text-[10px] text-muted">自动保存在本机浏览器，刷新不会丢失。</p>
          </div>
        )}
      </section>

      {/* 来源 */}
      <div className="mt-4 border-l-2 border-line pl-3">
        <div className="label mb-1">知识来源与对应</div>
        <p className="text-[10.5px] leading-relaxed text-muted">{lesson.source}</p>
      </div>

      {/* 完成 */}
      <div className="mt-7">
        {p?.done ? (
          <div className="flex gap-2">
            <div className="flex flex-1 items-center justify-center gap-2 border border-[#4C7A5E]/40 bg-[#F1F6F2] py-3 text-[12.5px] text-[#33543F]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2.5 7.4 5.6 10.4 11.5 4" />
              </svg>
              本课已完成
            </div>
            <button onClick={() => unmarkDone(lesson.id)} className="btn btn-ghost btn-sm">
              撤销
            </button>
          </div>
        ) : (
          <button
            onClick={() => markDone(lesson.id)}
            className="w-full border border-navy bg-navy py-3 text-[13px] font-medium tracking-wide text-[#F6F4EE] transition-colors hover:bg-navy-2"
          >
            标记本课学完
          </button>
        )}
      </div>

      {/* 上下课 */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {prev ? (
          <Link to={`/lesson/${prev}`} className="border border-line px-3 py-2.5 transition-colors hover:bg-tint">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">上一课</div>
            <div className="mt-0.5 truncate text-[11.5px] text-ink">{LESSON_MAP[prev].title}</div>
          </Link>
        ) : (
          <div className="border border-line/60 px-3 py-2.5 opacity-40">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">上一课</div>
            <div className="mt-0.5 text-[11.5px] text-ink">已是第一课</div>
          </div>
        )}
        {next ? (
          <Link to={`/lesson/${next}`} className="border border-line px-3 py-2.5 text-right transition-colors hover:bg-tint">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">下一课</div>
            <div className="mt-0.5 truncate text-[11.5px] text-ink">{LESSON_MAP[next].title}</div>
          </Link>
        ) : (
          <Link to="/courses" className="border border-line px-3 py-2.5 text-right">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">全部完成</div>
            <div className="mt-0.5 text-[11.5px] text-ink">回到课程目录</div>
          </Link>
        )}
      </div>
    </div>
  );
}
