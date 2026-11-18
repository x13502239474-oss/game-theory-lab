import React from 'react';
import katex from 'katex';

export function mathHtml(src: string, display = false) {
  try {
    return katex.renderToString(src, {
      displayMode: display,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    return `<code>${src}</code>`;
  }
}

export function InlineMath({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: mathHtml(children) }} />;
}

/** 行内：**粗体** / $公式$ / `代码` */
export function inline(text: string, keyBase = 'i'): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$\n]+\$|`[^`]+`)/g);
  return parts.filter(Boolean).map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      return <strong key={key}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      return <span key={key} dangerouslySetInnerHTML={{ __html: mathHtml(p.slice(1, -1)) }} />;
    }
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) {
      return (
        <code key={key} className="rounded-sm bg-[#F1EFE9] px-1 py-[1px] font-mono text-[0.88em] text-ink">
          {p.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={key}>{p}</React.Fragment>;
  });
}

type Block =
  | { t: 'h3'; text: string }
  | { t: 'h4'; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'quote'; lines: string[] }
  | { t: 'math'; text: string }
  | { t: 'table'; rows: string[][] }
  | { t: 'tree'; text: string };

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();

    if (!trim) {
      i++;
      continue;
    }

    // 树形图块
    if (trim === '[[tree]]') {
      const buf: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '[[/tree]]') {
        buf.push(lines[i]);
        i++;
      }
      i++; // 跳过结束标记
      blocks.push({ t: 'tree', text: buf.join('\n') });
      continue;
    }

    // 展示公式块
    if (trim.startsWith('$$')) {
      if (trim.length > 4 && trim.endsWith('$$')) {
        blocks.push({ t: 'math', text: trim.slice(2, -2).trim() });
        i++;
        continue;
      }
      const buf: string[] = [trim.slice(2)];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        buf.push(lines[i].trim().replace(/\$\$$/, ''));
        i++;
      }
      blocks.push({ t: 'math', text: buf.join('\n').trim() });
      continue;
    }

    if (trim.startsWith('### ')) {
      blocks.push({ t: 'h3', text: trim.slice(4) });
      i++;
      continue;
    }
    if (trim.startsWith('#### ')) {
      blocks.push({ t: 'h4', text: trim.slice(5) });
      i++;
      continue;
    }

    // 表格
    if (trim.startsWith('|') && trim.endsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = splitRow(lines[i]);
        if (!row.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(row);
        i++;
      }
      blocks.push({ t: 'table', rows });
      continue;
    }

    // 引用
    if (trim.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ t: 'quote', lines: buf });
      continue;
    }

    // 无序列表
    if (/^[-*]\s+/.test(trim)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ t: 'ul', items });
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trim)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ t: 'ol', items });
      continue;
    }

    // 段落（合并连续非空行）
    const para: string[] = [trim];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(###|####|>|[-*]\s|\d+\.\s|\||\$\$|\[\[tree\]\])/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ t: 'p', text: para.join('') });
  }
  return blocks;
}

export function Prose({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseBlocks(text), [text]);
  let h3idx = 0;

  return (
    <div className="lesson-prose">
      {blocks.map((b, i) => {
        const key = `b${i}`;
        switch (b.t) {
          case 'h3': {
            h3idx += 1;
            return (
              <h3 key={key} data-idx={String(h3idx).padStart(2, '0')}>
                {b.text}
              </h3>
            );
          }
          case 'h4':
            return <h4 key={key}>{b.text}</h4>;
          case 'p':
            return <p key={key}>{inline(b.text, key)}</p>;
          case 'ul':
            return (
              <ul key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{inline(it, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key}>
                {b.items.map((it, j) => (
                  <li key={`${key}-${j}`}>{inline(it, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'quote':
            return (
              <blockquote key={key}>
                {b.lines.map((ln, j) => (
                  <p key={`${key}-${j}`}>{inline(ln, `${key}-${j}`)}</p>
                ))}
              </blockquote>
            );
          case 'math':
            return (
              <div key={key} className="math-block" dangerouslySetInnerHTML={{ __html: mathHtml(b.text, true) }} />
            );
          case 'table':
            return (
              <div key={key} className="tbl">
                <table>
                  {b.rows[0] && (
                    <thead>
                      <tr>
                        {b.rows[0].map((c, j) => (
                          <th key={`${key}-h-${j}`}>{inline(c, `${key}-h-${j}`)}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.slice(1).map((r, ri) => (
                      <tr key={`${key}-r-${ri}`}>
                        {r.map((c, ci) => (
                          <td key={`${key}-r-${ri}-${ci}`}>{inline(c, `${key}-r-${ri}-${ci}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'tree':
            return <TreeView key={key} text={b.text} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

interface TreeNode {
  text: string;
  children: TreeNode[];
}

function parseTree(text: string): TreeNode[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const roots: TreeNode[] = [];
  const stack: { indent: number; node: TreeNode }[] = [];
  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    const node: TreeNode = { text: line.trim(), children: [] };
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else roots.push(node);
    stack.push({ indent, node });
  }
  return roots;
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const m = node.text.match(/^(.*?)(?:\s*→\s*)(\([^)]*\))$/);
  return (
    <li className="gtl-tree-item">
      <span className="gtl-tree-label">
        {m ? (
          <>
            <span>{m[1]}</span>
            <span className="gtl-tree-payoff">{m[2]}</span>
          </>
        ) : (
          <span>{node.text}</span>
        )}
      </span>
      {node.children.length > 0 && (
        <ul className="gtl-tree-children">
          {node.children.map((c, i) => (
            <TreeItem key={i} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TreeView({ text }: { text: string }) {
  const roots = React.useMemo(() => parseTree(text), [text]);
  return (
    <div className="my-5 border border-line bg-[#FBFBF8] px-4 py-3.5">
      <div className="label-copper mb-2">GAME TREE</div>
      <ul className="gtl-tree">
        {roots.map((r, i) => (
          <TreeItem key={i} node={r} depth={0} />
        ))}
      </ul>
    </div>
  );
}
