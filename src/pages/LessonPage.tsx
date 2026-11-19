import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getLesson, nextLesson, prevLesson, stageOf, stages } from '../content'
import { useStore, useStudyTimer } from '../lib/store'
import { Blocks } from '../components/Blocks'
import { PayoffMatrix } from '../components/PayoffMatrix'
import { GameTree } from '../components/GameTree'
import { Quiz } from '../components/Quiz'
import { Callout, SectionNo } from '../components/ui'
import { IconArrow, IconBookmark, IconCheck } from '../components/Icons'
import { MatrixLab } from '../labs/MatrixLab'
import { RepeatLab } from '../labs/RepeatLab'
import { BayesLab } from '../labs/BayesLab'
import type { Lesson } from '../types'
import NotFound from './NotFound'

const LAB_META: Record<string, { title: string; el: () => JSX.Element }> = {
  matrix: { title: '动手实验：改收益，看均衡怎么变', el: () => <MatrixLab /> },
  repeat: { title: '动手实验：贴现因子与触发策略', el: () => <RepeatLab /> },
  bayes: { title: '动手实验：先验、信号与后验', el: () => <BayesLab /> },
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const { state, completeLesson, uncompleteLesson, toggleFavorite, saveNote } = useStore()
  useStudyTimer(true)
  const loc = useLocation()
  const [progress, setProgress] = useState(0)
  const articleRef = useRef<HTMLDivElement | null>(null)
  const [note, setNote] = useState(state.notes[lesson.id]?.text || '')
  const [saved, setSaved] = useState(false)

  const done = !!state.completed[lesson.id]
  const fav = state.favorites.some((f) => f.id === lesson.id)
  const stage = stageOf(lesson.stage)
  const prev = prevLesson(lesson.id)
  const next = nextLesson(lesson.id)

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const top = el.offsetTop
      const total = el.offsetHeight - window.innerHeight + 200
      const p = total <= 0 ? 100 : ((window.scrollY - top + 260) / total) * 100
      setProgress(Math.min(100, Math.max(0, p)))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (loc.hash === '#quiz') {
      setTimeout(() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [loc.hash])

  const savedNote = state.notes[lesson.id]?.text || ''
  useEffect(() => {
    setNote(savedNote)
    setSaved(false)
  }, [lesson.id, savedNote])

  const toc = useMemo(
    () => [
      { id: 's1', no: '01', title: '学习目标' },
      { id: 's2', no: '02', title: '问题导入' },
      { id: 's3', no: '03', title: '基础概念' },
      { id: 's4', no: '04', title: '理论详解' },
      ...(lesson.derivation ? [{ id: 's5', no: '05', title: '数学推导' }] : []),
      ...(lesson.model ? [{ id: 's6', no: '06', title: '经典模型' }] : []),
      { id: 's7', no: '07', title: '完整案例' },
      { id: 's8', no: '08', title: '常见错误' },
      { id: 's9', no: '09', title: '知识结构' },
      { id: 's10', no: '10', title: '本节总结' },
      { id: 'quiz', no: '11', title: '课后练习' },
    ],
    [lesson],
  )
  const [active, setActive] = useState('s1')

  useEffect(() => {
    const onScroll = () => {
      let cur = toc[0].id
      for (const t of toc) {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top <= 150) cur = t.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  const lab = lesson.lab ? LAB_META[lesson.lab] : undefined

  return (
    <div>
      <div className="fixed left-0 right-0 top-0 z-40 h-[2px] bg-transparent lg:left-[250px]">
        <div className="h-full bg-copper transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <div className="shell max-w-[1140px] pb-12 pt-7 sm:pt-10 xl:flex xl:items-start xl:gap-10">
        <article ref={articleRef} className="w-full min-w-0 max-w-[860px]">
          <nav className="flex flex-wrap items-center gap-2 meta">
            <Link to="/course" className="hover:text-ink">
              课程
            </Link>
            <span>/</span>
            <span>第 {String(lesson.stage).padStart(2, '0')} 部分</span>
            <span>/</span>
            <span className="text-ink2">{stage?.title}</span>
          </nav>

          <header className="mt-4 border-b border-line pb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="meta">
                  第 {String(lesson.order).padStart(2, '0')} 讲 · {lesson.chapter} · {lesson.minutes} 分钟
                </div>
                <h1 className="mt-2 text-[27px] leading-[1.22] tracking-tight sm:text-[37px]">{lesson.title}</h1>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{lesson.subtitle}</p>
              </div>
              <button
                onClick={() => toggleFavorite(lesson.id, lesson.title, lesson.stage)}
                aria-label="收藏本讲"
                className={`mt-1 shrink-0 border p-2 transition-colors ${
                  fav
                    ? 'border-copper bg-[#F7F0E2] text-copper'
                    : 'border-line text-steel hover:border-copper hover:text-copper'
                }`}
              >
                <IconBookmark filled={fav} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                className={done ? 'btn-outline' : 'btn-primary'}
                onClick={() => (done ? uncompleteLesson(lesson.id) : completeLesson(lesson.id))}
              >
                {done ? (
                  <>
                    <IconCheck className="h-4 w-4 text-moss" /> 已学完（点击取消）
                  </>
                ) : (
                  '标记本讲学完'
                )}
              </button>
              <Link to="/wrong" className="btn-ghost">
                错题本
              </Link>
              <span className="ml-auto hidden meta sm:block">学习记录自动保存在本机</span>
            </div>
          </header>

          <section id="s1" className="mt-8 scroll-mt-24">
            <SectionNo n="01" title="学习目标" en="Objectives" />
            <ul className="grid gap-2 sm:grid-cols-3">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="border-l border-copper/60 pl-3 text-[13px] leading-[1.8] text-ink2">
                  <span className="mr-1.5 font-mono text-[9px] text-copper">0{i + 1}</span>
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <section id="s2" className="mt-9 scroll-mt-24">
            <SectionNo n="02" title="问题导入" en="Opening" />
            <h3 className="text-[18px] leading-snug text-ink">{lesson.hook.title}</h3>
            <div className="mt-2 space-y-3">
              {lesson.hook.paragraphs.map((p, i) => (
                <p key={i} className="text-[14.5px] leading-[1.95] text-ink2">
                  {i === 0 && <span className="mr-1 font-serif text-[22px] leading-none text-copper2">“</span>}
                  {p}
                </p>
              ))}
            </div>
          </section>

          <section id="s3" className="mt-9 scroll-mt-24">
            <SectionNo n="03" title="基础概念" en="Key Concepts" />
            <div className="divide-y divide-linesoft border-y border-linesoft">
              {lesson.concepts.map((c) => (
                <div key={c.term} className="grid gap-2 py-3.5 sm:grid-cols-[156px_1fr] sm:gap-6">
                  <div>
                    <div className="text-[14.5px] font-medium text-ink">{c.term}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-copper">{c.plain}</div>
                  </div>
                  <p className="text-[13px] leading-[1.9] text-ink2">{c.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="s4" className="mt-9 scroll-mt-24">
            <SectionNo n="04" title="理论详解" en="Theory" />
            <Blocks blocks={lesson.theory} />
          </section>

          {lab && (
            <section className="mt-8">
              <div className="mb-2 flex items-baseline justify-between">
                <div className="eyebrow">Interactive</div>
                <span className="meta">本讲配套实验</span>
              </div>
              <div className="mb-2 text-[13px] text-ink2">{lab.title}</div>
              {lab.el()}
            </section>
          )}

          {lesson.derivation && (
            <section id="s5" className="mt-9 scroll-mt-24">
              <SectionNo n="05" title="数学推导" en="Derivation" />
              <div className="border border-line bg-surface px-4 py-4 sm:px-6">
                <h3 className="text-[16px] leading-snug text-ink">{lesson.derivation.title}</h3>
                {lesson.derivation.intro && (
                  <p className="mt-1.5 text-[13px] leading-[1.9] text-ink2">{lesson.derivation.intro}</p>
                )}
                {lesson.derivation.formula && (
                  <div className="mt-3 overflow-x-auto border-y border-linesoft bg-[#FBF7EE] px-4 py-3">
                    <Blocks blocks={[{ k: 'formula', tex: lesson.derivation.formula, vars: lesson.derivation.vars }]} />
                  </div>
                )}
                <ol className="mt-3 space-y-2.5">
                  {lesson.derivation.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px] leading-[1.95] text-ink2">
                      <span className="mt-[3px] shrink-0 font-mono text-[10px] text-copper">STEP {i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {lesson.derivation.note && (
                  <p className="mt-3 border-l-2 border-copper/50 pl-3 text-[12.5px] leading-[1.9] text-muted">
                    {lesson.derivation.note}
                  </p>
                )}
              </div>
            </section>
          )}

          {lesson.model && (
            <section id="s6" className="mt-9 scroll-mt-24">
              <SectionNo n="06" title="经典模型" en="Canonical Model" />
              <div className="border border-line bg-surface p-4 sm:p-5">
                <h3 className="text-[17px] leading-snug text-ink">{lesson.model.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.9] text-ink2">{lesson.model.intro}</p>
                {lesson.model.matrix && (
                  <div className="mt-3 border border-line p-2 sm:p-3">
                    <PayoffMatrix spec={lesson.model.matrix} />
                  </div>
                )}
                {lesson.model.tree && (
                  <div className="mt-3 border border-line p-2 sm:p-3">
                    <GameTree spec={lesson.model.tree} />
                  </div>
                )}
                <div className="mt-4">
                  <div className="eyebrow">求解步骤</div>
                  <ol className="mt-2 space-y-2">
                    {lesson.model.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-[13px] leading-[1.9] text-ink2">
                        <span className="mt-[1px] shrink-0 font-mono text-[10px] text-copper">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="mt-3 border-l-2 border-navy bg-[#F3EFE5] px-3.5 py-2.5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-navy">结论</div>
                  <p className="mt-1 text-[13px] leading-[1.9] text-ink">{lesson.model.conclusion}</p>
                </div>
                {lesson.model.meaning && (
                  <p className="mt-2.5 text-[12.5px] leading-[1.9] text-muted">
                    <span className="text-copper">现实解释 · </span>
                    {lesson.model.meaning}
                  </p>
                )}
              </div>
            </section>
          )}

          <section id="s7" className="mt-9 scroll-mt-24">
            <SectionNo n="07" title="完整案例" en="Cases" />
            <div className="space-y-4">
              {lesson.cases.map((c) => (
                <div key={c.title} className="border border-line bg-surface p-4 sm:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-copper">CASE</div>
                    {c.kind && <span className="chip">{c.kind}</span>}
                  </div>
                  <h3 className="mt-1 text-[16.5px] leading-snug text-ink">{c.title}</h3>
                  {(c.players || c.strategies || c.payoffs) && (
                    <dl className="mt-2.5 grid gap-px border border-linesoft bg-linesoft sm:grid-cols-3">
                      {c.players && (
                        <div className="bg-[#FBF7EE] p-2.5">
                          <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">参与者</dt>
                          <dd className="mt-0.5 text-[11.5px] leading-relaxed text-ink2">{c.players}</dd>
                        </div>
                      )}
                      {c.strategies && (
                        <div className="bg-[#FBF7EE] p-2.5">
                          <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">策略</dt>
                          <dd className="mt-0.5 text-[11.5px] leading-relaxed text-ink2">{c.strategies}</dd>
                        </div>
                      )}
                      {c.payoffs && (
                        <div className="bg-[#FBF7EE] p-2.5">
                          <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">收益结构</dt>
                          <dd className="mt-0.5 text-[11.5px] leading-relaxed text-ink2">{c.payoffs}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <p className="mt-2.5 text-[13px] leading-[1.95] text-ink2">{c.body}</p>
                  {c.numbers && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-linesoft pt-3 sm:grid-cols-3">
                      {c.numbers.map((n) => (
                        <div key={n.label}>
                          <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{n.label}</dt>
                          <dd className="tabnum mt-0.5 text-[13px] text-ink">{n.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {c.caveat && (
                    <p className="mt-3 border-l-2 border-oxblood/40 bg-[#F9F1EE] px-3 py-2 text-[11.5px] leading-[1.85] text-ink2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-oxblood">模型边界 · </span>
                      {c.caveat}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section id="s8" className="mt-9 scroll-mt-24">
            <SectionNo n="08" title="常见错误" en="Common Errors" />
            <div className="divide-y divide-linesoft border-y border-linesoft">
              {lesson.mistakes.map((m, i) => (
                <div key={i} className="grid gap-2 py-3 sm:grid-cols-[1fr_1fr] sm:gap-5">
                  <div className="flex gap-2">
                    <span className="mt-[1px] shrink-0 font-mono text-[10px] text-oxblood">×</span>
                    <p className="text-[12.5px] leading-[1.85] text-muted line-through decoration-oxblood/40">
                      {m.wrong}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="mt-[1px] shrink-0 font-mono text-[10px] text-moss">✓</span>
                    <p className="text-[12.5px] leading-[1.85] text-ink2">{m.right}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="s9" className="mt-9 scroll-mt-24">
            <SectionNo n="09" title="知识结构" en="Structure" />
            <div className="border border-line bg-[#FBF7EE] p-4">
              <ul className="space-y-1.5">
                {lesson.structure.map((s, i) => {
                  const sub = s.startsWith('—')
                  return (
                    <li
                      key={i}
                      className={`flex gap-2 text-[13px] leading-[1.9] ${
                        sub ? 'pl-4 text-ink2' : 'font-medium text-ink'
                      }`}
                    >
                      <span className={`mt-[8px] h-[3px] w-[3px] shrink-0 ${sub ? 'bg-copper/50' : 'bg-copper'}`} />
                      <span>{s.replace(/^—\s*/, '')}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>

          <section id="s10" className="mt-9 scroll-mt-24">
            <SectionNo n="10" title="本节总结" en="Summary" />
            <ol className="space-y-2 border-l-2 border-navy/20 pl-4">
              {lesson.summary.map((s, i) => (
                <li key={i} className="text-[13.5px] leading-[1.9] text-ink2">
                  <span className="mr-2 font-mono text-[10px] text-copper">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
            {lesson.extend && (
              <Callout label="延伸练习" tone="navy">
                {lesson.extend}
              </Callout>
            )}
          </section>

          <section id="quiz" className="mt-10 scroll-mt-24">
            <SectionNo n="11" title="课后练习" en="Assessment" />
            <Quiz lesson={lesson} />
          </section>

          <section className="mt-10 border-t border-line pt-6">
            <div className="flex items-baseline justify-between">
              <div className="eyebrow">Notes</div>
              <span className="meta">{state.notes[lesson.id] ? '已保存' : '仅保存在本机'}</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setSaved(false)
              }}
              rows={3}
              placeholder="写下你的理解、疑问，或一个现实中的例子……"
              className="mt-2 w-full resize-y border border-line bg-surface p-3 text-[13px] leading-relaxed outline-none focus:border-navy"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                className="btn-outline px-3 py-1.5 text-[12px]"
                onClick={() => {
                  saveNote(lesson.id, note)
                  setSaved(true)
                }}
              >
                保存笔记
              </button>
              {saved && <span className="text-[11px] text-moss">已保存到本机</span>}
            </div>
          </section>

          <nav className="mt-10 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
            {prev ? (
              <Link to={`/lesson/${prev.id}`} className="group border border-line p-4 hover:border-navy">
                <div className="meta">上一讲</div>
                <div className="mt-1 flex items-center gap-2 text-[14px] text-ink">
                  <IconArrow className="h-4 w-4 rotate-180 text-steel" />
                  {prev.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link to={`/lesson/${next.id}`} className="group border border-line p-4 text-right hover:border-navy">
                <div className="meta">下一讲</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-[14px] text-ink">
                  {next.title}
                  <IconArrow className="h-4 w-4 text-steel" />
                </div>
              </Link>
            ) : (
              <Link to="/me" className="border border-line p-4 text-right hover:border-navy">
                <div className="meta">课程结束</div>
                <div className="mt-1 text-[14px] text-ink">查看学习报告</div>
              </Link>
            )}
          </nav>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 meta">
            <span>
              第 {lesson.stage} 部分 · {stages.find((s) => s.id === lesson.stage)?.title} · {lesson.chapter}
            </span>
            <Link to="/about" className="hover:text-ink">
              课程说明与参考
            </Link>
          </footer>
        </article>

        <aside className="sticky top-8 hidden w-[186px] shrink-0 xl:block">
          <div className="eyebrow">Contents</div>
          <nav className="mt-3 border-l border-line">
            {toc.map((t) => {
              const on = active === t.id
              return (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  aria-current={on ? 'true' : undefined}
                  className={`-ml-px flex items-baseline gap-2 border-l py-[7px] pl-3 pr-1 text-[12px] leading-snug transition-colors ${
                    on ? 'border-copper font-medium text-ink' : 'border-transparent text-muted hover:text-ink2'
                  }`}
                >
                  <span className={`font-mono text-[9px] tabnum ${on ? 'text-copper' : 'text-steel'}`}>{t.no}</span>
                  <span className="min-w-0">{t.title}</span>
                </a>
              )
            })}
          </nav>
          <div className="mt-4 flex items-center justify-between border-t border-linesoft pt-3">
            <span className="meta">已读</span>
            <span className="tabnum font-mono text-[11px] text-ink2">{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-linesoft">
            <div className="h-full bg-navy transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function LessonPage() {
  const { id } = useParams()
  const lesson = getLesson(id)
  if (!lesson) return <NotFound />
  return <LessonBody lesson={lesson} />
}
