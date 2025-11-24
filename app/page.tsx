import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import zhCN from 'date-fns/locale/zh-CN'

export default function Home() {
  const posts = getAllPosts()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          王宇龙的博客
        </h1>
        <p className="text-xl text-gray-600">
          论文阅读 · 算法研究 · 技术思考
        </p>
      </section>

      {/* Blog Posts List */}
      <section>
        <h2 className="text-3xl font-bold mb-8 text-gray-900">最新文章</h2>
        <div className="space-y-8">
          {posts.map((post) => (
            <article 
              key={post.slug}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <Link href={`/posts/${post.slug}`}>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 hover:text-primary-600 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(post.date), 'yyyy年MM月dd日', { locale: zhCN })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2 text-justify">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link 
                    href={`/posts/${post.slug}`}
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium group"
                  >
                    阅读更多
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
