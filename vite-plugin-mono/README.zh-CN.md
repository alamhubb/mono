<div align="center">

# vite-plugin-mono

**🚀 Monorepo 源码开发 Vite 插件**

**在浏览器中直接使用 TypeScript 源码，无需构建**

[![npm version](https://img.shields.io/npm/v/vite-plugin-mono.svg?style=flat-square)](https://www.npmjs.com/package/vite-plugin-mono)
[![license](https://img.shields.io/npm/l/vite-plugin-mono.svg?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## 💡 什么是 vite-plugin-mono？

这是 [mono-mjs](../mono) 的**浏览器端配套插件**。`mono` 处理 Node.js 端的模块解析（用于 Vite 插件、编译器等），而 `vite-plugin-mono` 处理浏览器端的模块解析。

### 为什么需要它？

**问题**：`mono` 只能拦截 Node.js ESM loader。浏览器端的导入通过 Vite 的解析器，不使用 `mono`。

**解决方案**：`vite-plugin-mono` 使用 Vite 的 `resolve.alias`，将本地包重定向到其源码。

---

## ✨ 特性

- 🎯 **零配置** - 与 `mono` 配合开箱即用
- 🔍 **自动发现** - 自动查找所有本地包
- ⚡️ **热更新** - 修改立即生效
- 📦 **兼容性** - 支持 npm、yarn、pnpm、bun

---

## 📦 安装

```bash
npm install -D vite-plugin-mono
```

---

## 🚀 快速开始

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMono } from 'vite-plugin-mono'

export default defineConfig({
  plugins: [
    viteMono(),  // 必须放第一个！
    vue()
  ]
})
```

**就这样！** 现在浏览器端的导入也会使用源码了。

---

## 📚 工作原理

### mono vs vite-plugin-mono

| 工具 | 作用域 | 应用场景 |
|------|--------|----------|
| **mono** | Node.js | Vite 插件、编译器、构建工具 |
| **vite-plugin-mono** | 浏览器 | 运行时代码、Vue 组件 |

### 示例

```
你的项目
├── packages/
│   ├── ui-lib/           # 本地包
│   │   ├── package.json  # { "name": "ui-lib", "local": "./src/index.ts" }
│   │   └── src/index.ts
│   └── app/
│       └── src/App.vue   # import { Button } from 'ui-lib'
└── vite.config.ts        # viteMono() 重定向 'ui-lib' → 源码
```

---

## ⚙️ 配置选项

```typescript
viteMono({
  // 调试模式
  debug: false,
  
  // 排除的包
  exclude: ['some-package']
})
```

---

## 🔗 相关项目

- [mono-mjs](../mono) - Node.js 端 monorepo 开发 CLI 工具

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[报告 Bug](https://github.com/alamhubb/mono/issues) · [请求功能](https://github.com/alamhubb/mono/issues)

</div>
