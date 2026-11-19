import type { TreeNode, TreeSpec } from '../types'

type Laid = {
  node: TreeNode
  x: number
  y: number
  depth: number
  children: Laid[]
  branchLabel?: string
}

const X0 = 34
const GAP_X = 132
const GAP_Y = 56
const PAD_Y = 26

function leafCount(n: TreeNode): number {
  if (!n.branches || n.branches.length === 0) return 1
  return n.branches.reduce((s, b) => s + leafCount(b.to), 0)
}

/** 递归布点：横向按深度、纵向按叶子均分 */
function build(node: TreeNode, depth: number, yTop: number, branchLabel?: string): Laid {
  const leaves = leafCount(node)
  const y = yTop + (leaves * GAP_Y) / 2
  const out: Laid = { node, x: X0 + depth * GAP_X, y, depth, children: [], branchLabel }
  if (node.branches && node.branches.length > 0) {
    let cursor = yTop
    for (const b of node.branches) {
      const lc = leafCount(b.to)
      out.children.push(build(b.to, depth + 1, cursor, b.label))
      cursor += lc * GAP_Y
    }
  }
  return out
}

function maxDepth(n: TreeNode): number {
  if (!n.branches || n.branches.length === 0) return 0
  return 1 + Math.max(...n.branches.map((b) => maxDepth(b.to)))
}

export function GameTree({ spec }: { spec: TreeSpec }) {
  const root = build(spec.root, 0, 0)
  const leaves = leafCount(spec.root)
  const height = leaves * GAP_Y + PAD_Y * 2
  const width = X0 * 2 + maxDepth(spec.root) * GAP_X + 90

  const lines: JSX.Element[] = []
  const nodes: JSX.Element[] = []
  const labels: JSX.Element[] = []

  const onSolution = (path: string[], label?: string, depth?: number) => {
    if (!label || depth === undefined) return false
    return path[depth] === label
  }
  const sol = spec.solution || []

  const walk = (l: Laid) => {
    const terminal = !l.node.branches || l.node.branches.length === 0
    if (terminal) {
      const p = l.node.payoff || [0, 0]
      nodes.push(
        <g key={`t-${l.node.id}`}>
          <rect
            x={l.x - 2}
            y={l.y - 11}
            width={104}
            height={22}
            fill="#FBF7EE"
            stroke="#DCD3C2"
            strokeWidth="0.8"
          />
          <text x={l.x + 8} y={l.y + 4} fontSize="12" fill="#12263F" fontFamily="'IBM Plex Mono', monospace">
            {p[0]} , {p[1]}
          </text>
        </g>,
      )
    } else {
      const isP0 = l.node.player === 0
      nodes.push(
        <g key={`n-${l.node.id}`}>
          <circle cx={l.x} cy={l.y} r="7" fill={isP0 ? '#16324F' : '#9C7A4A'} />
          <text
            x={l.x}
            y={l.y - 13}
            textAnchor="middle"
            fontSize="10.5"
            fill="#33475F"
            fontFamily="'IBM Plex Mono', monospace"
          >
            {spec.players[l.node.player ?? 0]}
          </text>
          {l.node.label && (
            <text x={l.x} y={l.y + 22} textAnchor="middle" fontSize="9.5" fill="#6E7F93">
              {l.node.label}
            </text>
          )}
        </g>,
      )
    }

    for (const c of l.children) {
      const active = onSolution(sol, c.branchLabel, l.depth)
      lines.push(
        <line
          key={`l-${l.node.id}-${c.node.id}`}
          x1={l.x + 7}
          y1={l.y}
          x2={c.x - 7}
          y2={c.y}
          stroke={active ? '#8F3B31' : '#B9AE9B'}
          strokeWidth={active ? 2 : 1.1}
        />,
      )
      if (c.branchLabel) {
        labels.push(
          <text
            key={`b-${l.node.id}-${c.node.id}`}
            x={(l.x + c.x) / 2}
            y={(l.y + c.y) / 2 - 5}
            textAnchor="middle"
            fontSize="10.5"
            fill={active ? '#8F3B31' : '#6E7F93'}
            fontWeight={active ? 600 : 400}
          >
            {c.branchLabel}
          </text>,
        )
      }
      walk(c)
    }
  }
  walk(root)

  return (
    <figure className="my-1">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth: Math.min(width, 620), maxHeight: 460 }}
          role="img"
          aria-label={spec.caption || '博弈树'}
        >
          <rect x="0" y="0" width={width} height={height} fill="#FFFCF5" />
          {lines}
          {labels}
          {nodes}
        </svg>
      </div>
      {(spec.caption || spec.note) && (
        <figcaption className="mt-2 text-[11.5px] leading-relaxed text-muted">
          {spec.caption && <span className="text-ink2">{spec.caption}</span>}
          {spec.note && <span className="ml-1">{spec.note}</span>}
        </figcaption>
      )}
    </figure>
  )
}
