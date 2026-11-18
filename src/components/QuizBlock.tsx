import { useState } from 'react';
import type { Question } from '../data/types';
import { useStore } from '../store/store';

function norm(s: string) {
  return s
    .replace(/[\s，。、；：""''（）()【】《》,.;:!?！？"'\-—_/\\]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase();
}

export function grade(q: Question, ans: string | string[] | boolean | null): { ok: boolean; ratio?: number } {
  if (ans === null || ans === undefined) return { ok: false };
  if (q.qtype === 'single') {
    return { ok: String(ans).trim().toUpperCase() === String(q.answer).trim().toUpperCase() };
  }
  if (q.qtype === 'multi') {
    const a = (Array.isArray(ans) ? ans : []).map((x) => x.toUpperCase()).sort();
    const b = (Array.isArray(q.answer) ? (q.answer as string[]) : []).map((x) => x.toUpperCase()).sort();
    return { ok: a.length === b.length && a.every((v, i) => v === b[i]) };
  }
  if (q.qtype === 'judge') {
    return { ok: Boolean(ans) === Boolean(q.answer) };
  }
  // 情景题：命中要点组比例 >= 70%
  const text = norm(String(ans ?? ''));
  const groups = q.keywords ?? [];
  if (!groups.length) return { ok: text.length > 10 };
  let hit = 0;
  groups.forEach((g) => {
    if (g.some((k) => text.includes(norm(k)))) hit += 1;
  });
  const ratio = hit / groups.length;
  return { ok: ratio >= 0.7 - 1e-9, ratio };
}

const TYPE_LABEL: Record<string, string> = {
  single: '单选',
  multi: '多选',
  judge: '判断',
  scenario: '情景分析',
};

export function answerToText(q: Question, ans: string | string[] | boolean | null): string {
  if (ans === null) return '';
  if (q.qtype === 'judge') return ans ? '正确' : '错误';
  if (Array.isArray(ans)) return ans.join('');
  return String(ans);
}

export default function QuizBlock({ questions, title = '章节测试' }: { questions: Question[]; title?: string }) {
  const { state, recordAnswer, toggleFav } = useStore();
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const picks = (qid: string) => answers[qid];
  const isSubmitted = (qid: string) => !!submitted[qid];

  const setPick = (qid: string, v: string | string[] | boolean) => {
    if (isSubmitted(qid)) return;
    setAnswers((s) => ({ ...s, [qid]: v }));
  };

  const submit = (q: Question) => {
    const ans = picks(q.id) ?? null;
    const { ok } = grade(q, ans);
    setSubmitted((s) => ({ ...s, [q.id]: true }));
    setOpen((s) => ({ ...s, [q.id]: true }));
    recordAnswer(q.id, ok, answerToText(q, ans));
  };

  const reset = (qid: string) => {
    setSubmitted((s) => ({ ...s, [qid]: false }));
    setAnswers((s) => {
      const n = { ...s };
      delete n[qid];
      return n;
    });
    setOpen((s) => ({ ...s, [qid]: false }));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-[13px] font-semibold tracking-[0.14em] text-ink">{title}</h3>
          <span className="text-[11px] text-muted">{questions.length} 题</span>
        </div>
        <span className="text-[10.5px] text-muted">提交后立即判分</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const rec = state.quiz[q.id];
          const ans = picks(q.id);
          const done = isSubmitted(q.id);
          const res = done ? grade(q, ans ?? null) : null;
          const showExp = open[q.id];

          return (
            <div key={q.id} className="border border-line bg-panel">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="num text-[11px] text-copper">{String(qi + 1).padStart(2, '0')}</span>
                  <span className="chip !py-[2px] !text-[10px]">{TYPE_LABEL[q.qtype]}</span>
                  {rec?.solved && <span className="text-[10px] text-[#3F6B4F]">已答对</span>}
                  {rec && !rec.solved && rec.attempts > 0 && (
                    <span className="text-[10px] text-copper">错 {rec.wrong} 次</span>
                  )}
                </div>
                <button
                  onClick={() => toggleFav(q.id)}
                  className={`tap shrink-0 ${rec?.fav ? 'text-copper' : 'text-line-2 hover:text-muted'}`}
                  aria-label="收藏"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={rec?.fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3">
                    <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6 4.2 13.6l.7-4.3-3.1-3 4.3-.6z" />
                  </svg>
                </button>
              </div>

              <div className="px-4 pb-4 pt-3.5">
                <p className="text-[14px] leading-[1.75] text-ink">{q.stem}</p>

                {/* 单选 */}
                {q.qtype === 'single' && (
                  <div className="mt-3 space-y-2">
                    {(q.options ?? []).map((opt) => {
                      const letter = opt.trim()[0];
                      const chosen = ans === letter;
                      const isRight = done && String(q.answer) === letter;
                      const isWrongPick = done && chosen && !isRight;
                      return (
                        <button
                          key={letter}
                          onClick={() => setPick(q.id, letter)}
                          className={`flex w-full items-start gap-2.5 border px-3 py-2.5 text-left text-[13px] leading-relaxed transition-colors ${
                            isRight
                              ? 'border-[#4C7A5E] bg-[#F1F6F2] text-ink'
                              : isWrongPick
                                ? 'border-copper bg-[#FAF3EA] text-ink'
                                : chosen
                                  ? 'border-navy bg-[#F3F5F9] text-ink'
                                  : 'border-line bg-transparent text-ink-2 hover:border-line-2'
                          }`}
                        >
                          <span className="num mt-[1px] shrink-0 text-[11px] text-muted">{letter}</span>
                          <span>{opt.replace(/^[A-D][.、]\s*/, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 多选 */}
                {q.qtype === 'multi' && (
                  <div className="mt-3 space-y-2">
                    {(q.options ?? []).map((opt) => {
                      const letter = opt.trim()[0];
                      const arr = Array.isArray(ans) ? ans : [];
                      const chosen = arr.includes(letter);
                      const isRight = done && (q.answer as string[]).includes(letter);
                      const isWrongPick = done && chosen && !isRight;
                      return (
                        <button
                          key={letter}
                          onClick={() => {
                            const next = chosen ? arr.filter((x) => x !== letter) : [...arr, letter];
                            setPick(q.id, next);
                          }}
                          className={`flex w-full items-start gap-2.5 border px-3 py-2.5 text-left text-[13px] leading-relaxed transition-colors ${
                            isRight
                              ? 'border-[#4C7A5E] bg-[#F1F6F2]'
                              : isWrongPick
                                ? 'border-copper bg-[#FAF3EA]'
                                : chosen
                                  ? 'border-navy bg-[#F3F5F9]'
                                  : 'border-line hover:border-line-2'
                          }`}
                        >
                          <span
                            className={`mt-[2px] flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                              chosen ? 'border-navy bg-navy' : 'border-line-2'
                            }`}
                          >
                            {chosen && (
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.8">
                                <path d="M1.5 5.2 4 7.6 8.5 2.4" />
                              </svg>
                            )}
                          </span>
                          <span>{opt.replace(/^[A-D][.、]\s*/, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 判断 */}
                {q.qtype === 'judge' && (
                  <div className="mt-3 flex gap-2">
                    {[
                      { v: true, label: '正确' },
                      { v: false, label: '错误' },
                    ].map(({ v, label }) => {
                      const chosen = ans === v;
                      const isRight = done && Boolean(q.answer) === v;
                      const isWrongPick = done && chosen && !isRight;
                      return (
                        <button
                          key={label}
                          onClick={() => setPick(q.id, v)}
                          className={`flex-1 border py-2.5 text-[13px] transition-colors ${
                            isRight
                              ? 'border-[#4C7A5E] bg-[#F1F6F2]'
                              : isWrongPick
                                ? 'border-copper bg-[#FAF3EA]'
                                : chosen
                                  ? 'border-navy bg-[#F3F5F9]'
                                  : 'border-line hover:border-line-2'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 情景分析 */}
                {q.qtype === 'scenario' && (
                  <div className="mt-3">
                    <textarea
                      value={typeof ans === 'string' ? ans : ''}
                      onChange={(e) => setPick(q.id, e.target.value)}
                      disabled={done}
                      rows={5}
                      placeholder="用自己的话写出分析要点：参与者、策略、收益结构、结论……"
                      className="w-full resize-y border border-line bg-[#FCFBF7] px-3 py-2.5 text-[13px] leading-relaxed text-ink outline-none placeholder:text-line-2 focus:border-slateblue disabled:bg-[#F7F6F2]"
                    />
                    <p className="mt-1 text-[10.5px] text-muted">按要点判分：覆盖 70% 以上关键要点即通过。</p>
                  </div>
                )}

                {/* 操作 */}
                <div className="mt-3 flex items-center gap-2">
                  {!done ? (
                    <button
                      onClick={() => submit(q)}
                      disabled={
                        ans === undefined ||
                        (typeof ans === 'string' && ans.trim() === '') ||
                        (Array.isArray(ans) && ans.length === 0)
                      }
                      className="btn btn-primary btn-sm"
                    >
                      提交答案
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setOpen((s) => ({ ...s, [q.id]: !s[q.id] }))} className="btn btn-ghost btn-sm">
                        {showExp ? '收起解析' : '查看解析'}
                      </button>
                      <button onClick={() => reset(q.id)} className="btn btn-ghost btn-sm">
                        重做
                      </button>
                    </>
                  )}
                </div>

                {/* 结果 */}
                {done && res && (
                  <div className="mt-3">
                    <div
                      className={`flex items-center gap-2 border-l-2 px-3 py-2 text-[12px] ${
                        res.ok ? 'border-[#4C7A5E] bg-[#F1F6F2] text-[#33543F]' : 'border-copper bg-[#FAF3EA] text-[#7A5326]'
                      }`}
                    >
                      <span className="font-semibold">{res.ok ? '答对了' : '答错了'}</span>
                      {q.qtype === 'scenario' && res.ratio !== undefined && (
                        <span className="text-[11px]">要点覆盖 {Math.round(res.ratio * 100)}%</span>
                      )}
                      {!res.ok && q.qtype !== 'scenario' && (
                        <span className="text-[11px]">
                          正确答案：{q.qtype === 'judge' ? (q.answer ? '正确' : '错误') : Array.isArray(q.answer) ? q.answer.join('') : q.answer}
                        </span>
                      )}
                    </div>

                    {showExp && (
                      <div className="fade mt-2 border border-line bg-[#FCFBF7] px-3.5 py-3">
                        <div className="label-copper mb-1.5">解析</div>
                        <p className="text-[12.5px] leading-[1.8] text-ink-2">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
