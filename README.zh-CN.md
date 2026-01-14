<div align="center">

# mono

**🚀 零侵入式 Monorepo 开发工具**

**直接使用 TypeScript 源码开发，无需构建，无需改造项目**

[![npm version](https://img.shields.io/npm/v/mono.svg?style=flat-square)](https://www.npmjs.com/package/mono)
[![license](https://img.shields.io/npm/l/mono.svg?style=flat-square)](./LICENSE)
[![node version](https://img.shields.io/node/v/mono.svg?style=flat-square)](https://nodejs.org)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## 💡 为什么选择 mono？

### 零侵入 - 保持项目干净

**你是否曾为这些烦恼：**
- ❌ 需要将 npm 项目转换为 pnpm workspace
- ❌ 处理 `workspace:*` 协议的复杂性
- ❌ 创建各种 workspace 配置文件
- ❌ 为了 monorepo 工具而重构项目结构

**使用 mono：**
- ✅ **零配置** - 不创建任何新文件，兼容任何 npm 项目
- ✅ **无侵入** - 你的项目依然是一个干净的 npm 项目
- ✅ **即插即用** - 像使用 `node` 或 `tsx` 一样使用：`mono xxx.ts`
- ✅ **自动发现** - 自动查找本地包
- ✅ **简单配置** - 可选的 `local` 字段，默认 `./src/index.ts`

### 传统方式 vs mono

| 方式 | 需要的步骤 |
|------|-----------|
| **pnpm workspace** | 1. 转换为 pnpm<br/>2. 创建 `pnpm-workspace.yaml`<br/>3. 使用 `workspace:*` 协议<br/>4. 重构项目结构<br/>5. 构建包 |
| **npm link** | 1. 手动链接每个包<br/>2. 构建包<br/>3. 每次修改都要重新构建 |
| **mono** ✨ | `mono ./src/index.ts` - **就这么简单！** |

---

## ✨ 核心特性

- 🎯 **零侵入** - 无需重构项目，无需配置文件
- 🔍 **自动发现** - 递归扫描并找到所有本地包
- 📦 **包管理器无关** - 兼容 npm、yarn、pnpm、bun
- ⚡️ **即时加载** - 修改立即生效  
- 🛠️ **零配置** - 默认 `./src/index.ts`，可选 `local` 字段自定义路径
- 🌐 **仅支持 ESM** - 为现代 JavaScript 设计（`type: "module"`）
- 📝 **配置文件** - 自动生成 `.mono/monoConfig.json` 用于调试

---

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g mono
```

### 环境要求

- **Node.js** >= 18.19.0  
- **ESM 项目** - 你的 `package.json` 必须包含 `"type": "module"`

---

## 🚀 快速开始

### 基本用法 - 就像 `node` 或 `tsx` 一样

```bash
# 直接运行 TypeScript 文件
mono ./src/index.ts

# 带参数运行
mono ./src/index.ts --port 3000

# 开启调试模式
mono ./src/index.ts debug
```

### 在 package.json 中使用

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/vite/bin/vite.js",
    "start": "mono ./src/index.ts"
  }
}
```

**就这样！** 无需 workspace 配置，无需重构项目。

---

## 📚 工作原理

### 1. 自动包发现

```
直线向上查找距离最远的项目根目录 (.idea/.vscode/.git/package.json)
  └── 递归扫描
      └── 查找所有 package.json
          └── 根据 "name" 字段注册
```

### 2. 导入拦截

```javascript
// 你的代码
import { utils } from 'my-utils'

// mono 自动重定向到源码
// → /path/to/my-utils/src/index.ts
```

### 3. 默认约定

- **默认入口**：所有包默认 `./src/index.ts`
- **无需配置**：开箱即用

### 4. 可选的自定义入口

如果需要不同的入口点，添加 `local` 字段：

```json
{
  "name": "my-package",
  "local": "./src/main.ts"
}
```

---

## ⚙️ 配置

### 零配置（推荐）

直接使用默认的 `./src/index.ts`：

```json
{
  "name": "my-package",
  "type": "module"
  // 无需额外配置！
}
```

### 自定义入口（可选）

添加 `local` 字段指定自定义路径：

```json
{
  "name": "@my-org/utils",
  "type": "module",
  "local": "./src/custom-entry.ts"
}
```

**这就是你需要的全部配置！** 你的项目依然是标准的 npm 项目。

---

## 🐛 调试

支持 5 种调试格式，参数可以放在任意位置：

```bash
# 参数在文件前面
mono --debug ./src/index.ts
mono -debug ./src/index.ts
mono -d ./src/index.ts

# 参数在文件后面（推荐）
mono ./src/index.ts debug
mono ./src/index.ts d
```

或使用环境变量：

```bash
# Linux/macOS
MONO_DEBUG=1 mono ./src/index.ts

# Windows PowerShell  
$env:MONO_DEBUG='1'; mono ./src/index.ts
```

调试日志输出到：
- 控制台
- `mono-debug.log` 文件

---

## 📋 常见使用场景

### 配合 Vite

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/vite/bin/vite.js"
  }
}
```

### 配合 Webpack

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/webpack/bin/webpack.js serve"
  }
}
```

### 自定义构建脚本

```json
{
  "type": "module",
  "scripts": {
    "build": "mono ./scripts/build.ts",
    "codegen": "mono ./scripts/codegen.ts"
  }
}
```

---

## ❓ 常见问题

### Q: 为什么不用 pnpm workspace？

**A:** pnpm workspace 需要：
- 转换为 pnpm
- 创建 `pnpm-workspace.yaml`
- 使用 `workspace:*` 协议
- 重构项目结构

**mono** 需要：什么都不需要！保持你的 npm 项目原样。

### Q: 为什么不用 npm link？

**A:**  
| 特性 | mono | npm link |
|------|------|----------|
| 设置 | ✅ 无需设置 | ❌ 每个包都要手动链接 |
| TypeScript | ✅ 直接使用源码 | ❌ 需要构建 |
| 热更新 | ✅ 即时生效 | ❌ 需要重新构建 |

### Q: 它会修改我的 package.json 吗？

**A:** 不会！`local` 字段是可选的。你的 package.json 保持干净。

### Q: 如果我不添加 `local` 字段呢？

**A:** 默认使用 `./src/index.ts`。无需任何配置！

### Q: 会影响生产构建吗？

**A:** 不会。`mono` 仅用于开发。生产环境使用 `node_modules`。

---

## 🔧 技术细节

- **ESM Loader Hooks** - 使用 Node.js 原生模块解析 API
- **TypeScript 编译器** - 基于 `tsx`，支持最新语法
- **零依赖** - 仅 2 个运行时依赖：`tsx` 和 `cross-spawn`

### 仅支持 ESM

`mono` 要求 `package.json` 中包含 `"type": "module"`：

```json
{
  "type": "module"
}
```

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

## 🔗 相关项目

- [vite-plugin-mono](../vite-plugin-mono) - 用于浏览器端源码开发的 Vite 插件

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[报告 Bug](https://github.com/alamhubb/mono/issues) · [请求功能](https://github.com/alamhubb/mono/issues)

</div>
