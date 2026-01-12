# monorepo-cli

一个解决 Node.js conditions 全局污染问题的 CLI 工具。

## 安装

```bash
npm install -g monorepo-cli
```

## 使用方法

`mono` 命令用法与 `tsx` 完全一致：

```bash
mono app.ts              # 等价于 tsx app.ts，但本地包用源码
mono --no-cache app.ts   # 参数原样传递给 tsx
```

### 配置步骤

**零配置自动发现**：mono 会自动扫描整个项目，无需配置 workspaces！

1. **确保本地包有 `name` 字段**：

```json
{
  "name": "@my/utils",
  "type": "module",
  "main": "./dist/index.js"
}
```

2. **可选：自定义源码入口**（如果不是 `src/index.ts`）：

```json
{
  "name": "@my/utils",
  "type": "module",
  "main": "./dist/index.js",
  "monorepo": "./lib/main.ts"  // 可选，默认是 ./src/index.ts
}
```

> ⚠️ **重要**：`type: "module"` 是**必须的**！mono 使用 Node.js ESM Loader Hooks，只支持 ESM 模块系统。

### 效果

- `mono app.ts` → 本地包用源码，第三方包**不受影响**
- `tsx app.ts` → 所有包用默认入口（编译产物）

## 目标群体

**需要在本地维护多个相互依赖的 npm 包的开发者。**

### ✅ 对使用者透明

- 发布后的包与纯 npm 开发的库**完全一样**
- 使用者只需要 npm 环境，**不需要安装 mono**
- 标准的 `npm install` 即可使用

### ✅ 对开发者友好

- 只有**开发阶段**需要 mono，享受源码热更新
- 发布后就是普通的 npm 包，走 `main` / `exports` 入口
- 其他开发者 fork 项目后，**不需要 mono 也能开发**，只需 `npm run build` 编译一下即可

### ✅ 零锁定

| 场景 | mono | pnpm workspace |
|------|------|----------------|
| 使用者安装 | `npm install` ✅ | `npm install` ✅ |
| 其他开发者 fork | 只需编译 ✅ | 必须安装 pnpm + 改写依赖 ❌ |
| 切换包管理器 | 随时切换 ✅ | 被 pnpm 绑定 ❌ |

## 核心痛点

在 Monorepo 开发中，我们希望：
- **开发时**：直接引用本地包的 **源码**（`src/index.ts`），享受热更新、无需编译
- **生产时**：引用 **编译产物**（`dist/index.js`），确保兼容性

但现有方案都有问题：

### ❌ `--conditions` 的全局污染

```bash
node --conditions=development app.js
```

`development` 条件会影响**所有包**，包括 `node_modules` 中的第三方依赖，导致不可预知的行为。

### ❌ `tsconfig paths` 的维护负担

```json
{
  "compilerOptions": {
    "paths": {
      "@my/utils": ["packages/utils/src/index.ts"],
      "@my/core": ["packages/core/src/index.ts"]
      // 每增加一个包都要手动维护...
    }
  }
}
```

需要**手动维护**每个包的路径映射，容易与 `package.json` 不同步，还需要额外的 `tsconfig-paths` loader。

### ❌ `pnpm workspace:*` 的传染性

```json
{
  "dependencies": {
    "@my/utils": "workspace:*"
  }
}
```

所有 fork 这个库的开发者都**必须安装 pnpm**，并改写所有依赖声明。

### ✅ mono 的自动发现

mono **自动扫描**整个项目，无需任何配置：
- **自动发现**：向上找到项目根目录（有 `.idea` / `.vscode` / `package.json`），递归扫描所有包
- **零配置**：有 `package.json` 的目录自动注册，默认使用 `src/index.ts`
- **完全透明**：使用者和其他开发者无需知道 mono 的存在


## 为什么选择 mono

### 方案对比

