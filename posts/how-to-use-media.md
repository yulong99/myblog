---
title: 博客使用指南：图片、视频和公式
date: 2025-11-09
excerpt: 详细介绍如何在博客中插入图片、视频、代码和数学公式。
tags: ['教程', '使用指南']
readTime: 5分钟
---

# 博客使用指南：图片、视频和公式

这篇文章将教你如何在博客中使用各种富媒体内容。

## 📸 插入图片

### 方法 1：本地图片

将图片放在 `public/images` 文件夹下，然后使用相对路径引用：

```markdown
![图片描述](/images/your-image.jpg)
```

### 方法 2：外部图片

直接使用图片 URL：

```markdown
![图片描述](https://example.com/image.jpg)
```

### 示例

![示例图片](https://picsum.photos/800/400)

## 🎥 嵌入视频

### 本地视频

将视频文件放在 `public/videos` 文件夹下：

```html
<video controls width="100%">
  <source src="/videos/your-video.mp4" type="video/mp4">
  您的浏览器不支持视频播放
</video>
```

### YouTube 视频

```html
<iframe width="100%" height="400" 
        src="https://www.youtube.com/embed/VIDEO_ID" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

### Bilibili 视频

```html
<iframe width="100%" height="400"
        src="//player.bilibili.com/player.html?bvid=BV_ID"
        scrolling="no" 
        border="0" 
        frameborder="no" 
        framespacing="0" 
        allowfullscreen="true">
</iframe>
```

## 💻 代码高亮

### 行内代码

使用单个反引号：`const x = 10`

### 代码块

使用三个反引号并指定语言：

````markdown
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```
````

效果：

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

支持的语言包括：`python`, `javascript`, `typescript`, `java`, `cpp`, `c`, `go`, `rust`, `bash` 等。

## 📐 数学公式

### 行内公式

使用单个 `$` 包裹：这是行内公式 $E = mc^2$

### 公式块

使用代码块语法，语言指定为 `math`：

````markdown
```math
\int_{a}^{b} f(x) dx = F(b) - F(a)
```
````

效果：

```math
\int_{a}^{b} f(x) dx = F(b) - F(a)
```

### 更多公式示例

**矩阵**：

```math
A = \begin{bmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{bmatrix}
```

**求和**：

```math
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
```

**分数**：

```math
f(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}
```

## 📊 表格

使用 Markdown 表格语法：

```markdown
| 算法 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 快速排序 | O(n log n) | O(log n) |
| 归并排序 | O(n log n) | O(n) |
| 冒泡排序 | O(n²) | O(1) |
```

效果：

| 算法 | 时间复杂度 | 空间复杂度 |
|------|-----------|-----------|
| 快速排序 | O(n log n) | O(log n) |
| 归并排序 | O(n log n) | O(n) |
| 冒泡排序 | O(n²) | O(1) |

## 💡 引用块

```markdown
> 这是一个引用块
> 可以包含多行内容
```

效果：

> "Programs must be written for people to read, and only incidentally for machines to execute."
> 
> — Harold Abelson

## ✅ 列表

### 无序列表

```markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3
```

### 有序列表

```markdown
1. 第一步
2. 第二步
3. 第三步
```

## 🎨 高级技巧

### 居中对齐

使用 HTML：

```html
<div style="text-align: center;">
  <img src="/images/your-image.jpg" alt="居中图片" width="500">
  <p><em>图片标题</em></p>
</div>
```

### 图片并排

```html
<div style="display: flex; gap: 1rem;">
  <img src="/images/img1.jpg" alt="图片1" style="flex: 1;">
  <img src="/images/img2.jpg" alt="图片2" style="flex: 1;">
</div>
```

### 添加图片说明

```html
<figure>
  <img src="/images/your-image.jpg" alt="描述">
  <figcaption style="text-align: center; color: #666; font-style: italic;">
    图1: 这是图片说明
  </figcaption>
</figure>
```

## 📝 完整示例

下面是一个综合示例，展示如何撰写一篇技术博客：

```markdown
---
title: 我的技术博客
date: 2025-11-09
excerpt: 这是文章摘要
tags: ['技术', '算法']
readTime: 10分钟
---

# 标题

## 介绍

这里是正文内容...

## 算法分析

时间复杂度为 $O(n \log n)$。

## 代码实现

\```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)
\```

## 结果

![实验结果](/images/result.png)
```

---

*希望这个指南对你有帮助！开始创作你的第一篇博客吧！* 🚀
