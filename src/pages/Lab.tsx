import { Link, useNavigate, useParams } from 'react-router-dom';
import { LABS, LAB_MAP } from '../labs';
import { LESSON_MAP } from '../data/curriculum';

export default function LabPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const active = id ? LAB_MAP[id] : null;

  if (!active) {
    return (
      <div className="page-wrap">
        <header>
          <div className="label-copper mb-1">STRATEGY LAB</div>
          <h1 className="masthead text-[24px] leading-tight text-ink">互动实验室</h1>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            六个可以真正操作的实验。不是看图，是亲手改变参数、看均衡怎么移动。
          </p>
          <div className="mt-4 rule" />
        </header>

        <div className="mt-4 space-y-2.5">
          {LABS.map((l) => (
            <Link key={l.id} to={`/lab/${l.id}`} className="card card-hover tap flex items-start gap-3 p-4">
              <span className="num mt-[2px] text-[11px] text-copper">{l.no}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-[14.5px] font-semibold text-ink">{l.title}</h2>
                  <span className="text-[9px] tracking-[0.1em] text-line-2">{l.en}</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{l.one}</p>
                <div className="mt-2 flex gap-1.5">
                  {l.lessons.map((x) => (
                    <span key={x} className="chip !text-[9.5px]">
                      L{String(LESSON_MAP[x]?.no ?? '').padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 border border-line bg-[#FCFBF7] p-4">
          <div className="label mb-2">怎么用</div>
          <p className="text-[11.5px] leading-[1.85] text-muted">
            建议的顺序：先读对应课程，再来实验室调参数，最后回到错题本检验。实验里的每个数字都是实时计算的，
            改一个参数，均衡可能就换个位置——这正是「结构决定行为」最直观的样子。
          </p>
        </div>
      </div>
    );
  }

  const Comp = active.Comp;

  return (
    <div className="page-wrap">
      <div className="flex items-center justify-between">
        <button onClick={() => nav('/lab')} className="tap flex items-center gap-1.5 text-[11.5px] text-muted">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M8.5 3 4.5 7l4 4" />
          </svg>
          全部实验
        </button>
        <span className="num text-[10.5px] text-muted">{active.no} / 06</span>
      </div>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {LABS.map((l) => (
          <button
            key={l.id}
            onClick={() => nav(`/lab/${l.id}`)}
            className={`shrink-0 border px-2.5 py-1.5 text-[11px] transition-colors ${
              l.id === active.id ? 'border-navy bg-navy text-[#F6F4EE]' : 'border-line text-muted hover:border-line-2'
            }`}
          >
            {l.title}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <Comp />
      </div>

      <div className="mt-7 border-t border-line pt-3">
        <div className="label mb-2">相关课程</div>
        <div className="flex flex-wrap gap-1.5">
          {active.lessons.map((x) => {
            const lesson = LESSON_MAP[x];
            if (!lesson) return null;
            return (
              <Link key={x} to={`/lesson/${x}`} className="chip hover:border-line-2 hover:text-ink">
                L{String(lesson.no).padStart(2, '0')} {lesson.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
