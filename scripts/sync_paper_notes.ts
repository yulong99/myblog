import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 需要扫描的根目录（限定在已打开的 workspace 内）
const ROOTS = [
  path.resolve('e:/windsurf'),
  path.resolve('d:/SMPL'),
];

// 仅在这些子目录下查找论文相关 md，避免全盘过大扫描
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

// 文件名或路径中包含这些关键词的 md 会被认为是论文解读
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

function isCandidateDir(dir: string): boolean {
  return INCLUDE_DIR_KEYWORDS.some(k => dir.toLowerCase().includes(k.toLowerCase()));
}

function isPaperNoteFile(filePath: string): boolean {
  if (!filePath.endsWith('.md')) return false;
  const lower = filePath.toLowerCase();
  return PAPER_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

function slugifyFromPath(filePath: string): string {
  const base = path.basename(filePath, '.md');
  // 保留中文，替换空格和特殊字符
  return base
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function detectTitle(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].trim();
  return fallback;
}

function cleanContent(raw: string): string {
  let text = raw;

  // 1) 移除可能残留的 highlight.js HTML（从复制页面时带来的 span 标签）
  text = text.replace(/<span class=\"hljs-[^>]*>/g, '');
  text = text.replace(/<\/span>/g, '');

  // 2) 修复被错误包含为 ```python\n<code>...</code>``` 这类 HTML 代码块
  text = text.replace(/```(\w+)\n([\s\S]*?)```/g, (match, lang, body) => {
    // 如果 body 中大量出现 &lt; 或 &gt;，认为是 HTML 被转义的代码，直接还原实体
    const decoded = body
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    return '```' + lang + '\n' + decoded + '\n```';
  });

  // 3) 保证块级公式用 ```math```/```latex``` 包住 $$...$$ 内容（简单启发式，不强制）
  // 若发现单独一行是 $$...$$，转换为 math 代码块
  text = text.replace(/^\s*\$\$(.+?)\$\$\s*$/gm, (_m, inner) => {
    return '```math\n' + inner.trim() + '\n```';
  });

  return text.trim() + '\n';
}

function createFrontmatter(originalPath: string, content: string): string {
  const baseTitle = path.basename(originalPath, '.md');
  const title = detectTitle(content, baseTitle);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const tags: string[] = [];
  if (/3dgs/i.test(content)) tags.push('3DGS');
  if (/gaussian/i.test(content)) tags.push('Gaussian');
  if (/论文|paper/.test(content)) tags.push('论文');

  const fmObj: Record<string, any> = {
    title,
    date: dateStr,
    excerpt: '',
    tags,
    readTime: '30分钟',
  };

  const fm = matter.stringify(content, fmObj);
  return fm;
}

function collectPaperNotes(): string[] {
  const results: string[] = [];

  for (const root of ROOTS) {
    if (!fs.existsSync(root)) continue;

    const stack: string[] = [root];
    while (stack.length) {
      const current = stack.pop()!;
      let stat: fs.Stats;
      try {
        stat = fs.statSync(current);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        // 只在包含关键字的目录下深入扫描，以控制范围
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
