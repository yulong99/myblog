import { Mail, Github, Twitter } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl text-white font-bold">王</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">关于我</h1>
          <p className="text-xl text-gray-600">算法研究者 · 论文阅读者 · 技术探索者</p>
        </div>

        {/* Bio */}
        <div className="prose-custom max-w-none mb-12">
          <h2>你好！👋</h2>
          <p>
            欢迎来到我的学术博客。我是王宇龙，专注于计算机视觉、深度学习和算法研究。
            我通过这个博客记录论文阅读笔记、算法分析和技术思考。
          </p>
          
          <h2>我的技能</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 not-prose">
            {['Python', 'PyTorch', 'C++', '3D Vision', 'Deep Learning', 'Algorithms'].map((skill) => (
              <div 
                key={skill}
                className="bg-primary-50 text-primary-700 rounded-lg px-4 py-3 text-center font-medium"
              >
                {skill}
              </div>
            ))}
          </div>

          <h2>为什么写博客？</h2>
          <p>
            写博客帮助我系统地整理论文阅读笔记，深化对算法原理的理解。
            记录研究过程和技术思考，既是自我提升的方式，也希望能为同行提供参考。
          </p>

          <h2>联系我</h2>
          <p>
            如果你想和我交流或合作，欢迎通过以下方式联系我：
          </p>
        </div>

        {/* Contact Links */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a 
            href="mailto:wyl18211988@163.com"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            邮件联系
          </a>
          <a 
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Github className="w-5 h-5" />
            GitHub
          </a>
          <a 
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <Twitter className="w-5 h-5" />
            Twitter
          </a>
        </div>
      </div>
    </div>
  )
}
