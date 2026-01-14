<div align="center">

# mono

**🚀 Zero-intrusion Monorepo Development Tool**

**Use TypeScript source code directly, no build required, no project restructuring needed**

[![npm version](https://img.shields.io/npm/v/mono.svg?style=flat-square)](https://www.npmjs.com/package/mono)
[![license](https://img.shields.io/npm/l/mono.svg?style=flat-square)](./LICENSE)
[![node version](https://img.shields.io/node/v/mono.svg?style=flat-square)](https://nodejs.org)

[English](./README.md) · [简体中文](./README.zh-CN.md)

</div>

---

## � Why mono?

### Zero Intrusion - Keep Your Project Clean

**Are you frustrated with:**
- ❌ Converting your npm project to pnpm workspace
- ❌ Dealing with `workspace:*` protocol complexities
- ❌ Creating workspace configuration files
- ❌ Restructuring your project for monorepo tools

**With mono:**
- ✅ **Zero Configuration** - No new files, works with any npm project
- ✅ **Non-Invasive** - Your project stays a clean npm project
- ✅ **Drop-in Replacement** - Use like `node` or `tsx`: `mono xxx.ts`
- ✅ **Auto Discovery** - Automatically finds local packages
- ✅ **Simple Config** - Optional `local` field in `package.json`, defaults to `./src/index.ts`

### Traditional vs mono

| Approach | Steps Required |
|----------|---------------|
| **pnpm workspace** | 1. Convert to pnpm<br/>2. Create `pnpm-workspace.yaml`<br/>3. Use `workspace:*` protocol<br/>4. Restructure project<br/>5. Build packages |
| **npm link** | 1. Link each package manually<br/>2. Build packages<br/>3. Rebuild on every change |
| **mono** ✨ | `mono ./src/index.ts` - **that's it!** |

---

## ✨ Key Features

- 🎯 **Zero Intrusion** - No project restructuring, no configuration files
- 🔍 **Auto Discovery** - Recursively scans and finds all local packages
- 📦 **Package Manager Agnostic** - Works with npm, yarn, pnpm, bun
- ⚡️ **Instant Reload** - Changes take effect immediately
- 🛠️ **Zero Config** - Default `./src/index.ts`, optional `local` field for custom paths
- 🌐 **ESM Only** - Built for modern JavaScript (`type: "module"`)
- 📝 **Config File** - Auto-generates `.mono/monoConfig.json` for debugging

---

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g mono
```

### Requirements

- **Node.js** >= 18.19.0
- **ESM Projects** - Your `package.json` must have `"type": "module"`

---

## 🚀 Quick Start

### Basic Usage - Just Like `node` or `tsx`

```bash
# Run TypeScript file directly
mono ./src/index.ts

# Run with parameters
mono ./src/index.ts --port 3000

# Enable debug mode
mono ./src/index.ts debug
```

### Use in package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/vite/bin/vite.js",
    "start": "mono ./src/index.ts"
  }
}
```

**That's it!** No workspace configuration, no project restructuring.

---

## 📚 How It Works

### 1. Auto Package Discovery

```
Find farthest project root upward (.idea/.vscode/.git/package.json)
  └── Recursive Scan
      └── Find all package.json
          └── Register by "name" field
```

### 2. Import Interception

```javascript
// Your code
import { utils } from 'my-utils'

// mono automatically redirects to source
// → /path/to/my-utils/src/index.ts
```

### 3. Default Convention

- **Default Entry**: `./src/index.ts` for all packages
- **No Config Needed**: Works out of the box

### 4. Optional Custom Entry

If you need a different entry point, add `local` field:

```json
{
  "name": "my-package",
  "local": "./src/main.ts"
}
```

---

## ⚙️ Configuration

### Zero Config (Recommended)

Just use default `./src/index.ts`:

```json
{
  "name": "my-package",
  "type": "module"
  // No extra config needed!
}
```

### Custom Entry Point (Optional)

Add `local` field for custom paths:

```json
{
  "name": "@my-org/utils",
  "type": "module",
  "local": "./src/custom-entry.ts"
}
```

**That's all the configuration you need!** Your project remains a standard npm project.

---

## 🐛 Debugging

Five debug formats supported, parameter can be anywhere:

```bash
# Before file
mono --debug ./src/index.ts
mono -debug ./src/index.ts
mono -d ./src/index.ts

# After file (Recommended)
mono ./src/index.ts debug
mono ./src/index.ts d
```

Or use environment variable:

```bash
# Linux/macOS
MONO_DEBUG=1 mono ./src/index.ts

# Windows PowerShell  
$env:MONO_DEBUG='1'; mono ./src/index.ts
```

Debug logs output to:
- Console
- `mono-debug.log` file

---

## 📋 Common Use Cases

### With Vite

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/vite/bin/vite.js"
  }
}
```

### With Webpack

```json
{
  "type": "module",
  "scripts": {
    "dev": "mono ./node_modules/webpack/bin/webpack.js serve"
  }
}
```

### Custom Build Scripts

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

## ❓ FAQ

### Q: Why not use pnpm workspace?

**A:** pnpm workspace requires:
- Converting to pnpm
- Creating `pnpm-workspace.yaml`
- Using `workspace:*` protocol
- Restructuring project

**mono** requires: nothing! Keep your npm project as-is.

### Q: Why not use npm link?

**A:** 
| Feature | mono | npm link |
|---------|------|----------|
| Setup | ✅ None | ❌ Manual per package |
| TypeScript | ✅ Direct source | ❌ Requires build |
| Hot Reload | ✅ Instant | ❌ Rebuild needed |

### Q: Does it modify my package.json?

**A:** No! The `local` field is optional. Your package.json stays clean.

### Q: What if I don't add `local` field?

**A:** It defaults to `./src/index.ts`. No configuration needed!

### Q: Will it affect production builds?

**A:** No. `mono` is for development only. Production uses `node_modules`.

---

## 🔧 Technical Details

- **ESM Loader Hooks** - Uses Node.js native module resolution API
- **TypeScript Compiler** - Powered by `tsx` for latest syntax support
- **Zero Dependencies** - Only 2 runtime deps: `tsx` and `cross-spawn`

### ESM Only

`mono` requires `"type": "module"` in your `package.json`:

```json
{
  "type": "module"
}
```

---

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

## 🔗 Related

- [vite-plugin-mono](../vite-plugin-mono) - Vite plugin for browser-side source development

---

<div align="center">

Made with ❤️ by [alamhubb](https://github.com/alamhubb)

[Report Bug](https://github.com/alamhubb/mono/issues) · [Request Feature](https://github.com/alamhubb/mono/issues)

</div>
