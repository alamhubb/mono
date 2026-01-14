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

### pnpm workspace 的「链式污染」问题

使用 pnpm workspace 意味着**整条依赖链都被迫使用 pnpm**：

```
项目 A (pnpm) → 必须用 pnpm
  └── 项目 B → 必须用 pnpm（被污染）
        └── 项目 C → 必须用 pnpm（被污染）
              └── 项目 D → 必须用 pnpm（被污染）
```

- 🔗 所有相关项目都必须改成 pnpm
- 👥 所有开发人员都必须安装 pnpm  
- 🔧 所有 CI/CD 环境都必须配置 pnpm
- 📦 新成员 `npm install` 直接报错：`workspace:*`

### Mono 的解决方案

使用 Mono，你只需：
- ✅ 运行 `mono ./src/index.ts` - 就这么简单！
- ✅ **修改后无需重新安装** - 修改本地包，立即运行
- ✅ **无需构建** - 直接使用 TypeScript 源码
- ✅ **无需配置** - 自动发现所有本地包
- ✅ **无需 `workspace:*`** - package.json 保持标准格式
- ✅ 兼容 npm/yarn/pnpm - 项目保持通用性

### pnpm workspace vs Mono

| 方面 | pnpm workspace | Mono |
|------|----------------|------|
| 安装 | 必须安装 pnpm | 可选 |
| 配置文件 | 需要 pnpm-workspace.yaml | 不需要 |
| package.json | 需要修改为 workspace:* | 不需要修改 |
| 克隆后使用 | 必须 pnpm install | npm/yarn/pnpm 都可以 |
| 依赖包 | 需要先构建 | 直接使用源码 |
| 团队协作 | 所有人必须用 pnpm | 不强制 |

### 各方案横向对比

| 方案 | 免安装 | 免编译 | 零配置 | 自动发现 | 复杂度 |
|------|:------:|:------:|:------:|:--------:|:------:|
| npm 原生 | ❌ | ❌ | ❌ | ❌ | 高 |
| pnpm workspace | ✅ | ⚠️ | ❌ | ✅ | 中 |
| tsconfig paths | ✅ | ✅ | ❌ | ❌ | 低 |
| Nx | ✅ | ✅ | ❌ | ✅ | 极高 |
| **mono** | ✅ | ✅ | ✅ | ✅ | **极低** |

> ⚠️ = 视配置而定

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

> 💡 **无需重新安装！** 修改本地包后立即运行。

```bash
# 直接运行 TypeScript - 本地包自动解析
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

### 🚫 三个「不需要」

| 传统工作流 | 使用 Mono |
|-----------|----------|
| 添加包后执行 `npm install` | ❌ 不需要 |
| 修改代码后执行 `npm run build` | ❌ 不需要 |
| 配置 `workspace.yaml` 或 `tsconfig paths` | ❌ 不需要 |

> 💡 **注意**：来自 npm 仓库的第三方包仍然需要 `npm install`。「无需安装」的优势仅适用于**本地包**。

### 🔄 对比 npm `file:` 协议

```json
// 传统 npm 本地依赖方式
{ "my-lib": "file:../packages/my-lib" }
```

| 修改本地包后 | npm `file:` | mono |
|--------------|:-----------:|:----:|
| 需要重新运行 `npm install`？ | ✅ 是 | ❌ 否 |
| 修改立即生效？ | ❌ 否 | ✅ 是 |

**使用 `file:` 协议时**，npm 会将包复制到 `node_modules`。每次修改本地包后，必须重新运行 `npm install` 来更新副本。

**使用 mono 时**，导入在运行时被重定向到源码。无需复制，无需重新安装。

### ✅ Mono 带给你的

- 🎯 **零侵入** - 项目保持标准 npm 结构
- 🔍 **自动发现** - 递归查找所有本地包
- ⚡️ **源码优先** - 直接运行 TypeScript 源码，无需构建产物
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
