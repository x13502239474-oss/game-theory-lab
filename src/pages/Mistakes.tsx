import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { getQuestion, LESSON_MAP, STAGES } from '../data/curriculum';
import QuizBlock from '../components/QuizBlock';
import { Empty } from '../components/ui';
import { inline } from '../lib/prose';
import { fmtShortDate } from '../lib/date';
import type { Question } from '../data/types';

type Tab = 'wrong' | 'fav' | 'mastered';

export default function Mistakes() {
  const { state, toggleMastered, toggleFav } = useStore();
  const [tab, setTab] = useState<Tab>('wrong');
  const [stage, setStage] = useState<number | 0>(0);
  const [openQ, setOpenQ] = useState<string | null>(null);

  const items = useMemo(() => {
    return Object.entries(state.quiz)
      .map(([qid, rec]) => {
        const found = getQuestion(qid);
        if (!found) return null;
        return { rec, ...found };
      })
      .filter(Boolean)
      .filter((x) => {
        if (!x) return false;
        if (stage && x.ref.stage !== stage) return false;
        if (tab === 'wrong') return x.rec.wrong > 0 && !(x.rec.solved && x.rec.mastered);
        if (tab === 'fav') return !!x.rec.fav;
        return !!x.rec.mastered && x.rec.wrong > 0;
      })
      .sort((a, b) => (b?.rec.lastAt ?? 0) - (a?.rec.lastAt ?? 0)) as {
      rec: (typeof state.quiz)[string];
      q: Question;
      ref: { lessonId: string; lessonNo: number; lessonTitle: string; stage: number; kind: 'lesson' | 'case'; caseId?: string };
      lesson: (typeof LESSON_MAP)[string] | null;
    }[];
  }, [state.quiz, tab, stage]);

  const wrongByLesson = useMemo(() => {
    const m: Record<string, number> = {};
    Object.entries(state.quiz).forEach(([qid, rec]) => {
      const f = getQuestion(qid);
      if (f && f.ref.kind === 'lesson' && rec.wrong > 0 && !(rec.solved && rec.mastered)) {
        m[f.ref.lessonId] = (m[f.ref.lessonId] ?? 0) + 1;
      }
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [state.quiz]);

  const counts = {
    wrong: Object.entries(state.quiz).filter(([q, r]) => {
      const f = getQuestion(q);
      return f && r.wrong > 0 && !(r.solved && r.mastered);
    }).length,
    fav: Object.values(state.quiz).filter((r) => r.fav).length,
    mastered: Object.entries(state.quiz).filter(([q, r]) => {
      const f = getQuestion(q);
      return f && r.mastered && r.wrong > 0;
    }).length,
  };

  return (
    <div className="page-wrap">
      <header>
        <div className="label-copper mb-1">REVIEW</div>
        <div className="flex items-end justify-between">
          <h1 className="masthead text-[24px] leading-tight text-ink">错题本</h1>
          <span className="num text-[12px] text-muted">{counts.wrong} 题待复习</span>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          答错自动收录。重做答对后可标记掌握，题目会移出待复习列表。
        </p>
        <div className="mt-4 rule" />
      </header>

      {wrongByLesson.length > 0 && (
        <section className="mt-4 border border-copper/30 bg-[#FAF6EE] p-3.5">
          <div className="label-copper mb-2">建议复习</div>
          <div className="space-y-1.5">
            {wrongByLesson.slice(0, 3).map(([lid, n]) => {
              const l = LESSON_MAP[lid];
              if (!l) return null;
              return (
                <Link key={lid} to={`/lesson/${lid}`} className="flex items-center justify-between text-[12px] text-ink">
                  <span>
                    L{String(l.no).padStart(2, '0')} · {l.title}
                  </span>
                  <span className="text-[10.5px] text-copper">错 {n} 题 · 重看 →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-4 flex gap-2">
        {(
          [
            ['wrong', `待复习 ${counts.wrong}`],
            ['fav', `收藏 ${counts.fav}`],
            ['mastered', `已掌握 ${counts.mastered}`],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip flex-1 justify-center py-2 ${tab === k ? 'chip-on' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setStage(0)} className={`chip shrink-0 ${stage === 0 ? 'chip-on' : ''}`}>
          全部阶段
        </button>
        {STAGES.map((s) => (
          <button key={s.no} onClick={() => setStage(s.no)} className={`chip shrink-0 ${stage === s.no ? 'chip-on' : ''}`}>
            {s.title}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <Empty
            text={
              tab === 'wrong'
                ? '还没有待复习的错题。做完课程练习，答错的题会自动出现在这里。'
                : tab === 'fav'
                  ? '还没有收藏的题目。在课程练习里点右上角的星标即可收藏。'
                  : '还没有标记为已掌握的错题。'
            }
            action={
              <Link to="/courses" className="btn btn-ghost btn-sm">
                去做练习
              </Link>
            }
          />
        ) : (
          items.map(({ rec, q, ref }) => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-2.5">
                <div className="min-w-0">
                  {ref.kind === 'case' ? (
                    <Link to={`/cases/${ref.caseId}`} className="text-[10.5px] text-copper">
                      案例 · {ref.lessonTitle}
                    </Link>
                  ) : (
                    <Link to={`/lesson/${ref.lessonId}`} className="text-[10.5px] text-copper">
                      L{String(ref.lessonNo).padStart(2, '0')} · {ref.lessonTitle}
                    </Link>
                  )}
                  <div className="mt-1 flex items-center gap-2.5 text-[10px] text-muted">
                    <span>错 {rec.wrong} 次</span>
                    <span>上次 {fmtShortDate(rec.lastAt)}</span>
                    <span>{rec.attempts} 次作答</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggleFav(q.id)}
                    className={rec.fav ? 'text-copper' : 'text-line-2'}
                    aria-label="收藏"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill={rec.fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3">
                      <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6 4.2 13.6l.7-4.3-3.1-3 4.3-.6z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-4 py-3">
                <p className="text-[13.5px] leading-[1.75] text-ink">{inline(q.stem, `m-${q.id}`)}</p>

                <div className="mt-2.5 flex items-center gap-2 text-[11.5px]">
                  <span className="text-muted">正确答案</span>
                  <span className="border border-[#4C7A5E]/40 bg-[#F1F6F2] px-2 py-0.5 text-[#33543F]">
                    {q.qtype === 'judge'
                      ? q.answer
                        ? '正确'
                        : '错误'
                      : q.qtype === 'scenario'
                        ? '要点见解析'
                        : Array.isArray(q.answer)
                          ? q.answer.join('')
                          : q.answer}
                  </span>
                </div>

                <div className="mt-2.5 border-l-2 border-line bg-[#FCFBF7] px-3 py-2">
                  <div className="label mb-1">解析</div>
                  <p className="text-[12px] leading-[1.8] text-ink-2">{q.explanation}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setOpenQ(openQ === q.id ? null : q.id)} className="btn btn-ghost btn-sm">
                    {openQ === q.id ? '收起重做' : '重新练习'}
                  </button>
                  <button onClick={() => toggleMastered(q.id)} className={`btn btn-sm ${rec.mastered ? 'btn-copper' : 'btn-ghost'}`}>
                    {rec.mastered ? '已掌握' : '标记已掌握'}
                  </button>
                </div>

                {openQ === q.id && (
                  <div className="fade mt-3 border-t border-line pt-3">
                    <QuizBlock questions={[q]} title="重做" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
