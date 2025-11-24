---
title: TypeScript 实用技巧
date: 2024-01-25
excerpt: 分享一些实用的 TypeScript 技巧，帮助你写出更好的类型安全代码。
tags: ['TypeScript', 'JavaScript', '最佳实践']
readTime: 6分钟
---

# TypeScript 实用技巧

TypeScript 为 JavaScript 添加了类型系统，让我们的代码更加健壮和可维护。这里分享一些实用技巧。

## 1. 使用联合类型

联合类型让我们可以定义多种可能的类型：

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error'

function handleStatus(status: Status) {
  switch (status) {
    case 'idle':
      return '待机'
    case 'loading':
      return '加载中'
    case 'success':
      return '成功'
    case 'error':
      return '错误'
  }
}
```

## 2. 善用类型守卫

类型守卫帮助 TypeScript 缩小类型范围：

```typescript
interface User {
  id: number
  name: string
}

function isUser(obj: any): obj is User {
  return typeof obj.id === 'number' && typeof obj.name === 'string'
}

function processData(data: unknown) {
  if (isUser(data)) {
    // 这里 TypeScript 知道 data 是 User 类型
    console.log(data.name)
  }
}
```

## 3. 泛型的力量

泛型让我们可以写出灵活且类型安全的代码：

```typescript
function getFirstElement<T>(arr: T[]): T | undefined {
  return arr[0]
}

const firstNumber = getFirstElement([1, 2, 3]) // number | undefined
const firstName = getFirstElement(['a', 'b', 'c']) // string | undefined
```

## 4. 实用工具类型

TypeScript 内置了许多实用的工具类型：

```typescript
interface User {
  id: number
  name: string
  email: string
  age: number
}

// Partial - 所有属性变为可选
type PartialUser = Partial<User>

// Pick - 选择特定属性
type UserPreview = Pick<User, 'id' | 'name'>

// Omit - 排除特定属性
type UserWithoutEmail = Omit<User, 'email'>

// Readonly - 所有属性变为只读
type ReadonlyUser = Readonly<User>
```

## 5. 类型推断

充分利用 TypeScript 的类型推断能力：

```typescript
// 不需要显式声明类型
const user = {
  id: 1,
  name: 'Alice',
} // TypeScript 自动推断类型

// 函数返回类型也会自动推断
function double(x: number) {
  return x * 2 // 推断返回类型为 number
}
```

## 6. 严格模式

在 `tsconfig.json` 中启用严格模式：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## 总结

这些技巧只是 TypeScript 强大功能的冰山一角。持续学习和实践，你会发现 TypeScript 能大大提高你的开发效率和代码质量。

## 推荐资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Total TypeScript](https://www.totaltypescript.com/)

Happy coding with TypeScript! 🚀
