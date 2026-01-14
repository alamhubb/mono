# Why I Ditched pnpm and Built a 100-Line Monorepo Tool Instead

> TL;DR: I created [mono](https://github.com/alamhubb/mono) - a lightweight alternative to pnpm workspace that keeps your project pure npm while giving you the monorepo DX.

## The Problem: pnpm's "Chain Pollution"

When I started using pnpm workspace for my TypeScript monorepo, I thought I found the perfect solution. Until I tried to share my project with contributors.

```bash
$ git clone my-awesome-project
$ npm install
npm ERR! Invalid tag name "workspace:*"
```

Every. Single. Time.

### The Cascade Effect

Here's what happened:
- My project used pnpm workspace
- Anyone who cloned it had to install pnpm
- Our CI/CD needed pnpm configuration
- Contributors couldn't use their preferred package manager
- The `workspace:*` protocol made package.json incompatible with npm/yarn

**One decision forced the entire dependency chain to adopt pnpm.**

## What I Actually Needed

Let's be honest - I wasn't building Vercel or Google. I just had:
- 3-4 local TypeScript packages
- They depended on each other
- I wanted to modify them simultaneously
- I didn't want to run `npm run build` after every change

**That's it.** I didn't need:
- ❌ Complex workspace configuration
- ❌ A proprietary protocol (`workspace:*`)
- ❌ To force my team to install another package manager
- ❌ Symlink debugging nightmares

## The Solution: Runtime Source Resolution

Instead of managing symlinks at install-time (like pnpm), what if we resolved modules at runtime?

`javascript
// Your code
import { utils } from 'my-local-pkg'

// Traditional: pnpm symlinks node_modules/my-local-pkg  ../packages/my-local-pkg/dist
// mono: Intercept at runtime  resolve to ../packages/my-local-pkg/src/index.ts
`

### How It Works

Mono uses Node.js ESM Loader Hooks to:
1. Scan your project for packages (any directory with package.json)
2. Build a map: package-name  bsolute/path/to/src/index.ts
3. Intercept imports and redirect to source code

**No symlinks. No build artifacts. Just TypeScript source.**

## Show Me the Code

`ash
# Install
npm install -g mono-mjs

# Run - local packages automatically resolved
mono ./src/index.ts

# Works with Vite, Webpack, anything
mono ./node_modules/vite/bin/vite.js
`

That's literally it. No configuration files. No package.json modifications.

## The Comparison

### pnpm workspace vs Mono

| Aspect | pnpm workspace | Mono |
|--------|----------------|------|
| Installation | Must install pnpm | Optional |
| Config Files | Needs pnpm-workspace.yaml | None needed |
| package.json | Must change to workspace:* | No modifications |
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

### vs npm `file:` Protocol

Traditional npm local dependency:

`json
{ "my-lib": "file:../packages/my-lib" }
`

| After modifying local package | npm `file:` | mono |
|------------------------------|:-----------:|:----:|
| Need to run `npm install` again? | ✅ Yes | ❌ No |
| Changes visible immediately? | ❌ No | ✅ Yes |

**With `file:` protocol**, npm copies the package to `node_modules`. Every time you modify the local package, you must run `npm install` again to update the copy.

**With mono**, imports are redirected to source code at runtime. No copying, no reinstalling.

> 💡 **Note**: Third-party packages from npm registry still require `npm install`. The \"No Install\" benefit applies to **local packages** only.

## Real-World Usage

I've been using mono for:
- **Compiler toolkit**: 5 interdependent packages (parser, transformer, codegen, etc.)
- **Vite plugin development**: Plugin + test projects in one repo
- **Teaching**: Students can clone with `npm install`, no pnpm required

### What Changed

**Before (pnpm workspace):**
```bash
# Modify package A
cd packages/core
npm run build

# Test in package B
cd ../app
npm run dev
```

**After (mono):
```bash
# Modify package A, test immediately
mono ./packages/app/src/index.ts
```

## When NOT to Use Mono

- **500+ package monorepos**: Use Nx or Turborepo
- **Need version constraints between local packages**: Use pnpm workspace
- **Team already on pnpm**: Migration cost may not be worth it

## The Philosophy

> Your project should remain a **standard npm project**. Tools should enhance, not replace.

Mono doesn't:
- Modify your package.json
- Create new config files
- Force a package manager on your team
- Lock you into a proprietary protocol

It just makes `import` work with your local TypeScript files during development.

## Quick Start

```bash
# 1. Install
npm install -g mono-mjs

# 2. (Optional) Add entry in local package's package.json
{
  "name": "my-package",
  "local": "./src/index.ts"   // Optional, this is the default
}

# 3. Run
mono ./src/index.ts
```

## How It Works

Mono uses Node.js ESM Loader Hooks to intercept module resolution at runtime:

```
Your code: import { utils } from 'my-utils'
                    ↓
Mono intercepts: Detects my-utils is a local package
                    ↓
Redirects: → /path/to/my-utils/src/index.ts
```

This means:
- ✅ **Use TypeScript source directly** - No build needed
- ✅ **Changes take effect immediately** - No rebuild required
- ✅ **package.json stays clean** - No workspace:* protocol

## Try It Out

```bash
npm install -g mono-mjs
mono ./your-entry.ts
```

🔗 **GitHub**: [https://github.com/alamhubb/mono](https://github.com/alamhubb/mono)
📦 **NPM**: [mono-mjs](https://www.npmjs.com/package/mono-mjs)

---

## Discussion

What do you think? Is the "one package manager to rule them all" approach necessary for small-to-medium monorepos? Or should we have more lightweight alternatives?

I'd love to hear your thoughts, especially if you've struggled with pnpm workspace or npm link workflows.

---

**Keywords**: monorepo, typescript, npm, pnpm alternative, no workspace, local packages, developer experience, lightweight monorepo, zero config
