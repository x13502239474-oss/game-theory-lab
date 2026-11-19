import { Link, useParams } from 'react-router-dom'
import { MatrixLab } from '../labs/MatrixLab'
import { RepeatLab } from '../labs/RepeatLab'
import { BayesLab } from '../labs/BayesLab'
import { LABS } from './Labs'
import NotFound from './NotFound'
import { IconArrow } from '../components/Icons'

const BODY: Record<string, { intro: string; points: string[] }> = {
  matrix: {
    intro:
      '一张 2×2 的收益矩阵，是所有静态博弈分析的起点。下面的实验把「划线找最优反应」交给程序，你的任务是理解它为什么这样划。',
    points: [
      '先只改行参与者的收益，看行方向的下划线怎么移动；再改列参与者的，看列方向。',
      '当两个下划线在同一格相遇，那一格就是纯策略纳什均衡。',
      '把「猜硬币」的四个数字调成有共同最优反应，纯策略均衡立刻出现——混合均衡反而消失了。',
      '留意右下角的无差异方程：分子是「换策略的收益差」，分母是「交互项」。',
    ],
  },
  repeat: {
    intro:
      '重复博弈要回答一个问题：如果明天还会见面，今天的背叛是不是仍然划算？贴现因子 δ 就是「明天」的重量。',
    points: [
      '先保持默认收益，把 δ 从 0.2 拖到 0.9，看循环赛冠军从「始终背叛」变成「针锋相对」。',
      'T 越大（背叛越诱人），δ* 越高——合作需要更多耐心来支撑。',
      '把对手设为「始终背叛」，观察「针锋相对」也会陷入长期互相背叛：善意需要对方回应。',
      '冷酷触发对一次背叛的惩罚更重，因此在 δ 足够高时更稳，但也更容易因误会产生不可逆的崩塌。',
    ],
  },
  bayes: {
    intro:
      '不完全信息博弈里，参与者不知道对手的类型，只能根据信号更新信念。贝叶斯法则就是那台更新机器。',
    points: [
      '先验 0.4、灵敏度 0.8、误报 0.2 时，后验是 0.727——信号把信念往上推了一截，但没有推到 0.8。',
      '把先验压到 0.1，同样的信号只能把后验推到 0.31：低 base rate 会吞掉大部分信息量。',
      '把误报率调到接近灵敏度，信号几乎不再有区分力，后验回到先验附近。',
      '在信号传递模型里，「好类型愿意发高成本信号」的关键，正是低类型模仿不起。',
    ],
  },
}

export default function LabPage() {
  const { id } = useParams()
  const meta = LABS.find((l) => l.id === id)
  const body = id ? BODY[id] : undefined
  if (!meta || !body) return NotFound()

  return (
    <article className="shell pb-14 pt-7 sm:pt-10">
      <nav className="flex flex-wrap items-center gap-2 meta">
        <Link to="/labs" className="hover:text-ink">
          实验室
        </Link>
        <span>/</span>
        <span>{meta.title}</span>
      </nav>

      <header className="mt-4 border-b border-line pb-5">
        <div className="eyebrow">
          Experiment {meta.no} · {meta.en}
        </div>
        <h1 className="mt-2 text-[28px] leading-tight tracking-tight sm:text-[36px]">{meta.title}</h1>
        <p className="mt-2 max-w-[44rem] text-[13.5px] leading-[1.95] text-muted">{body.intro}</p>
      </header>

      <div className="mt-6">{id === 'matrix' ? <MatrixLab /> : id === 'repeat' ? <RepeatLab /> : <BayesLab />}</div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="eyebrow">How to read</div>
          <ul className="mt-2 space-y-2">
            {body.points.map((p, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-[1.9] text-ink2">
                <span className="mt-[3px] shrink-0 font-mono text-[10px] text-copper">{String(i + 1).padStart(2, '0')}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="border-l border-line pl-5">
          <div className="eyebrow">Related</div>
          <div className="mt-2 space-y-2">
            {LABS.filter((l) => l.id !== id).map((l) => (
              <Link key={l.id} to={`/labs/${l.id}`} className="block text-[12.5px] text-ink2 hover:text-navy">
                {l.title}
                <IconArrow className="ml-1 inline h-3.5 w-3.5 text-steel" />
              </Link>
            ))}
            <Link to="/course" className="block text-[12.5px] text-ink2 hover:text-navy">
              回到课程目录
            </Link>
          </div>
        </aside>
      </section>
    </article>
  )
}
