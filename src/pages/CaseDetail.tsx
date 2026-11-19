import { Link, useParams } from 'react-router-dom'
import { cases } from '../content/cases'
import { getLesson, stages } from '../content'
import { SectionNo } from '../components/ui'
import { IconArrow } from '../components/Icons'
import NotFound from './NotFound'

export default function CaseDetail() {
  const { id } = useParams()
  const c = cases.find((x) => x.id === id)
  if (!c) return <NotFound />
  const lesson = getLesson(c.lessonId)
  const stage = stages.find((s) => s.id === c.stage)
  const siblings = cases.filter((x) => x.id !== c.id && x.stage === c.stage).slice(0, 3)

  return (
    <article className="shell max-w-[820px] pb-14 pt-7 sm:pt-10">
      <nav className="flex flex-wrap items-center gap-2 meta">
        <Link to="/cases" className="hover:text-ink">
          案例库
        </Link>
        <span>/</span>
        <span>{stage?.title}</span>
      </nav>

      <header className="mt-4 border-b border-line pb-5">
        <div className="eyebrow">Case · {stage?.en}</div>
        <h1 className="mt-2 text-[27px] leading-[1.25] tracking-tight sm:text-[35px]">{c.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip">第 {c.stage} 部分</span>
          {c.kind && <span className="chip">{c.kind}</span>}
          {lesson && (
            <Link to={`/lesson/${lesson.id}`} className="chip hover:border-navy hover:text-ink">
              关联课程 · {lesson.title}
            </Link>
          )}
        </div>
      </header>

      <section className="mt-7">
        <SectionNo n="01" title="场景与冲突" en="Background" />
        <p className="text-[14.5px] leading-[1.95] text-ink2">{c.body}</p>
      </section>

      {(c.players || c.strategies || c.payoffs) && (
        <section className="mt-7">
          <SectionNo n="02" title="建模要素" en="Model Setup" />
          <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              ['参与者', c.players],
              ['可选策略', c.strategies],
              ['收益结构', c.payoffs],
            ].map(([label, val]) =>
              val ? (
                <div key={label as string} className="bg-surface p-3.5">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-copper">{label}</div>
                  <div className="mt-1 text-[12.5px] leading-[1.85] text-ink2">{val}</div>
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}

      {c.numbers && c.numbers.length > 0 && (
        <section className="mt-7">
          <SectionNo n="03" title="关键数字" en="Numbers" />
          <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
            {c.numbers.map((n) => (
              <div key={n.label} className="bg-surface p-3">
                <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{n.label}</dt>
                <dd className="tabnum mt-1 text-[14px] text-ink">{n.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="mt-7">
        <SectionNo n="04" title="理论如何解释" en="Explanation" />
        <p className="text-[14px] leading-[1.95] text-ink2">
          这个案例属于<span className="text-ink">{c.kind || '博弈论应用'}</span>。把参与者、策略与收益按讲义的方法摆成矩阵或博弈树后，
          均衡会告诉你：给定对方的选择，没有人愿意单方面改变。案例中的行为看似反常，往往是因为我们只看到了自己的收益，没看到对方的激励。
        </p>
        {lesson && (
          <Link
            to={`/lesson/${lesson.id}`}
            className="mt-3 inline-flex items-center gap-2 border border-line px-3 py-2 text-[12px] text-navy hover:border-navy"
          >
            回到讲义看完整求解 <IconArrow className="h-3.5 w-3.5" />
          </Link>
        )}
      </section>

      {c.caveat && (
        <section className="mt-7">
          <SectionNo n="05" title="模型边界" en="Limits" />
          <div className="border-l-2 border-oxblood bg-[#F9F1EE] px-4 py-3">
            <p className="text-[13px] leading-[1.95] text-ink2">{c.caveat}</p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            读案例时先问三个问题：收益真的只有这些吗？参与者真的只有这两方吗？这个博弈真的只发生一次吗？
          </p>
        </section>
      )}

      {siblings.length > 0 && (
        <section className="mt-9 border-t border-line pt-5">
          <div className="eyebrow">More in this part</div>
          <div className="mt-2 space-y-2">
            {siblings.map((s) => (
              <Link key={s.id} to={`/cases/${s.id}`} className="block text-[13px] text-ink2 hover:text-navy">
                {s.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
