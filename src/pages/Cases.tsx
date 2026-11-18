import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CASES, CASE_DOMAINS } from '../data/cases';

export default function Cases() {
  const [domain, setDomain] = useState<string>('全部');
  const list = domain === '全部' ? CASES : CASES.filter((c) => c.domain === domain);

  return (
    <div className="page-wrap">
      <header>
        <div className="label-copper mb-1">CASE LIBRARY</div>
        <div className="flex items-end justify-between">
          <h1 className="masthead text-[24px] leading-tight text-ink">案例研究</h1>
          <span className="num text-[12px] text-muted">{CASES.length} 例</span>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          每个案例都按九个维度拆解：背景、参与者、利益、策略、收益、模型、均衡、现实结果，以及理论与现实的差距。
        </p>
        <div className="mt-4 rule" />
      </header>

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {CASE_DOMAINS.map((d) => (
          <button key={d} onClick={() => setDomain(d)} className={`chip shrink-0 ${domain === d ? 'chip-on' : ''}`}>
            {d}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {list.map((c, i) => (
          <Link key={c.id} to={`/cases/${c.id}`} className="card card-hover block p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="num text-[10px] text-copper">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[9.5px] tracking-[0.1em] text-muted">
                    {c.domain} · {c.year}
                  </span>
                </div>
                <h2 className="mt-1.5 text-[14.5px] font-semibold leading-snug text-ink">{c.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{c.background}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="chip !text-[9.5px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="mt-1 shrink-0 text-[14px] text-line-2">→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 border border-line bg-[#FCFBF7] p-4">
        <div className="label mb-2">读案例的方法</div>
        <p className="text-[11.5px] leading-[1.85] text-muted">
          先别看「均衡分析」，自己在纸上写下参与者与策略，猜一个结果，再对照。案例不是为了证明理论正确，
          而是为了看清「模型假设」与「现实条件」之间那道缝。每个案例最后一节都在讲这道缝。
        </p>
      </div>
    </div>
  );
}
