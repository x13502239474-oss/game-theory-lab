import { Link } from 'react-router-dom';
import { useStore, todayKey } from '../store/store';
import { ALL_LESSONS, STAGE_MAP, TOTAL_MINUTES } from '../data/curriculum';
import { CASES } from '../data/cases';
import { dailyGameOf } from '../data/daily';
import { fmtDateCN, fmtMinutes } from '../lib/date';
import { Ring, SectionHead, Bar } from '../components/ui';

export default function Home() {
  const { state, stats, setDaily } = useStore();
  const key = todayKey();
  const game = dailyGameOf(key);
  const rec = state.daily[key] ?? {};

  const current = ALL_LESSONS.find((l) => !state.lessons[l.id]?.done) ?? ALL_LESSONS[ALL_LESSONS.length - 1];
  const idx = ALL_LESSONS.findIndex((l) => l.id === current.id);
  const next = ALL_LESSONS[Math.min(idx + 1, ALL_LESSONS.length - 1)];
  const stage = STAGE_MAP[current.stage];
  const doneInStage = stage.lessons.filter((l) => state.lessons[l.id]?.done).length;

  // 今日案例：按日期在案例库里轮换
  const dayIdx = Number(key.replace(/-/g, '')) % CASES.length;
  const todayCase = CASES[dayIdx];

  const pct = stats.doneCount / ALL_LESSONS.length;
  const stagePct = doneInStage / stage.lessons.length;

  return (
    <div className="page-wrap">
      {/* 报头 */}
      <header className="rise">
        <div className="flex items-start justify-between">
          <div>
            <div className="label-copper mb-1">GAME THEORY LAB</div>
            <h1 className="masthead text-[26px] leading-[1.15] text-ink">
              博弈论
              <br />
              研究所
            </h1>
          </div>
          <div className="text-right">
            <div className="label">{fmtDateCN()}</div>
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <span className="h-1 w-1 rounded-full bg-copper" />
              <span className="num text-[13px] text-ink">{stats.streak}</span>
              <span className="text-[10.5px] text-muted">天连续学习</span>
            </div>
          </div>
        </div>
        <div className="mt-4 rule" />
      </header>

      {/* 当前阶段 */}
      <section className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="label">当前阶段</span>
          <span className="text-[10.5px] text-muted">
            {doneInStage}/{stage.lessons.length} 课
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="masthead text-[21px] leading-snug text-ink">
              <span className="num mr-2 text-[13px] text-copper">0{stage.no}</span>
              {stage.title}
            </h2>
            <p className="mt-1.5 max-w-[300px] text-[11.5px] leading-relaxed text-muted">{stage.summary}</p>
          </div>
          <div className="w-16 shrink-0">
            <div className="text-right text-[10px] text-muted">{Math.round(stagePct * 100)}%</div>
            <div className="mt-1.5">
              <Bar value={stagePct} />
            </div>
          </div>
        </div>
      </section>

      {/* 学习进度 */}
      <section className="mt-7">
        <SectionHead index="01" title="学习进度" right={<Link to="/courses" className="text-[10.5px] text-copper">全部课程 →</Link>} />
        <div className="card flex items-center gap-5 p-4">
          <Ring value={pct} label={`${Math.round(pct * 100)}%`} sub="完成率" size={86} />
          <div className="grid flex-1 grid-cols-2 gap-y-3.5">
            <div>
              <div className="num text-[16px] leading-none text-ink">
                {stats.doneCount}
                <span className="text-[10px] text-muted"> / {ALL_LESSONS.length}</span>
              </div>
              <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">已完成章节</div>
            </div>
            <div>
              <div className="num text-[16px] leading-none text-ink">
                {stats.doneMinutes}
                <span className="text-[10px] text-muted"> 分</span>
              </div>
              <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">累计学习时长</div>
            </div>
            <div>
              <div className="num text-[16px] leading-none text-ink">L{String(current.no).padStart(2, '0')}</div>
              <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">当前课程</div>
            </div>
            <div>
              <div className="num text-[16px] leading-none text-ink">L{String(next.no).padStart(2, '0')}</div>
              <div className="mt-1 text-[10px] tracking-[0.08em] text-muted">下一节课程</div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] text-muted">
          全课程 {ALL_LESSONS.length} 课 · 约 {Math.round(TOTAL_MINUTES / 60)} 小时 · 今日已学 {fmtMinutes(stats.todaySeconds)}
        </p>
      </section>

      {/* 今日学习 */}
      <section className="mt-7">
        <SectionHead index="02" title="今日学习" sub="每天一个知识点，一个案例，几道题。" />
        <div className="card">
          <div className="border-b border-line px-4 py-3.5">
            <div className="flex items-baseline justify-between">
              <span className="label">今日知识点</span>
              <span className="text-[10px] text-muted">{current.minutes} 分钟</span>
            </div>
            <h3 className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">
              L{String(current.no).padStart(2, '0')} · {current.title}
            </h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{current.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
            <Link to={`/cases/${todayCase.id}`} className="tap block px-4 py-3">
              <div className="label">今日案例</div>
              <div className="mt-1 text-[12px] leading-snug text-ink">{todayCase.title}</div>
              <div className="mt-1 text-[10px] text-muted">{todayCase.domain} · {todayCase.year}</div>
            </Link>
            <Link to={`/lesson/${current.id}`} className="tap block px-4 py-3">
              <div className="label">今日练习</div>
              <div className="mt-1 text-[12px] leading-snug text-ink">{current.quiz.length} 道题 · 跟着课程</div>
              <div className="mt-1 text-[10px] text-muted">提交后立即判分</div>
            </Link>
          </div>
          <Link
            to={`/lesson/${current.id}`}
            className="flex items-center justify-between px-4 py-3 text-[12.5px] font-medium text-ink transition-colors hover:bg-tint"
          >
            <span>一键继续学习</span>
            <span className="text-copper">→</span>
          </Link>
        </div>
      </section>

      {/* 每日博弈 */}
      <section className="mt-7">
        <SectionHead index="03" title="每日博弈" sub="先凭直觉判断，再看理论分析。" />
        <div className="card p-4">
          <div className="label-copper mb-2">DAILY GAME · {key}</div>
          <h3 className="text-[15.5px] font-semibold leading-snug text-ink">{game.question}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{game.scene}</p>

          {!rec.revealed ? (
            <div className="mt-3 space-y-2">
              {game.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => setDaily(key, { predicted: i, revealed: true })}
                  className="flex w-full items-start gap-2.5 border border-line px-3 py-2.5 text-left text-[12.5px] leading-relaxed text-ink-2 transition-colors hover:border-line-2 hover:bg-[#FCFBF8]"
                >
                  <span className="num mt-[1px] shrink-0 text-[10px] text-muted">{String.fromCharCode(65 + i)}</span>
                  <span>{o}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="fade mt-3">
              <div className="border-l-2 border-copper bg-[#FAF3EA] px-3 py-2 text-[12px] text-[#7A5326]">
                你的判断：{String.fromCharCode(65 + (rec.predicted ?? 0))} · {game.options[rec.predicted ?? 0]}
              </div>
              <div className="mt-2.5 border border-line bg-[#FCFBF7] px-3.5 py-3">
                <div className="label mb-1.5">理论分析</div>
                <p className="text-[12.5px] leading-[1.85] text-ink-2">{game.analysis}</p>
                <p className="mt-2 text-[11.5px] text-copper">{game.verdict}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Link to={`/lesson/${game.lessonId}`} className="text-[11.5px] text-copper">
                  相关课程 →
                </Link>
                <button onClick={() => setDaily(key, { revealed: false })} className="text-[11px] text-muted underline-offset-2 hover:underline">
                  收起
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="mt-7">
        <SectionHead index="04" title="进入研究所" />
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { to: '/lab', t: '实验室', s: '6 个实验', d: '亲手操作' },
            { to: '/cases', t: '案例库', s: `${CASES.length} 个案例`, d: '九个维度' },
            { to: '/graph', t: '知识图谱', s: '29 个概念', d: '看关系' },
          ].map((x) => (
            <Link key={x.to} to={x.to} className="card card-hover tap p-3">
              <div className="text-[12.5px] font-medium text-ink">{x.t}</div>
              <div className="mt-3 num text-[10px] text-muted">{x.s}</div>
              <div className="mt-[3px] text-[10px] text-line-2">{x.d}</div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-9 border-t border-line pt-4">
        <p className="text-[10px] leading-relaxed text-muted">
          课程为自主编排，参考张维迎《博弈与社会》《博弈论与信息经济学》的知识框架与问题意识，
          不引用原书章节、页码或原文。所有数学推导在站内可复核。
        </p>
      </footer>
    </div>
  );
}
