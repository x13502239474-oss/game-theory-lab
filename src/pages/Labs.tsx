import { Link } from 'react-router-dom'
import { IconArrow } from '../components/Icons'

export const LABS = [
  {
    id: 'matrix',
    no: '01',
    title: '收益矩阵求解器',
    en: 'Payoff Matrix Solver',
    desc: '改四个数字，看占优策略、划线最优反应、纯策略与混合策略均衡如何同步变化。所有概率与期望收益都由公式实时算出。',
    tags: ['占优', '纳什均衡', '混合策略'],
  },
  {
    id: 'repeat',
    no: '02',
    title: '重复博弈与贴现',
    en: 'Repeated Game',
    desc: '调整 T/R/P/S 与贴现因子 δ，检验触发策略的临界条件；再让四种策略打一轮循环赛，看合作什么时候能活下来。',
    tags: ['触发策略', '贴现', '合作演化'],
  },
  {
    id: 'bayes',
    no: '03',
    title: '贝叶斯信念更新',
    en: 'Bayes Updating',
    desc: '给定先验、灵敏度与误报率，实时计算后验信念。理解为什么「信号有信息量」不等于「后验一定高」。',
    tags: ['先验', '后验', '信号'],
  },
]

export default function Labs() {
  return (
    <div className="shell pb-14 pt-7 sm:pt-10">
      <header className="border-b border-line pb-5">
        <div className="eyebrow">Laboratory · 03 Experiments</div>
        <h1 className="mt-2 text-[28px] tracking-tight sm:text-[36px]">博弈实验室</h1>
        <p className="mt-2 max-w-[40rem] text-[13px] leading-[1.9] text-muted">
          三个可以亲手调参的实验。矩阵求解、触发策略临界值、贝叶斯后验，全部由与讲义同一套公式实时计算。
          先改一个数字，再读结论——这比背十条定义更有用。
        </p>
      </header>

      <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2">
        {LABS.map((lab) => (
          <Link
            key={lab.id}
            to={`/labs/${lab.id}`}
            className="group flex flex-col bg-surface p-5 transition-colors hover:bg-[#FBF7EE] sm:p-6"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.16em] text-copper">{lab.no}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{lab.en}</span>
            </div>
            <h2 className="mt-3 text-[20px] tracking-tight text-ink group-hover:text-navy">{lab.title}</h2>
            <p className="mt-2 flex-1 text-[12.5px] leading-[1.85] text-muted">{lab.desc}</p>
            <div className="mt-4 flex items-center justify-between border-t border-linesoft pt-3">
              <div className="flex flex-wrap gap-1.5">
                {lab.tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
              <IconArrow className="h-4 w-4 text-steel transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}

        <Link to="/cases" className="group flex flex-col bg-[#F4EFE3] p-5 transition-colors hover:bg-[#EFE8D9] sm:p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] tracking-[0.16em] text-copper">04</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Case Library</span>
          </div>
          <h2 className="mt-3 text-[20px] tracking-tight text-ink group-hover:text-navy">现实案例库</h2>
          <p className="mt-2 flex-1 text-[12.5px] leading-[1.85] text-muted">
            价格战、市场进入、拍卖、劳资谈判、国际谈判……每个案例都拆到参与者、策略、收益与博弈类型，并注明模型解释不了的部分。
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-[#DCD3C2] pt-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="chip border-[#C9BDA6]">商业</span>
              <span className="chip border-[#C9BDA6]">政治</span>
              <span className="chip border-[#C9BDA6]">国际关系</span>
            </div>
            <IconArrow className="h-4 w-4 text-steel transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      <div className="mt-8 border-l-2 border-copper bg-[#FBF7EE] p-4 text-[12px] leading-[1.9] text-ink2 sm:p-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-copper">Method</span>
        <p className="mt-1.5">
          矩阵实验只处理 2×2 双矩阵博弈，因为它可以手算核对。混合均衡用无差异条件求解，而不是数值搜索；
          重复博弈用贴现和计算临界值；贝叶斯实验直接套用贝叶斯法则。三处公式在讲义中都有逐项推导。
        </p>
      </div>
    </div>
  )
}
