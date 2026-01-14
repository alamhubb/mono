<div align="center">

# Mono

**🚀 Zero-intrusion Monorepo Development Tools**

**Use TypeScript source code directly in development, no build required**

[![npm version](https://img.shields.io/npm/v/mono-mjs.svg?style=flat-square)](https://www.npmjs.com/package/mono-mjs)
[![npm downloads](https://img.shields.io/npm/dm/mono-mjs.svg?style=flat-square)](https://www.npmjs.com/package/mono-mjs)
[![GitHub stars](https://img.shields.io/github/stars/alamhubb/mono.svg?style=flat-square)](https://github.com/alamhubb/mono)
[![license](https://img.shields.io/npm/l/mono-mjs.svg?style=flat-square)](./LICENSE)
[![node version](https://img.shields.io/node/v/mono-mjs.svg?style=flat-square)](https://nodejs.org)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## 💡 What is Mono?

Mono is a set of tools for **zero-intrusion monorepo development**. It allows you to use TypeScript source code directly during development, without building packages or restructuring your project.

### The "Chain Pollution" Problem with pnpm workspace

Using pnpm workspace means **your entire dependency chain is forced to use pnpm**:

```
Project A (pnpm) → must use pnpm
  └── Project B → must use pnpm (infected)
        └── Project C → must use pnpm (infected)
              └── Project D → must use pnpm (infected)
```

- 🔗 All related projects must convert to pnpm
- 👥 Everyone on the team must install pnpm
- 🔧 All CI/CD environments must configure pnpm
- 📦 Newcomers running `npm install` get error: `workspace:*`

### Mono's Solution

With Mono, you just:
- ✅ Run `mono ./src/index.ts` - that's it!
- ✅ **No reinstall after changes** - modify local packages, run immediately
- ✅ **No build step** - use TypeScript source directly
- ✅ **No configuration** - auto-discovers all local packages
- ✅ **No `workspace:*`** - your package.json stays standard
- ✅ Works with npm/yarn/pnpm - your project stays compatible

### pnpm workspace vs Mono

| Aspect | pnpm workspace | Mono |
|--------|----------------|------|
| Installation | Must install pnpm | Optional |
| Config Files | Needs pnpm-workspace.yaml | None needed |
| package.json | Must change to workspace:* | No changes |
| After Cloning | Must use pnpm install | npm/yarn/pnpm all work |
| Dependencies | Need to build first | Use source directly |
| Team Collaboration | Everyone must use pnpm | No requirements |

### All Solutions Comparison

| Solution | No Install | No Build | Zero Config | Auto Discovery | Complexity |
|----------|:----------:|:--------:|:-----------:|:--------------:|:----------:|
| npm native | ❌ | ❌ | ❌ | ❌ | High |
| pnpm workspace | ✅ | ⚠️ | ❌ | ✅ | Medium |
| tsconfig paths | ✅ | ✅ | ❌ | ❌ | Low |
| Nx | ✅ | ✅ | ❌ | ✅ | Very High |
| **mono** | ✅ | ✅ | ✅ | ✅ | **Minimal** |

> ⚠️ = Depends on configuration

---

## 📦 Packages

This repository contains two packages that work together:

| Package | Purpose | Install |
|---------|---------|---------|
| [**mono-mjs**](./mono) | Node.js CLI - for build tools, Vite plugins | `npm install -g mono-mjs` |
| [**vite-plugin-mono**](./vite-plugin-mono) | Vite Plugin - for browser runtime | `npm install -D vite-plugin-mono` |

### When to use which?

| Scenario | Tool |
|----------|------|
| Running scripts, build tools | `mono` |
| Vite plugins, compilers | `mono` |
| Browser-side imports | `vite-plugin-mono` |
| Vue/React components | `vite-plugin-mono` |

---

## 🚀 Quick Start

### 1. Install CLI globally

```bash
npm install -g mono-mjs
```

### 2. Run your project

> 💡 **No reinstall needed!** Modify local packages and run immediately.

```bash
# Run TypeScript directly - local packages resolved automatically
mono ./src/index.ts

# Run Vite with local packages
mono ./node_modules/vite/bin/vite.js
```

### 3. (Optional) Add Vite plugin for browser-side

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
    viteMono(),  // First!
    vue()
  ]
})
```

---

## ✨ Features

### 🚫 Three "No"s - What You DON'T Need

| Traditional Workflow | With Mono |
|---------------------|----------|
| `npm install` after adding packages | ❌ Not needed |
| `npm run build` after code changes | ❌ Not needed |
| Configure `workspace.yaml` or `tsconfig paths` | ❌ Not needed |

> 💡 **Note**: Third-party packages from npm registry still require `npm install`. The "No Install" benefit applies to **local packages** only.

### 🔄 vs npm `file:` Protocol

```json
// Traditional npm local dependency
{ "my-lib": "file:../packages/my-lib" }
```

| After modifying local package | npm `file:` | mono |
|------------------------------|:-----------:|:----:|
| Need to run `npm install` again? | ✅ Yes | ❌ No |
| Changes visible immediately? | ❌ No | ✅ Yes |

**With `file:` protocol**, npm copies the package to `node_modules`. Every time you modify the local package, you must run `npm install` again to update the copy.

**With mono**, imports are redirected to source code at runtime. No copying, no reinstalling.

### ✅ What Mono Gives You

- 🎯 **Zero Intrusion** - Your project stays a standard npm project
- 🔍 **Auto Discovery** - Recursively finds all local packages
- ⚡️ **Source First** - Run TypeScript source directly, no build artifacts
- 📦 **Package Manager Agnostic** - Works with npm, yarn, pnpm, bun
- 🛠️ **Zero Config** - Default `./src/index.ts`, optional `local` field

---

## 📚 How It Works

### Package Discovery

```
Find farthest project root upward (.idea/.vscode/.git/package.json)
  └── Recursive Scan
      └── Find all package.json
          └── Register by "name" field
```

### Import Interception

```javascript
// Your code
import { utils } from 'my-utils'

// Mono redirects to source code
// → /path/to/my-utils/src/index.ts
```

---

## ⚙️ Configuration

### Zero Config (Default)

All packages use `./src/index.ts` by default. No configuration needed!

### Custom Entry (Optional)

Add `local` field to `package.json`:

```json
{
  "name": "my-package",
  "local": "./src/main.ts"
}
```

---

## 📋 Requirements

- **Node.js** >= 18.19.0
- **ESM Projects** - `"type": "module"` in package.json

---

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/alamhubb/mono.git
cd mono

# Install dependencies
npm install

# Build vite-plugin-mono
cd vite-plugin-mono
npm run build
```

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[Report Bug](https://github.com/alamhubb/mono/issues) · [Request Feature](https://github.com/alamhubb/mono/issues)

</div>
