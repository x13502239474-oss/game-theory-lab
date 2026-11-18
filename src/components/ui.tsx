import React from 'react';

export function SectionHead({
  index,
  title,
  right,
  sub,
}: {
  index?: string;
  title: string;
  right?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {index && <span className="num text-[11px] text-copper">{index}</span>}
          <h2 className="text-[13px] font-semibold tracking-[0.14em] text-ink">{title}</h2>
        </div>
        {sub && <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Ring({
  value,
  size = 84,
  stroke = 3,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sub?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6E2D8" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#14213D"
          strokeWidth={stroke}
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.22,.61,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="num text-[19px] leading-none text-ink">{label}</div>
        {sub && <div className="mt-1 text-[9px] tracking-[0.14em] text-muted">{sub}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1">
        <span className="num text-[17px] leading-none text-ink">{value}</span>
        {unit && <span className="text-[10px] text-muted">{unit}</span>}
      </div>
      <div className="mt-1.5 text-[10px] tracking-[0.1em] text-muted">{label}</div>
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-line px-6 py-14 text-center">
      <div className="num text-[13px] tracking-[0.2em] text-line-2">· · ·</div>
      <p className="text-[12.5px] leading-relaxed text-muted">{text}</p>
      {action}
    </div>
  );
}

export function Bar({ value, height = 4 }: { value: number; height?: number }) {
  return (
    <div className="w-full bg-[#E9E5DA]" style={{ height }}>
      <div
        className="h-full bg-navy transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
      />
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-[#12203A]/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-in relative max-h-[86vh] w-full overflow-y-auto border border-line bg-paper sm:max-w-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-paper px-5 py-3.5">
          <div className="min-w-0">{title}</div>
          <button onClick={onClose} className="tap shrink-0 p-1 text-muted hover:text-ink" aria-label="关闭">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
