# 我的学术博客

一个专业的学术/技术博客，支持论文笔记、算法分析、代码高亮、数学公式、图片和视频。基于 Next.js 14、TypeScript 和 Tailwind CSS 构建。

![Blog Preview](https://via.placeholder.com/800x400?text=Academic+Blog)

## ✨ 特性

### 核心功能
- 🎨 **简约学术风格** - 优雅的排版，专业的阅读体验
- ⚡ **高性能** - 基于 Next.js 14 的服务端渲染和静态生成
- 📝 **Markdown 支持** - 使用 Markdown 编写文章，支持 GFM
- 🏷️ **标签系统** - 文章分类和标签
- 📱 **响应式设计** - 完美支持各种设备
- 🎯 **TypeScript** - 类型安全的代码
- 🚀 **易于部署** - 一键部署到 Vercel

### 学术功能
- 📊 **数学公式** - 完整的 LaTeX/KaTeX 支持
- 💻 **代码高亮** - 多语言语法高亮（Python, C++, JavaScript 等）
- 🖼️ **图片支持** - 本地和外部图片，自动优化
- 🎥 **视频嵌入** - 支持本地视频、YouTube、Bilibili
- 📊 **表格支持** - 美观的表格样式
- 📖**引用块** - 高亮显示重要内容

## 🛠️ 技术栈

### 核心框架
- [Next.js 14](https://nextjs.org/) - React 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

### 内容处理
- [Marked](https://marked.js.org/) - Markdown 解析器
- [Marked Highlight](https://github.com/markedjs/marked-highlight) - 代码高亮插件
- [Highlight.js](https://highlightjs.org/) - 语法高亮引擎
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Gray Matter](https://github.com/jonschlinkert/gray-matter) - Markdown 元数据解析

### 工具库
- [Lucide React](https://lucide.dev/) - 图标库
- [date-fns](https://date-fns.org/) - 日期处理

## 📦 安装

1. 克隆仓库或下载代码

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 📝 添加文章

### 基本文章

在 `posts` 目录下创建新的 `.md` 文件：

```markdown
---
title: 你的文章标题
date: 2025-11-09
excerpt: 文章摘要，会显示在列表页
tags: ['论文', '算法']
readTime: 10分钟
---

# 你的文章内容

这里开始写作...
```

### 插入图片

1. 将图片放入 `public/images/` 目录
2. 在 Markdown 中引用：

```markdown
![图片描述](/images/your-image.jpg)
```

### 插入视频

**本地视频**：
```html
<video controls width="100%">
  <source src="/videos/your-video.mp4" type="video/mp4">
</video>
```

**YouTube**：
```html
<iframe width="100%" height="400" 
        src="https://www.youtube.com/embed/VIDEO_ID" 
        frameborder="0" allowfullscreen>
</iframe>
```

### 数学公式

**行内公式**：`$E = mc^2$`

**公式块**：
````markdown
```math
\int_{a}^{b} f(x) dx = F(b) - F(a)
```
````

### 代码高亮

````markdown
```python
def hello_world():
    print("Hello, World!")
```
````

支持语言：`python`, `javascript`, `typescript`, `cpp`, `java`, `go`, `rust`, `bash` 等

## 📂 项目结构

```
myblog/
├── app/                    # Next.js 应用目录
│   ├── about/             # 关于页面
│   ├── posts/[slug]/      # 文章详情页（动态路由）
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── Header.tsx         # 头部组件
│   └── Footer.tsx         # 底部组件
├── lib/                   # 工具函数
│   └── posts.ts           # 文章处理逻辑
├── posts/                 # Markdown 文章目录
│   ├── welcome.md
│   ├── next-js-guide.md
│   └── typescript-tips.md
├── public/                # 静态资源
├── package.json           # 项目依赖
├── tsconfig.json          # TypeScript 配置
├── tailwind.config.js     # Tailwind 配置
└── next.config.js         # Next.js 配置
```

## 🎨 自定义

### 修改主题颜色

编辑 `tailwind.config.js` 中的颜色配置：

```js
theme: {
  extend: {
    colors: {
      primary: {
        // 修改这里的颜色值
        500: '#0ea5e9',
        600: '#0284c7',
        // ...
      },
    },
  },
}
```

### 修改网站信息

1. 编辑 `app/layout.tsx` 修改网站标题和描述
2. 编辑 `components/Header.tsx` 修改导航链接
3. 编辑 `app/about/page.tsx` 修改关于页面内容

## 🚀 部署

### 部署到 Vercel（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入你的仓库
3. Vercel 会自动检测 Next.js 项目并完成部署

### 构建生产版本

```bash
npm run build
npm start
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

- Email: your@email.com
- GitHub: [@yourusername](https://github.com/yourusername)

---

针对论文阅读和算法研发的专业博客 📚

用 ❤️ 构建
