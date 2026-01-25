const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOTS = [
  path.resolve('e:/windsurf'),
  path.resolve('d:/SMPL'),
];

const INCLUDE_DIR_KEYWORDS = [
  '2d-gaussian-splatting',
  'DashGaussian',
  'FastGS',
  'Feat2GS',
  'GStex',
  'AnimatableGaussians',
  'Human3Diffusion',
  'DressRecon',
  'MAtCha',
  'EscherNet',
  'Gaussian-Garments',
  'Garment3DGen',
  'GS2Mesh',
  'SyncHuman',
  'WiLoR',
  'NICP',
  'paper',
];

const PAPER_KEYWORDS = [
  '论文',
  'paper',
  '阅读笔记',
  '中文翻译',
  '技术概述',
];

const POSTS_DIR = path.join(process.cwd(), 'posts');

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }
}

function isCandidateDir(dir) {
  const lower = dir.toLowerCase();
  return INCLUDE_DIR_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function isPaperNoteFile(filePath) {
  if (!filePath.endsWith('.md')) return false;
  const lower = filePath.toLowerCase();
  return PAPER_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function slugifyFromPath(filePath) {
  const base = path.basename(filePath, '.md');
  return base
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function detectTitle(content, fallback) {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  return fallback;
}

function cleanContent(raw) {
  let text = raw;

  text = text.replace(/<span class=\"hljs-[^>]*>/g, '');
  text = text.replace(/<\/span>/g, '');

  text = text.replace(/```(\w+)\n([\s\S]*?)```/g, (match, lang, body) => {
    const decoded = body
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    return '```' + lang + '\n' + decoded + '\n```';
  });

  text = text.replace(/^\s*\$\$(.+?)\$\$\s*$/gm, (_m, inner) => {
    return '```math\n' + inner.trim() + '\n```';
  });

  return text.trim() + '\n';
}

function createFrontmatter(originalPath, content) {
  const baseTitle = path.basename(originalPath, '.md');
  const title = detectTitle(content, baseTitle);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const tags = [];
  if (/3dgs/i.test(content)) tags.push('3DGS');
  if (/gaussian/i.test(content)) tags.push('Gaussian');
  if (/论文|paper/.test(content)) tags.push('论文');

  const fmObj = {
    title,
    date: dateStr,
    excerpt: '',
    tags,
    readTime: '30分钟',
  };

  return matter.stringify(content, fmObj);
}

function collectPaperNotes() {
  const results = [];

  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;

    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      let stat;
      try {
        stat = fs.statSync(current);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        if (!isCandidateDir(current) && current !== root) continue;

        const entries = fs.readdirSync(current);
        for (const name of entries) {
          if (name === 'node_modules' || name === '.git' || name === '.next') continue;
          stack.push(path.join(current, name));
        }
      } else if (stat.isFile()) {
        if (isPaperNoteFile(current)) {
          results.push(current);
        }
      }
    }
  }

  return Array.from(new Set(results));
}

function main() {
  ensurePostsDir();

  const files = collectPaperNotes();
  if (files.length === 0) {
    console.log('未找到论文解读类 Markdown 文件');
    return;
  }

  console.log(`找到候选文件 ${files.length} 个`);

  for (const src of files) {
    const slug = slugifyFromPath(src);
    const dest = path.join(POSTS_DIR, `${slug}.md`);

    const raw = fs.readFileSync(src, 'utf8');
    const cleaned = cleanContent(raw);
    const withFrontmatter = createFrontmatter(src, cleaned);

    fs.writeFileSync(dest, withFrontmatter, 'utf8');
    console.log(`同步: ${src} -> ${dest}`);
  }

  console.log('同步完成。请运行 `npm run dev` 查看文章效果。');
}

main();
