import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'posts')
const PINNED_SLUGS = ['welcome']

/**
 * 生成智能摘要，过滤掉图片、视频、代码块等内容
 */
function generateExcerpt(content: string, maxLength: number = 150): string {
  // 移除 frontmatter
  let text = content.replace(/^---[\s\S]*?---/, '')
  
  // 移除代码块（包括数学公式块）
  text = text.replace(/```[\s\S]*?```/g, '')
  
  // 移除 HTML 标签（video, iframe, img 等）
  text = text.replace(/<[^>]*>/g, '')
  
  // 移除图片 Markdown 语法 ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
  
  // 移除链接但保留文本 [text](url) -> text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  
  // 移除行内代码
  text = text.replace(/`[^`]*`/g, '')
  
  // 移除标题标记
  text = text.replace(/^#{1,6}\s+/gm, '')
  
  // 移除列表标记
  text = text.replace(/^[\s]*[-*+]\s+/gm, '')
  text = text.replace(/^[\s]*\d+\.\s+/gm, '')
  
  // 移除引用标记
  text = text.replace(/^>\s+/gm, '')
  
  // 移除多余的空白行
  text = text.replace(/\n\s*\n/g, '\n')
  
  // 移除行首行尾空白
  text = text.trim()
  
  // 提取前几句话（以句号、问号、感叹号结尾）
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 0)
  
  let excerpt = ''
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length === 0) continue
    
    if (excerpt.length + trimmed.length <= maxLength) {
      excerpt += trimmed + '。'
    } else {
      // 如果加上这句话会超出限制，就截断
      if (excerpt.length === 0) {
        excerpt = trimmed.substring(0, maxLength) + '...'
      }
      break
    }
  }
  
  // 如果没有提取到任何内容，使用截断的方式
  if (excerpt.length === 0 && text.length > 0) {
    excerpt = text.substring(0, maxLength).trim() + '...'
  }
  
  return excerpt || '暂无摘要'
}

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  content: string
  tags: string[]
  readTime: string
}

export function getAllPosts(): Post[] {
  // 确保目录存在
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPosts = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || generateExcerpt(content, 120),
        content,
        tags: data.tags || [],
        readTime: data.readTime || '5分钟',
      }
    })

  // 按日期排序，并将特定文章置顶
  return allPosts.sort((a, b) => {
    const aPinnedIndex = PINNED_SLUGS.indexOf(a.slug)
    const bPinnedIndex = PINNED_SLUGS.indexOf(b.slug)

    const aPinned = aPinnedIndex !== -1
    const bPinned = bPinnedIndex !== -1

    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    if (aPinned && bPinned) return aPinnedIndex - bPinnedIndex

    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || slug,
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || '',
      content,
      tags: data.tags || [],
      readTime: data.readTime || '5分钟',
    }
  } catch {
    return null
  }
}
