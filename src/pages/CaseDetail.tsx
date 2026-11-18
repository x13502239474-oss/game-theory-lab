import { Link, useNavigate, useParams } from 'react-router-dom';
import { CASES, CASE_MAP } from '../data/cases';
import { LESSON_MAP } from '../data/curriculum';
import { inline } from '../lib/prose';

const SECTIONS = [
  { key: 'background', no: '01', title: '案例背景' },
  { key: 'interests', no: '03', title: '各方利益' },
  { key: 'strategies', no: '04', title: '可选策略' },
  { key: 'payoffs', no: '05', title: '收益结构' },
  { key: 'model', no: '06', title: '博弈模型' },
  { key: 'equilibrium', no: '07', title: '均衡分析' },
  { key: 'reality', no: '08', title: '现实结果' },
  { key: 'gap', no: '09', title: '理论与现实的差距' },
] as const;

export default function CaseDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const c = CASE_MAP[id];

  if (!c) {
    return (
      <div className="page-wrap">
        <p className="text-[13px] text-muted">案例不存在。</p>
        <Link to="/cases" className="mt-3 inline-block text-[12.5px] text-copper">
          返回案例库 →
        </Link>
      </div>
    );
  }

  const idx = CASES.findIndex((x) => x.id === c.id);
  const prev = CASES[idx - 1];
  const next = CASES[idx + 1];

  return (
    <div className="page-wrap">
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="tap flex items-center gap-1.5 text-[11.5px] text-muted">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M8.5 3 4.5 7l4 4" />
          </svg>
          返回
        </button>
        <span className="num text-[10.5px] text-muted">
          {String(idx + 1).padStart(2, '0')} / {String(CASES.length).padStart(2, '0')}
        </span>
      </div>

      <header className="mt-4">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.12em] text-muted">
          <span className="text-copper">{c.domain}</span>
          <span className="h-px w-5 bg-line-2" />
          <span>{c.year}</span>
        </div>
        <h1 className="masthead mt-2.5 text-[25px] leading-[1.3] text-ink">{c.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-5">
        <div className="label-copper mb-2">01 · 案例背景</div>
        <p className="text-[13.5px] leading-[1.9] text-ink-2">{inline(c.background, 'bg')}</p>
      </section>

      <section className="mt-6">
        <div className="label-copper mb-2">02 · 参与者</div>
        <div className="card divide-y divide-line">
          {c.players.map((p) => (
            <div key={p.name} className="flex items-baseline justify-between px-4 py-2.5">
              <span className="text-[12.5px] font-medium text-ink">{p.name}</span>
              <span className="text-[11px] text-muted">{p.role}</span>
            </div>
          ))}
        </div>
      </section>

      {SECTIONS.filter((s) => s.key !== 'background').map((s) => {
        const val = c[s.key as keyof typeof c];
        return (
          <section key={s.key} className="mt-6">
            <div className="label-copper mb-2">
              {s.no} · {s.title}
            </div>
            {Array.isArray(val) ? (
              <ul className="space-y-2">
                {val.map((v, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] leading-[1.85] text-ink-2">
                    <span className="mt-[9px] h-px w-2.5 shrink-0 bg-copper" />
                    <span>{inline(String(v), `${s.key}-${i}`)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-[13.5px] leading-[1.9] ${s.key === 'gap' ? 'border-l-2 border-copper bg-[#FAF6EE] px-3.5 py-3 text-ink-2' : 'text-ink-2'}`}>
                {inline(String(val), s.key)}
              </p>
            )}
          </section>
        );
      })}

      <section className="mt-6 border-t border-line pt-3">
        <div className="label mb-2">相关课程</div>
        <div className="flex flex-wrap gap-1.5">
          {c.lessons.map((lid) => {
            const l = LESSON_MAP[lid];
            if (!l) return null;
            return (
              <Link key={lid} to={`/lesson/${lid}`} className="chip hover:border-line-2 hover:text-ink">
                L{String(l.no).padStart(2, '0')} {l.title}
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-2">
        {prev ? (
          <Link to={`/cases/${prev.id}`} className="border border-line px-3 py-2.5 hover:bg-tint">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">上一个案例</div>
            <div className="mt-0.5 truncate text-[11.5px] text-ink">{prev.title}</div>
          </Link>
        ) : (
          <div />
        )}
        {next && (
          <Link to={`/cases/${next.id}`} className="border border-line px-3 py-2.5 text-right hover:bg-tint">
            <div className="text-[9.5px] tracking-[0.1em] text-muted">下一个案例</div>
            <div className="mt-0.5 truncate text-[11.5px] text-ink">{next.title}</div>
          </Link>
        )}
      </div>
    </div>
  );
}
