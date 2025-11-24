---
title: Next.js 入门指南：构建现代 Web 应用
date: 2024-01-20
excerpt: 深入了解 Next.js 框架，学习如何构建高性能的 React 应用。
tags: ['Next.js', 'React', '教程']
readTime: 8分钟
---

# Next.js 入门指南

Next.js 是一个强大的 React 框架，它为我们提供了许多开箱即用的功能，让构建现代 Web 应用变得更加简单。

## 什么是 Next.js？

Next.js 是由 Vercel 开发的 React 框架，它提供了：

- **服务端渲染 (SSR)** - 提高首屏加载速度和 SEO
- **静态站点生成 (SSG)** - 预渲染页面，获得最佳性能
- **增量静态再生 (ISR)** - 在运行时更新静态内容
- **文件系统路由** - 基于文件的直观路由系统
- **API 路由** - 轻松创建 API 端点

## 安装和设置

创建一个新的 Next.js 项目非常简单：

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

## 核心概念

### 1. 页面和路由

在 Next.js 中，`app` 目录下的每个文件都会自动成为一个路由：

```typescript
// app/page.tsx - 对应 '/'
export default function Home() {
  return <h1>首页</h1>
}

// app/about/page.tsx - 对应 '/about'
export default function About() {
  return <h1>关于页面</h1>
}
```

### 2. 服务端组件

Next.js 13+ 默认使用服务端组件，这意味着组件在服务器上渲染：

```typescript
export default async function Posts() {
  const posts = await fetchPosts() // 在服务器端执行
  return (
    <div>
      {posts.map(post => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  )
}
```

### 3. 数据获取

Next.js 提供了多种数据获取方式：

```typescript
// 静态生成
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map(post => ({ slug: post.slug }))
}

// 服务端渲染
export default async function Page({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}
```

## 最佳实践

1. **使用服务端组件** - 除非需要交互性，否则优先使用服务端组件
2. **优化图片** - 使用 Next.js 的 Image 组件自动优化图片
3. **代码分割** - Next.js 自动为每个页面进行代码分割
4. **使用 TypeScript** - 获得更好的类型安全和开发体验

## 总结

Next.js 是一个功能强大且易于使用的框架，非常适合构建各种规模的 Web 应用。无论是个人博客还是大型企业应用，Next.js 都能提供出色的性能和开发体验。

## 参考资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Vercel 部署指南](https://vercel.com/docs)

希望这篇指南对你有所帮助！继续探索 Next.js 的更多功能吧。
