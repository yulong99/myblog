import Link from 'next/link'
import { Home, BookOpen, User, Github } from 'lucide-react'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">王宇龙的博客</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">首页</span>
            </Link>
            
            <Link 
              href="/about" 
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">关于</span>
            </Link>
            
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}
