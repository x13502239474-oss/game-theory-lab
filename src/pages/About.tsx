import { Link } from 'react-router-dom'
import { lessons, stages, totalQuestions } from '../content'

const REFERENCES = [
  ['Martin J. Osborne', 'An Introduction to Game Theory', 'Oxford University Press', '标准入门教材：矩阵、均衡、动态与不完全信息，推导清晰。'],
  ['Robert Gibbons', 'Game Theory for Applied Economists', 'Princeton University Press', '面向应用：四类博弈各一章，适合边学边用。'],
  ['Drew Fudenberg & Jean Tirole', 'Game Theory', 'MIT Press', '研究生层级参考书：子博弈完美、贝叶斯博弈、重复博弈的严格处理。'],
  ['Ken Binmore', 'Playing for Real', 'Oxford University Press', '用大量故事讲清直觉，适合作为第二本读物。'],
  ['Avinash Dixit & Barry Nalebuff', 'Thinking Strategically', 'W. W. Norton', '策略思维普及读本：承诺、边缘政策、投票与谈判。'],
  ['Thomas Schelling', 'The Strategy of Conflict', 'Harvard University Press', '焦点、承诺与威慑的经典来源。'],
  ['Robert Axelrod', 'The Evolution of Cooperation', 'Basic Books', '重复囚徒困境竞赛与「针锋相对」的经典研究。'],
  ['John Maynard Smith', 'Evolution and the Theory of Games', 'Cambridge University Press', '演化稳定策略（ESS）的原始框架。'],
  ['George Akerlof / Michael Spence / Joseph Stiglitz', '柠檬市场、信号、筛选', '1970 年代论文', '信息不对称三部曲，第 5 部分的思想来源。'],
]

export default function About() {
  return (
    <div className="shell max-w-[820px] pb-14 pt-7 sm:pt-10">
      <header className="border-b border-line pb-5">
        <div className="eyebrow">Colophon</div>
        <h1 className="mt-2 text-[28px] tracking-tight sm:text-[36px]">课程说明与参考</h1>
        <p className="mt-2 text-[13px] leading-[1.9] text-muted">
          {lessons.length} 讲、{stages.length} 个部分、{totalQuestions} 道练习。讲义为自编，不是任何教材的电子版。
        </p>
      </header>

      <section className="mt-7">
        <h2 className="text-[18px] tracking-tight">这门课怎么组织的</h2>
        <p className="mt-2 text-[13.5px] leading-[1.95] text-ink2">
          课程按「基础 → 静态 → 混合 → 动态 → 不完全信息 → 重复 → 专题 → 实战」推进。每一讲固定十一个区块：
          学习目标、问题导入、基础概念、理论详解、数学推导、经典模型、完整案例、常见错误、知识结构、本节总结、课后练习。
          重要的理论都会回答八个问题：解决什么问题、产生背景、前提假设、核心逻辑、怎么推导、何时成立、有什么局限、能解释什么现实。
        </p>
        <div className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2">
          {stages.map((s) => (
            <div key={s.id} className="bg-surface p-3.5">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-copper">
                Part {String(s.id).padStart(2, '0')} · {s.chapters}
              </div>
              <div className="mt-1 text-[14px] text-ink">{s.title}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{s.question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] tracking-tight">数学与案例的处理原则</h2>
        <ul className="mt-2 space-y-2">
          {[
            '所有收益矩阵都标出最优反应，均衡位置可以逐格复核；不做「只给答案、不给过程」的省略。',
            '混合策略概率用无差异条件求解，优先写成 1/2、3/5 这类分数，并代回验证期望收益。',
            '动态博弈的逆向归纳写到「在最后一个节点，参与者会选……因为……」，再逐层倒推。',
            '重复博弈的临界贴现因子由两条路径的现值相等推出，不直接给结论。',
            '案例中的数字是课堂算例，用来演示机制，不是统计引用；每个案例都单列「模型边界」。',
            '涉及现实制度与历史事实时，只写有共识的部分，不编造金额、日期与引文。',
          ].map((t, i) => (
            <li key={i} className="flex gap-3 text-[13px] leading-[1.9] text-ink2">
              <span className="mt-[3px] shrink-0 font-mono text-[10px] text-copper">{String(i + 1).padStart(2, '0')}</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] tracking-tight">参考书目</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          以下书目用于核对概念与结论，讲义正文用自己的话重新组织，不整段引用原文。
        </p>
        <div className="mt-3 divide-y divide-linesoft border-y border-linesoft">
          {REFERENCES.map(([author, title, pub, note]) => (
            <div key={title} className="grid gap-1 py-3 sm:grid-cols-[210px_1fr] sm:gap-5">
              <div>
                <div className="text-[12.5px] text-ink">{author}</div>
                <div className="mt-0.5 font-serif text-[12px] italic text-muted">{title}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted">{pub}</div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-l-2 border-copper bg-[#FBF7EE] p-4 sm:p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-copper">Limits</div>
        <p className="mt-1.5 text-[12.5px] leading-[1.95] text-ink2">
          博弈论是分析工具，不是预言机。模型给出的是「在给定假设下，什么结果是稳定的」，现实中的偏好、信息、制度与情绪都比矩阵复杂。
          学完这门课，你应该能更清楚地说明「我的结论依赖哪些假设」，而不是更自信地断言「事情一定会这样」。
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-[18px] tracking-tight">数据与隐私</h2>
        <p className="mt-2 text-[13px] leading-[1.95] text-ink2">
          学习进度、答题记录、错题与笔记全部保存在浏览器本机（localStorage），不上传服务器。清除浏览器数据会一并清除记录，
          可在「我的」页面导出备份。网站不接入第三方统计。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/course" className="btn-primary">
            回到课程目录
          </Link>
          <Link to="/me" className="btn-outline">
            查看学习记录
          </Link>
        </div>
      </section>
    </div>
  )
}
