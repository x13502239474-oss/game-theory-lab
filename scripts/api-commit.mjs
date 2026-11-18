// 当 git push 被网络阻断时，用 GitHub Git Data API 提交指定文件
// 用法：node scripts/api-commit.mjs <branch> <localPath:repoPath> [more...]
// 注意：Tree API 的 content 字段要原始 UTF-8 文本，二进制/任意内容必须先建 blob。
import fs from 'node:fs';
import path from 'node:path';

const TOKEN = process.env.GH_TOKEN;
const REPO = 'x13502239474-oss/game-theory-lab';
const [branch, ...specs] = process.argv.slice(2);
if (!TOKEN || !branch || specs.length === 0) {
  console.error('缺少参数或 GH_TOKEN');
  process.exit(1);
}

const API = `https://api.github.com/repos/${REPO}`;
const H = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'User-Agent': 'gtl-deploy',
};

async function gh(method, url, body) {
  const r = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const ref = await gh('GET', `${API}/git/ref/heads/${branch}`);
const parentSha = ref.object.sha;
const parent = await gh('GET', `${API}/git/commits/${parentSha}`);

const tree = [];
for (const spec of specs) {
  const idx = spec.lastIndexOf(':');
  const [local, remote] = idx > 0 ? [spec.slice(0, idx), spec.slice(idx + 1)] : [spec, spec];
  const buf = fs.readFileSync(path.resolve(local));
  // 先建 blob（base64 编码声明），再引用其 sha —— 避免把 base64 文本写进文件
  const blob = await gh('POST', `${API}/git/blobs`, {
    content: buf.toString('base64'),
    encoding: 'base64',
  });
  tree.push({ path: remote.split(path.sep).join('/'), mode: '100644', type: 'blob', sha: blob.sha });
}

const newTree = await gh('POST', `${API}/git/trees`, { base_tree: parent.tree.sha, tree });
const commit = await gh('POST', `${API}/git/commits`, {
  message: `deploy: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} 更新 ${tree.length} 个文件`,
  tree: newTree.sha,
  parents: [parentSha],
});
await gh('PATCH', `${API}/git/refs/heads/${branch}`, { sha: commit.sha });
console.log(`✓ ${branch} → ${commit.sha.slice(0, 7)}（${tree.length} 个文件）`);
