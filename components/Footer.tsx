import { Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-gray-600 flex items-center gap-2">
            使用
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            构建 · 基于 Next.js & Tailwind CSS
          </p>
          <p className="text-sm text-gray-500">
            © {currentYear} 我的博客 · 保留所有权利
          </p>
        </div>
      </div>
    </footer>
  )
}
