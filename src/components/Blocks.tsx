import type { Block } from '../types'
import { Formula } from './Formula'
import { PayoffMatrix } from './PayoffMatrix'
import { GameTree } from './GameTree'
import { Callout } from './ui'

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.k === 'p')
          return (
            <p key={i} className="text-[14.5px] leading-[1.95] text-ink2">
              {b.t}
            </p>
          )
        if (b.k === 'sub')
          return (
            <h4 key={i} className="!mt-7 border-l-2 border-copper pl-3 text-[16px] font-semibold leading-snug text-ink">
              {b.t}
            </h4>
          )
        if (b.k === 'list')
          return b.ordered ? (
            <ol key={i} className="space-y-2">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-[1.9] text-ink2">
                  <span className="mt-[2px] shrink-0 font-mono text-[11px] text-copper">{j + 1}.</span>
                  <span>{it}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ul key={i} className="space-y-2">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-3 text-[14px] leading-[1.9] text-ink2">
                  <span className="mt-[9px] h-[3px] w-[3px] shrink-0 bg-copper" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )
        if (b.k === 'formula')
          return (
            <div key={i} className="overflow-x-auto border-y border-linesoft bg-[#FBF7EE] px-4 py-3">
              <Formula tex={b.tex} />
              {b.vars && b.vars.length > 0 && (
                <div className="mt-2 grid gap-1 border-t border-linesoft pt-2 sm:grid-cols-2">
                  {b.vars.map((v) => (
                    <div key={v.s} className="flex items-baseline gap-2 text-[12px]">
                      <span className="font-mono text-[11px] text-copper">{v.s}</span>
                      <span className="text-muted">{v.m}</span>
                    </div>
                  ))}
                </div>
              )}
              {b.note && <p className="mt-2 text-[12px] leading-relaxed text-muted">{b.note}</p>}
            </div>
          )
        if (b.k === 'table')
          return (
            <figure key={i} className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-[#F4EFE3]">
                    {b.head.map((h) => (
                      <th key={h} className="border border-line px-3 py-2 font-medium text-ink">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.map((c, ci) => (
                        <td
                          key={ci}
                          className={`border border-line px-3 py-2 leading-relaxed ${
                            ci === 0 ? 'bg-[#FBF7EE] text-ink' : 'text-ink2'
                          }`}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.caption && <figcaption className="mt-1.5 text-[11.5px] text-muted">{b.caption}</figcaption>}
            </figure>
          )
        if (b.k === 'note')
          return (
            <Callout key={i} label={b.title} tone={b.tone === 'navy' ? 'navy' : 'copper'}>
              {b.t}
            </Callout>
          )
        if (b.k === 'assumptions')
          return (
            <div key={i} className="border border-line bg-[#FBF7EE] p-4">
              <div className="eyebrow">Assumptions · 前提假设</div>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-[12.5px] leading-relaxed text-ink2">
                    <span className="font-mono text-[10px] text-copper">A{j + 1}</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        if (b.k === 'scope')
          return (
            <div key={i} className="grid gap-px border border-line bg-line sm:grid-cols-2">
              <div className="bg-surface p-3.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-moss">成立条件</div>
                <ul className="mt-1.5 space-y-1">
                  {b.works.map((w, j) => (
                    <li key={j} className="text-[12.5px] leading-[1.8] text-ink2">
                      · {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-surface p-3.5">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-oxblood">局限</div>
                <ul className="mt-1.5 space-y-1">
                  {b.limits.map((w, j) => (
                    <li key={j} className="text-[12.5px] leading-[1.8] text-ink2">
                      · {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        if (b.k === 'matrix')
          return (
            <div key={i} className="border border-line bg-surface p-3 sm:p-4">
              <PayoffMatrix spec={b.spec} />
            </div>
          )
        if (b.k === 'tree')
          return (
            <div key={i} className="border border-line bg-surface p-3 sm:p-4">
              <GameTree spec={b.spec} />
            </div>
          )
        if (b.k === 'steps')
          return (
            <div key={i} className="border border-line">
              {b.title && (
                <div className="border-b border-line bg-[#F4EFE3] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-copper">
                  {b.title}
                </div>
              )}
              <ol className="divide-y divide-linesoft">
                {b.items.map((s, j) => (
                  <li key={j} className="grid gap-2 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-5">
                    <div className="font-mono text-[11px] leading-6 text-copper">
                      {String(j + 1).padStart(2, '0')} · {s.label}
                    </div>
                    <div>
                      <p className="text-[13.5px] leading-[1.9] text-ink2">{s.text}</p>
                      {s.tex && (
                        <div className="mt-1.5 overflow-x-auto text-[13px]">
                          <Formula tex={s.tex} display={false} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )
        if (b.k === 'quote')
          return (
            <blockquote key={i} className="border-l-2 border-copper2 py-1 pl-4">
              <p className="font-serif text-[15px] leading-[1.9] text-ink">“{b.t}”</p>
              {b.source && <footer className="mt-1 meta">— {b.source}</footer>}
            </blockquote>
          )
        return null
      })}
    </div>
  )
}
