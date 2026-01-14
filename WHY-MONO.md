# "Chain Pollution" — How One pnpm Project Forces Your Entire Dependency Chain to Use pnpm

> I just want to reference local package source code during development. Why does the entire dependency chain have to install pnpm? I'm fed up with this "contagion".

## Core Problem: pnpm's Chain Pollution

### What is Chain Pollution?

Imagine you have this dependency relationship:

```
Project A (the project you're developing)
  └── depends on Project B (local package)
        └── depends on Project C (local package)
              └── depends on Project D (local package)
```

**If Project A uses pnpm workspace:**

```
Project A (pnpm) → must use pnpm
  └── Project B → must use pnpm (infected)
        └── Project C → must use pnpm (infected)
              └── Project D → must use pnpm (infected)
```

**The entire chain is "infected"!**

This means:
- 🔗 **All related projects** must be converted to pnpm
- 👥 **Everyone involved** must install pnpm
- 🔧 **All CI/CD environments** must be configured for pnpm
- 📦 If your Project B is **used by others**, they're forced to use pnpm too

---

## Pain Points Explained: The Pitfalls of pnpm workspace

### 1. First Barrier for Newcomers

You excitedly clone an open-source project, run `npm install`, and then... 💥

```
npm ERR! Invalid tag name "workspace:*": Tags may not have any characters that encodeURIComponent encodes.
```

This error leaves countless beginners confused. Why? The project uses pnpm workspace, but you're using npm.

**Solution?** Go install pnpm:

```bash
npm install -g pnpm
pnpm install
```

But here's the problem:
- Why do I need to install a new package manager for just one project?
- My other projects all use npm, now I have to mix?
- CI/CD environments also need pnpm configuration?

### 2. The Compatibility Nightmare of workspace:*

`workspace:*` is pnpm's proprietary protocol. It makes your `package.json` look like this:

```json
{
  "dependencies": {
    "@my-org/utils": "workspace:*",
    "@my-org/core": "workspace:^1.0.0"
  }
}
```

This means:
- ❌ **npm/yarn can't recognize it** - Direct error
- ❌ **Must convert before publishing** - Need `pnpm publish` to auto-replace
- ❌ **Locks in package manager** - Everyone on the team must use pnpm
- ❌ **Third-party tools may not be compatible** - Some build tools can't parse it

### 3. High Project Migration Cost

Want to convert an existing npm project to pnpm workspace? You need to:

1. **Create pnpm-workspace.yaml**
   ```yaml
   packages:
     - 'packages/*'
     - 'apps/*'
   ```

2. **Modify all package.json files**
   ```json
   {
     "dependencies": {
       "my-local-pkg": "workspace:*"  // was "^1.0.0"
     }
   }
   ```

3. **Migrate lock files**
   - Delete `package-lock.json`
   - Run `pnpm install` to generate `pnpm-lock.yaml`

4. **Update CI/CD configuration**
   ```yaml
   # Before
   - run: npm install
   
   # After
   - run: npm install -g pnpm
   - run: pnpm install
   ```

5. **Notify team members**
   - Everyone needs to install pnpm
   - Everyone needs to learn pnpm commands

**All this, just to reference local package source code?**

### 4. The Build Dependency Hassle

Even with workspace configured, you still need to:

```bash
# Build dependency package first
cd packages/core
npm run build

# Then build main package
cd packages/app
npm run build
```

Every time you modify dependency code, you have to rebuild. This significantly reduces development efficiency.

---

## The Solution: Mono - Zero-intrusion Monorepo Development

### Core Philosophy: Don't Change, Just Enhance

Mono's design philosophy is simple:

> **Your project remains a standard npm project. Mono just helps with module resolution during development.**

### Comparison: pnpm workspace vs Mono

| Aspect | pnpm workspace | Mono |
|--------|----------------|------|
| **Installation** | Must install pnpm | Optionally install mono-mjs |
| **Config Files** | Needs pnpm-workspace.yaml | No config files needed |
| **package.json** | Must change to workspace:* | No modifications needed |
| **After Cloning** | Must use pnpm install | npm/yarn/pnpm all work |
| **Build Dependencies** | Need to build first | Use source code directly |
| **Team Collaboration** | Everyone must use pnpm | No tool requirements |
| **Publishing** | Needs special handling | Standard npm publish |

### Usage: One Command

```bash
# Install
npm install -g mono-mjs

# Run (automatically uses local package source)
mono ./src/index.ts

# With Vite
mono ./node_modules/vite/bin/vite.js
```

**That's it!** No configuration needed, no file modifications.

### How It Works

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

---

## Who is Mono For?

### ✅ Perfect For

- **Individual developers** - Have multiple interdependent npm packages, want quick local dev/debug
- **Small teams** - Don't want to force everyone to use a specific package manager
- **Open source maintainers** - Want contributors to clone and run with any package manager
- **Teaching and demos** - Need to quickly set up multi-package demo environments
- **Gradual migration** - Considering monorepo solutions, want to test the waters first

### ⚠️ May Not Be Suitable For

- **Large enterprise monorepos** - If you have 500+ packages, you may need more professional tools (like Nx, Turborepo)
- **Strict version management** - If you need precise control over each package's version dependencies
- **Already deep into pnpm workspace** - Migration cost may not be worth it

---

## Real Example: From pnpm workspace to Mono

### Before (pnpm workspace)

```
project/
├── pnpm-workspace.yaml        # Required config
├── pnpm-lock.yaml             # pnpm-specific lock file
├── packages/
│   ├── core/
│   │   └── package.json       # "main": "./dist/index.js"
│   └── app/
│       └── package.json       # "@my/core": "workspace:*"
```

**Problems**:
- New members must install pnpm after cloning
- Must rebuild after modifying core

### After (Mono)

```
project/
├── package-lock.json          # Standard npm lock file
├── packages/
│   ├── core/
│   │   └── package.json       # Add "local": "./src/index.ts"
│   └── app/
│       └── package.json       # "@my/core": "^1.0.0" (standard version)
```

**Advantages**:
- New members can `npm install` after cloning
- Run `mono ./src/index.ts` to automatically use source code
- Production build uses normal `npm run build`

---

## Getting Started

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

## Learn More

- 📦 **GitHub**: https://github.com/alamhubb/mono
- 📖 **Docs**: [mono-mjs](./mono) | [vite-plugin-mono](./vite-plugin-mono)

---

> **Mono - Making Monorepo Development Simple Again**

