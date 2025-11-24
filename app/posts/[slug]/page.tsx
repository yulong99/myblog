import { getPostBySlug, getAllPosts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react'
import { format } from 'date-fns'
import zhCN from 'date-fns/locale/zh-CN'
import Link from 'next/link'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import katex from 'katex'

// 配置代码高亮
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code: string, lang: string) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  }
}))

// 配置 marked 支持 GFM 和数学公式
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 自定义渲染器支持 KaTeX
const renderer = new marked.Renderer()
const originalCodeRenderer = renderer.code.bind(renderer)

renderer.code = function(code: string, language?: string) {
  // 检查是否是数学公式块
  if (language === 'math' || language === 'latex') {
    try {
      return katex.renderToString(code, {
        displayMode: true,
        throwOnError: false
      })
    } catch (e) {
      return `<pre><code>${code}</code></pre>`
    }
  }
  return originalCodeRenderer(code, language || '', false)
}

marked.use({ renderer })

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

interface PageProps {
  params: {
    slug: string
  }
}

export default function PostPage({ params }: PageProps) {
  const post = getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const parsedDate = new Date(post.date)
  const displayDate = Number.isNaN(parsedDate.getTime())
    ? '日期未知'
    : format(parsedDate, 'yyyy年MM月dd日', { locale: zhCN })

  const htmlContent = marked.parse(post.content) as string

  return (
    <article className="max-w-5xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        返回首页
      </Link>

      {/* Post Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          {post.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-5 h-5 text-gray-500" />
            {post.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Post Content */}
      <div 
        className="prose-custom max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Share Section */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-center text-gray-600">
          如果你喜欢这篇文章，欢迎分享给更多人
        </p>
      </div>
    </article>
  )
}
