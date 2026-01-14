<div align="center">

# vite-plugin-mono

**🚀 Vite plugin for monorepo source code development**

**Use TypeScript source code directly in browser, no build needed**

[![npm version](https://img.shields.io/npm/v/vite-plugin-mono.svg?style=flat-square)](https://www.npmjs.com/package/vite-plugin-mono)
[![license](https://img.shields.io/npm/l/vite-plugin-mono.svg?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## 💡 What is vite-plugin-mono?

This is the **browser-side companion** to [mono-mjs](../mono). While `mono` handles Node.js-side module resolution (for Vite plugins, compilers, etc.), `vite-plugin-mono` handles browser-side module resolution.

### Why do you need it?

**Problem**: `mono` can only intercept Node.js ESM loader. Browser-side imports go through Vite's resolver, which doesn't use `mono`.

**Solution**: `vite-plugin-mono` uses Vite's `resolve.alias` to redirect local packages to their source code.

---

## ✨ Features

- 🎯 **Zero Config** - Works out of the box with `mono`
- 🔍 **Auto Discovery** - Finds all local packages automatically
- ⚡️ **Hot Reload** - Changes reflect immediately
- 📦 **Compatible** - Works with npm, yarn, pnpm, bun

---

## 📦 Installation

```bash
npm install -D vite-plugin-mono
```

---

## 🚀 Quick Start

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMono } from 'vite-plugin-mono'

export default defineConfig({
  plugins: [
    viteMono(),  // Must be first!
    vue()
  ]
})
```

**That's it!** Now your browser-side imports will use source code too.

---

## 📚 How It Works

### mono vs vite-plugin-mono

| Tool | Scope | Use Case |
|------|-------|----------|
| **mono** | Node.js | Vite plugins, compilers, build tools |
| **vite-plugin-mono** | Browser | Runtime code, Vue components |

### Example

```
Your Project
├── packages/
│   ├── ui-lib/           # Local package
│   │   ├── package.json  # { "name": "ui-lib", "local": "./src/index.ts" }
│   │   └── src/index.ts
│   └── app/
│       └── src/App.vue   # import { Button } from 'ui-lib'
└── vite.config.ts        # viteMono() redirects 'ui-lib' → source
```

---

## ⚙️ Options

```typescript
viteMono({
  // Debug mode
  debug: false,
  
  // Exclude packages
  exclude: ['some-package']
})
```

---

## ⚠️ Important: vite.config.ts Limitation

When Vite starts, it uses **esbuild** to compile `vite.config.ts`. During this phase:

| node_modules status | esbuild behavior | mono can intercept? |
|---------------------|------------------|---------------------|
| Package exists with correct dist | Bundle into config | ❌ No need |
| Package exists but dist missing | **Error!** | ❌ |
| Package not in node_modules | Mark as external | ✅ Yes |

**Key insight**: `mono` can only intercept imports in `vite.config.ts` when the package is **not** in `node_modules`.

### Solution for local development

If you're importing a local plugin (like `vite-plugin-cssts`) in `vite.config.ts`:

1. **Option A**: Remove the package from `node_modules`:
   ```bash
   rm -rf node_modules/vite-plugin-cssts
   ```

2. **Option B**: Use relative path import:
   ```typescript
   // Instead of:
   import cssTsPlugin from 'vite-plugin-cssts'
   
   // Use:
   import cssTsPlugin from '../vite-plugin-cssts/src/index.ts'
   ```

3. **Option C**: Use `vite.config.mjs` instead of `.ts` (Node.js runs it directly without esbuild)

## 🔗 Related

- [mono-mjs](../mono) - CLI tool for Node.js-side monorepo development

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[Report Bug](https://github.com/alamhubb/mono/issues) · [Request Feature](https://github.com/alamhubb/mono/issues)

</div>
