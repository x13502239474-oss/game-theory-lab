import type { MatrixSpec } from '../types'

/** 静态收益矩阵：行玩家收益在前，列玩家收益在后；最优反应加下划线 */
export function PayoffMatrix({ spec }: { spec: MatrixSpec }) {
  const showBR = spec.showBR !== false
  return (
    <figure className="my-1">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] border-collapse text-center text-[13px]">
          <thead>
            <tr>
              <th className="border border-line bg-[#F4EFE3] px-3 py-2 text-left font-normal">
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  {spec.corner || '行 \\ 列'}
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink2">{spec.rowPlayer}</div>
              </th>
              <th
                colSpan={spec.cols.length}
                className="border border-line bg-[#F4EFE3] px-3 py-1.5 font-normal text-[11.5px] text-ink2"
              >
                {spec.colPlayer}
              </th>
            </tr>
            <tr>
              <th className="border border-line bg-[#FBF7EE] px-3 py-2" />
              {spec.cols.map((c) => (
                <th key={c} className="border border-line bg-[#FBF7EE] px-3 py-2 font-medium text-ink">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((r) => (
              <tr key={r.label}>
                <th className="border border-line bg-[#FBF7EE] px-3 py-2 text-left font-medium text-ink">
                  {r.label}
                </th>
                {r.cells.map((cell, i) => {
                  const brA = showBR && cell.brRow
                  const brB = showBR && cell.brCol
                  return (
                    <td
                      key={i}
                      className={`border border-line px-2 py-3 tabnum ${
                        cell.eq ? 'bg-[#F0E7D5]' : 'bg-surface'
                      }`}
                    >
                      <span className="inline-flex items-baseline gap-1.5">
                        <span className={brA ? 'border-b-2 border-navy pb-[1px] text-ink' : 'text-ink'}>
                          {cell.a}
                        </span>
                        <span className="text-[10px] text-muted">,</span>
                        <span className={brB ? 'border-b-2 border-copper pb-[1px] text-ink2' : 'text-ink2'}>
                          {cell.b ?? '—'}
                        </span>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(spec.caption || spec.note) && (
        <figcaption className="mt-2 text-[11.5px] leading-relaxed text-muted">
          {spec.caption && <span className="text-ink2">{spec.caption}</span>}
          {spec.note && <span className="ml-1">{spec.note}</span>}
          {showBR && (
            <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-steel">
              下划线＝该参与者的最优反应
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
