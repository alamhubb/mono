<div align="center">

# Mono

**🚀 零侵入式 Monorepo 开发工具**

**直接使用 TypeScript 源码开发，无需构建，无需改造项目**

[![license](https://img.shields.io/npm/l/mono-mjs.svg?style=flat-square)](./LICENSE)
[![node version](https://img.shields.io/node/v/mono-mjs.svg?style=flat-square)](https://nodejs.org)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## 💡 什么是 Mono？

Mono 是一套**零侵入式 monorepo 开发工具**。它允许你在开发期间直接使用 TypeScript 源码，无需构建包或重构项目。

### 问题

在 monorepo 开发中，你通常需要：
- ❌ 转换为 pnpm/yarn workspace
- ❌ 使用前先构建包
- ❌ 每次修改后重新构建
- ❌ 处理 `workspace:*` 协议

### 解决方案

使用 Mono，你只需：
- ✅ 运行 `mono ./src/index.ts` - 就这么简单！
- ✅ 无需重构项目
- ✅ 无需构建包
- ✅ 修改立即生效

---

## 📦 包列表

本仓库包含两个协同工作的包：

| 包 | 用途 | 安装 |
|---|------|------|
| [**mono-mjs**](./mono) | Node.js CLI - 用于构建工具、Vite 插件 | `npm install -g mono-mjs` |
| [**vite-plugin-mono**](./vite-plugin-mono) | Vite 插件 - 用于浏览器运行时 | `npm install -D vite-plugin-mono` |

### 何时使用哪个？

| 场景 | 工具 |
|------|------|
| 运行脚本、构建工具 | `mono` |
| Vite 插件、编译器 | `mono` |
| 浏览器端导入 | `vite-plugin-mono` |
| Vue/React 组件 | `vite-plugin-mono` |

---

## 🚀 快速开始

### 1. 全局安装 CLI

```bash
npm install -g mono-mjs
```

### 2. 运行项目

```bash
# 直接运行 TypeScript
mono ./src/index.ts

# 使用本地包运行 Vite
mono ./node_modules/vite/bin/vite.js
```

### 3. （可选）添加 Vite 插件用于浏览器端

```bash
npm install -D vite-plugin-mono
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMono } from 'vite-plugin-mono'

export default defineConfig({
  plugins: [
    viteMono(),  // 放第一个！
    vue()
  ]
})
```

---

## ✨ 特性

- 🎯 **零侵入** - 无需重构项目，无需配置文件
- 🔍 **自动发现** - 递归查找所有本地包
- ⚡️ **即时生效** - 修改立即生效
- 📦 **包管理器无关** - 支持 npm、yarn、pnpm、bun
- 🛠️ **零配置** - 默认 `./src/index.ts`，可选 `local` 字段

---

## 📚 工作原理

### 包发现

```
直线向上查找距离最远的项目根目录 (.idea/.vscode/.git/package.json)
  └── 递归扫描
      └── 查找所有 package.json
          └── 根据 "name" 字段注册
```

### 导入拦截

```javascript
// 你的代码
import { utils } from 'my-utils'

// Mono 重定向到源码
// → /path/to/my-utils/src/index.ts
```

---

## ⚙️ 配置

### 零配置（默认）

所有包默认使用 `./src/index.ts`。无需任何配置！

### 自定义入口（可选）

在 `package.json` 中添加 `local` 字段：

```json
{
  "name": "my-package",
  "local": "./src/main.ts"
}
```

---

## 📋 环境要求

- **Node.js** >= 18.19.0
- **ESM 项目** - package.json 中需要 `"type": "module"`

---

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/alamhubb/mono.git
cd mono

# 安装依赖
npm install

# 构建 vite-plugin-mono
cd vite-plugin-mono
npm run build
```

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[报告 Bug](https://github.com/alamhubb/mono/issues) · [请求功能](https://github.com/alamhubb/mono/issues)

</div>
