import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SplashScreen from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: '王宇龙的博客',
  description: '论文阅读、算法研究与技术思考的学术博客',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <SplashScreen>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </SplashScreen>
      </body>
    </html>
  )
}
