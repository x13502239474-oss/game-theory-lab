import React from 'react';
import { InlineMath } from '../lib/prose';

export function LabIntro({ title, en, children }: { title: string; en: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="label-copper mb-1">{en}</div>
      <h2 className="masthead text-[22px] leading-tight text-ink">{title}</h2>
      {children && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  hint,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] text-ink-2">{label}</span>
        <span className="num text-[13px] text-ink">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-none bg-[#E4E1D8] accent-[#14213D]"
        style={{
          background: `linear-gradient(to right, #14213D ${((value - min) / (max - min)) * 100}%, #E4E1D8 ${
            ((value - min) / (max - min)) * 100
          }%)`,
        }}
      />
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function Choice<T extends string | number>({
  options,
  value,
  onChange,
  size,
}: {
  options: { v: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.v === value;
        return (
          <button
            key={String(o.v)}
            onClick={() => onChange(o.v)}
            className={`flex-1 border text-center transition-colors ${
              size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-3 py-2.5 text-[13px]'
            } ${on ? 'border-navy bg-navy text-[#F6F4EE]' : 'border-line bg-transparent text-ink-2 hover:border-line-2'}`}
          >
            <div>{o.label}</div>
            {o.sub && <div className={`mt-0.5 text-[10px] ${on ? 'text-[#C9CFDB]' : 'text-muted'}`}>{o.sub}</div>}
          </button>
        );
      })}
    </div>
  );
}

export function Readout({ label, value, unit, tone }: { label: string; value: React.ReactNode; unit?: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="border border-line bg-[#FCFBF7] px-3 py-2.5">
      <div className="text-[10px] tracking-[0.1em] text-muted">{label}</div>
      <div
        className={`num mt-1 text-[18px] leading-none ${
          tone === 'pos' ? 'text-[#3F6B4F]' : tone === 'neg' ? 'text-copper' : 'text-ink'
        }`}
      >
        {value}
        {unit && <span className="ml-1 text-[10px] text-muted">{unit}</span>}
      </div>
    </div>
  );
}

export function Note({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' }) {
  const cls =
    tone === 'good'
      ? 'border-[#4C7A5E] bg-[#F1F6F2] text-[#33543F]'
      : tone === 'warn'
        ? 'border-copper bg-[#FAF3EA] text-[#7A5326]'
        : 'border-line bg-[#FBFBF8] text-ink-2';
  return <div className={`border-l-2 px-3 py-2.5 text-[12.5px] leading-[1.75] ${cls}`}>{children}</div>;
}

export function Math({ children }: { children: string }) {
  return <InlineMath>{children}</InlineMath>;
}
