import { ALL_LESSONS, STAGES, QUESTION_MAP } from '../src/data/curriculum';
import { CASES } from '../src/data/cases';
import { GRAPH_NODES, GRAPH_EDGES } from '../src/data/graph';
import { LABS } from '../src/labs';
import { DAILY_GAMES } from '../src/data/daily';

const problems: string[] = [];
const warn: string[] = [];

// 1. 课程结构
let q = 0;
ALL_LESSONS.forEach((l, i) => {
  if (l.no !== i + 1) problems.push(`课程序号不连续：${l.id} no=${l.no} 期望 ${i + 1}`);
  if (!l.content.trim()) problems.push(`${l.id} 无正文`);
  if (l.content.length < 600) warn.push(`${l.id} 正文偏短 (${l.content.length} 字)`);
  if (!l.quiz.length) problems.push(`${l.id} 无练习`);
  if (l.quiz.length < 3) warn.push(`${l.id} 练习少于 3 题 (${l.quiz.length})`);
  if (!l.source) problems.push(`${l.id} 缺少来源标注`);
  if (!l.goals.length) problems.push(`${l.id} 缺少学习目标`);

  // 数学定界符成对
  const dollars = (l.content.match(/\$/g) || []).length;
  if (dollars % 2 !== 0) problems.push(`${l.id} 正文 $ 数量为奇数 (${dollars})——可能有未闭合公式`);
  if (l.content.includes('[[tree]]') && !l.content.includes('[[/tree]]')) problems.push(`${l.id} tree 块未闭合`);

  // 表格分隔行
  const lines = l.content.split('\n');
  lines.forEach((ln, idx) => {
    if (/^\|\s*-{2,}/.test(ln.trim())) {
      const prev = lines[idx - 1] ?? '';
      const cols = ln.split('|').length;
      const pcols = prev.split('|').length;
      if (cols !== pcols) problems.push(`${l.id} 表格列数不一致：行 ${idx + 1} (${cols} vs ${pcols})`);
    }
  });

  l.quiz.forEach((x) => {
    q++;
    if (QUESTION_MAP[x.id]?.id !== x.id) problems.push(`题目 ${x.id} 未登记`);
    if (!x.explanation) problems.push(`题目 ${x.id} 缺解析`);
    if (x.qtype === 'single' || x.qtype === 'multi') {
      if (!x.options || x.options.length < 2) problems.push(`题目 ${x.id} 选项不足`);
      const letters = (x.options ?? []).map((o) => o.trim()[0]);
      const ans = Array.isArray(x.answer) ? x.answer : [String(x.answer)];
      ans.forEach((a) => {
        if (!letters.includes(a)) problems.push(`题目 ${x.id} 答案 ${a} 不在选项 ${letters.join('')} 中`);
      });
      (x.options ?? []).forEach((o, oi) => {
        const expected = String.fromCharCode(65 + oi);
        if (o.trim()[0] !== expected) problems.push(`题目 ${x.id} 选项前缀应为 ${expected}：${o.slice(0, 12)}`);
      });
    }
    if (x.qtype === 'judge' && typeof x.answer !== 'boolean') problems.push(`题目 ${x.id} 判断题答案非布尔`);
    if (x.qtype === 'scenario') {
      if (!x.keywords || x.keywords.length < 2) problems.push(`题目 ${x.id} 情景题缺少要点组`);
    }
  });
});

// 2. 案例：引用完整性 + 案例题
const lessonIds = new Set(ALL_LESSONS.map((l) => l.id));
let cq = 0;
CASES.forEach((c) => {
  c.lessons.forEach((id) => {
    if (!lessonIds.has(id)) problems.push(`案例 ${c.id} 引用了不存在的课程 ${id}`);
  });
  (c.quiz ?? []).forEach((x) => {
    cq++;
    if (QUESTION_MAP[x.id]?.id !== x.id) problems.push(`案例题 ${x.id} 未登记`);
    if (!x.explanation) problems.push(`案例题 ${x.id} 缺解析`);
    if (x.qtype !== 'scenario') problems.push(`案例题 ${x.id} 应为情景题 (${x.qtype})`);
    if (!x.keywords || x.keywords.length < 2) problems.push(`案例题 ${x.id} 缺少要点组`);
  });
});
GRAPH_NODES.forEach((n) => {
  n.lessons.forEach((id) => {
    if (!lessonIds.has(id)) problems.push(`图谱节点 ${n.id} 引用不存在课程 ${id}`);
  });
  (n.cases ?? []).forEach((id) => {
    if (!CASES.find((c) => c.id === id)) problems.push(`图谱节点 ${n.id} 引用不存在案例 ${id}`);
  });
});
GRAPH_EDGES.forEach(([a, b]) => {
  if (!GRAPH_NODES.find((n) => n.id === a)) problems.push(`边起点不存在：${a}`);
  if (!GRAPH_NODES.find((n) => n.id === b)) problems.push(`边终点不存在：${b}`);
});
LABS.forEach((l) => {
  l.lessons.forEach((id) => {
    if (!lessonIds.has(id)) problems.push(`实验 ${l.id} 引用不存在课程 ${id}`);
  });
});
DAILY_GAMES.forEach((d) => {
  if (!lessonIds.has(d.lessonId)) problems.push(`每日博弈 ${d.id} 引用不存在课程 ${d.lessonId}`);
  if (d.options.length < 2) problems.push(`每日博弈 ${d.id} 选项不足`);
});

// 3. 阶段课时数
STAGES.forEach((s) => {
  if (s.lessons.length !== 8) problems.push(`阶段 ${s.no} 课时数 ${s.lessons.length} != 8`);
});

console.log('课程数：', ALL_LESSONS.length, '｜课程题：', q, '｜案例题：', cq);
console.log('案例：', CASES.length, '｜图谱节点：', GRAPH_NODES.length, '｜边：', GRAPH_EDGES.length);
console.log('实验：', LABS.length, '｜每日博弈：', DAILY_GAMES.length);
console.log('---');
if (warn.length) console.log('提示：\n' + warn.join('\n'));
if (problems.length) {
  console.log('*** 问题 ' + problems.length + ' 项 ***');
  console.log(problems.join('\n'));
  process.exit(1);
} else {
  console.log('全部校验通过 ✓');
}
