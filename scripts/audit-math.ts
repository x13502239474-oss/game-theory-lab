// 检查正文/题目中是否存在「无法被行内解析器识别」的 $ 公式（会以原文显示）
import { ALL_LESSONS } from '../src/data/curriculum';
import { CASES } from '../src/data/cases';
import { DAILY_GAMES } from '../src/data/daily';

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

// 案例库：除 id/domain/year/tags/lessons 外都是可渲染文本
let caseTotal = 0;
for (const c of CASES) {
  const fields = [c.background, c.payoffs, c.model, c.equilibrium, c.reality, c.gap];
  const hits = [
    ...fields.flatMap((f) => leaks(f)),
    ...c.interests.flatMap((f) => leaks(f)),
    ...c.strategies.flatMap((f) => leaks(f)),
    ...c.players.flatMap((p) => leaks(p.role)),
  ];
  if (hits.length) {
    caseTotal += hits.length;
    console.log(`案例 ${c.id} ${hits.length} 处`);
    hits.slice(0, 3).forEach((h) => console.log('   ·', h));
  }
}
console.log(caseTotal ? `*** 案例库共 ${caseTotal} 处会显示成原文 ***` : '案例库公式可解析 ✓');

// 每日博弈：analysis / verdict
let dailyTotal = 0;
for (const g of DAILY_GAMES) {
  const hits = [...leaks(g.analysis), ...leaks(g.verdict)];
  if (hits.length) {
    dailyTotal += hits.length;
    console.log(`每日博弈 ${g.id ?? ''} ${hits.length} 处`);
    hits.slice(0, 2).forEach((h) => console.log('   ·', h));
  }
}
console.log(dailyTotal ? `*** 每日博弈共 ${dailyTotal} 处会显示成原文 ***` : '每日博弈公式可解析 ✓');
