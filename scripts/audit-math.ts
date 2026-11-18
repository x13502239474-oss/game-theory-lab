// 检查正文/题目中是否存在「无法被行内解析器识别」的 $ 公式（会以原文显示）
import { ALL_LESSONS } from '../src/data/curriculum';

const SPLIT = /(\*\*[^*]+\*\*|\$[^$\n]+\$|`[^`]+`)/g;

function leaks(raw: string, depth = 0): string[] {
  const out: string[] = [];
  const text = raw.replace(/\$\$[\s\S]*?\$\$/g, '');
  const parts = text.split(SPLIT).filter(Boolean);
  for (const p of parts) {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) {
      if (depth < 3) out.push(...leaks(p.slice(2, -2), depth + 1));
      continue;
    }
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) continue;
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) continue;
    if (p.includes('$')) out.push(p.trim().slice(0, 70));
  }
  return out;
}

let total = 0;
for (const l of ALL_LESSONS) {
  const hits = leaks(l.content);
  l.quiz.forEach((q) => {
    [...hits, ...leaks(q.stem), ...leaks(q.explanation)].forEach(() => {});
  });
  const qHits = l.quiz.flatMap((q) => [...leaks(q.stem), ...leaks(q.explanation)]);
  if (hits.length || qHits.length) {
    total += hits.length + qHits.length;
    console.log(`${l.id} 正文 ${hits.length} 处 / 题目 ${qHits.length} 处`);
    [...hits, ...qHits].slice(0, 3).forEach((h) => console.log('   ·', h));
  }
}
console.log(total ? `*** 共 ${total} 处会显示成原文 ***` : '全部公式可解析 ✓');