| 方案 | 隔离性 | 配置复杂度 | 自动发现 | npm 完美兼容 |
|------|--------|-----------|----------|------------||
| `--conditions` | ❌ 全局生效 | ✅ 简单 | ❌ 需配置 | ✅ 无需改造 |
| `pnpm workspace:*` | ✅ 按包配置 | ⚠️ 需额外配置 | ⚠️ 需配置 | ❌ 需改造依赖 |
| `tsconfig paths` | ✅ 按包配置 | ❌ 需手动维护 | ❌ 需手动维护 | ❌ 需改造配置 |
| **mono** | ✅ 仅本地包 | ✅ 零配置 | ✅ 自动扫描 | ✅ 无需改造 |

### 核心优势

| 特性 | mono | 其他方案 |
|------|------|----------|
| 🛡️ **防污染** | 仅对项目本地包生效 | --conditions 会污染 node_modules |
| ⚡ **零配置** | 自动扫描所有包，无需配置 | workspaces/paths 需手动维护 |
| 🔧 **npm 兼容** | 完美兼容 npm | pnpm workspace:* 需改造，不兼容 npm |
| 🚀 **自动发现** | 递归扫描整个项目 | 需手动列出每个包 |

## 实现原理

### 技术栈

- **Node.js ESM Loader Hooks**：Node.js 18.19+ 提供的 `--import` + `register()` API
- **多 Loader 链式调用**：mono 的 loader 和 tsx 的 loader 共存

### 执行流程

```
用户执行: mono app.ts

1. mono 启动
   └─ spawn('node', ['--import=monorepo-loader.mjs', 'app.ts'])

2. monorepo-loader.mjs 被加载
   ├─ 注册 tsx ESM loader（TypeScript 编译）
   └─ 注册 mono resolve hook（包名拦截）

3. initWorkspace() - 首次导入时触发
   │
   ├─ findProjectRoot() - 向上查找项目根目录
   │   └─ 找最顶层有 .idea / .vscode / package.json 的目录
   │
   └─ findAllPackages() - 从根目录递归向下扫描
       ├─ 找到 package.json
       ├─ 读取 name 字段
       └─ 注册包：默认 src/index.ts，或使用 monorepo 配置

4. 开始执行 app.ts

5. 遇到 import "@my/utils"
   │
   ├─ 调用 hooks.resolve("@my/utils")
   │   ├─ 检查本地包缓存
   │   ├─ 找到 @my/utils
   │   └─ 返回 { url: ".../src/index.ts", shortCircuit: true }
   │
   └─ tsx 的 load hook 被调用
       └─ 编译 src/index.ts（TypeScript → JavaScript）

6. 继续执行...
```

### Loader 链式调用

```
import "@my/utils"
    │
    ▼
monorepo-loader.resolve()
    │
    ├─ 是本地包？
    │   └─ 是 → 返回 src/index.ts（shortCircuit: true）
    │
    └─ 否 → 调用 nextResolve()
              │
              ▼
        tsx-loader.resolve()  ← tsx 处理 TypeScript
              │
              ▼
        Node.js 默认解析
```

### 核心文件

| 文件 | 作用 |
|------|------|
| `bin/mono.mjs` | CLI 入口，调用 tsx 并注入 loader |
| `src/monorepo-loader.mjs` | 使用 `register()` 注册 hooks |
| `src/hooks.mjs` | 实现 `resolve()` 拦截模块解析 |

## 设计原则

1. **零配置**：自动扫描整个项目，无需任何配置
2. **最小干预**：只拦截模块解析，不做其他处理
3. **智能默认**：默认使用 `src/index.ts`，支持 `monorepo` 字段自定义
4. **子路径不处理**：只处理主入口（`@my/utils`），子路径（`@my/utils/helper`）走默认逻辑
5. **完全透明**：使用者和其他开发者无需知道 mono 的存在

## 限制

- 只支持简单字符串格式的 `monorepo` 配置
- 子路径导入不受影响，走默认解析
- 需要项目有明确的根目录标识（`.git` / `.idea` / `.vscode` / `package.json`）

## ⚠️ 重要：编译时依赖 vs 运行时依赖

**mono 只能拦截 Node.js 端的模块解析，无法拦截浏览器端的模块解析！**

### 两个不同的模块解析环境

| 环境 | 解析器 | mono 拦截 | 需要 dist |
|------|--------|-----------|-----------|
| **Node.js 端**（编译时） | Node.js ESM loader | ✅ 成功 | ❌ 不需要 |
| **浏览器端**（运行时） | Vite 自己的解析器 | ❌ 无效 | ✅ 必须有 |

### 具体分类

**编译时依赖**（在 Node.js 中运行，mono 拦截成功，不需要 dist）：
- Vite 插件（如 `vite-plugin-cssts`、`vite-plugin-ovs`）
- 编译器（如 `cssts-compiler`、`ovs-compiler`）
- 编译器的依赖（如 `slime-parser`、`slime-ast`、`subhuti` 等）

**运行时依赖**（在浏览器中运行，需要 dist）：
- `cssts-ts` - 编译后的代码 `import { cssts } from 'cssts-ts'` 在浏览器运行
- `ovsjs` - 编译后的代码 `import from 'ovsjs'` 在浏览器运行

### 规律

> **如果一个包的代码最终会在浏览器中执行，它必须有 dist 或正确的 exports 配置。mono loader 只能拦截 Node.js 层面的模块解析。**

### 如何判断

问自己：**这个包的代码是在哪里运行的？**

- 如果是在 `npm run dev` 启动时由 Node.js 加载 → **编译时依赖** → mono 可拦截
- 如果是编译后注入到浏览器代码中运行 → **运行时依赖** → 必须有 dist

## 自动包发现机制

mono 采用全新的**自动扫描**机制，无需任何 workspaces 配置：

```
parserall/                      # 项目根目录
├── .git/                       # 根目录标识之一
├── .idea/                      # 根目录标识之一
├── slime/
│   └── packages/
│       ├── slime-parser/
│       │   └── package.json    # ← 自动发现并注册
│       └── subhuti/
│           └── package.json    # ← 自动发现并注册
└── ovs/
    └── packages/
        └── ovs-core/
            └── package.json    # ← 自动发现并注册
```

### 查找逻辑

1. **向上查找根目录**：找最顶层有 `.git` / `.idea` / `.vscode` / `package.json` 的目录
2. **递归扫描**：从根目录向下递归扫描所有目录（跳过 `node_modules` 和 `.` 开头的）
3. **自动注册**：发现 `package.json` 就读取 `name` 字段并注册
4. **智能入口**：默认 `src/index.ts`，有 `monorepo` 配置就用配置的

### 跨项目引用

在 `slime-parser` 中引用 `ovs-core`：

```js
import { something } from 'ovs-core';  // mono 会自动找到并使用源码
```

无需任何配置，mono 自动处理！

### mono vs npm workspaces

mono 和 npm workspaces **完全独立**：

| 工具 | 作用时机 | 功能 | 是否必需 |
|------|---------|------|---------|
| **npm workspaces** | `npm install` 时 | 管理 node_modules 结构，link 本地包 | 可选 |
| **mono** | 运行时 | 拦截模块解析，使用源码入口 | 开发时推荐 |

**核心区别**：
- npm workspaces：需要配置，用于依赖管理
- mono：零配置，自动扫描所有包，无论是否使用 workspaces

### 递归扫描机制

mono 像**爬虫**一样自动发现所有包：

```
mono 启动
    │
    ▼
findProjectRoot()                 # 向上找最顶层根目录
    │                             # 找有 .git / .idea / .vscode / package.json 的
    ▼
findAllPackages(根目录)           # 递归向下扫描
    │
    ├─ 找到 package.json
    │   ├─ 读取 name 字段
    │   └─ 注册：默认 src/index.ts，或用 monorepo 配置
    │
    ├─ 递归扫描子目录（跳过 node_modules 和 .xxx）
    │
    └─ 继续扫描...
```

**完全零配置**：只要有 `package.json` 的 `name` 字段，就会被自动发现和注册！

## License

MIT
