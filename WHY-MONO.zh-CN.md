# 「链式污染」—— 一个 pnpm 项目如何逼着你把整条依赖链都改成 pnpm

> 我只想在本地开发时引用几个包的源码，为什么整条链路的所有项目都被迫安装 pnpm？这种"传染性"让我受够了。

## 核心痛点：pnpm 的链式污染

### 什么是链式污染？

假设你有这样的依赖关系：

```
项目 A（你正在开发的项目）
  └── 依赖 项目 B（本地包）
        └── 依赖 项目 C（本地包）
              └── 依赖 项目 D（本地包）
```

**如果项目 A 使用了 pnpm workspace：**

```
项目 A (pnpm) → 必须用 pnpm
  └── 项目 B → 必须用 pnpm（被污染）
        └── 项目 C → 必须用 pnpm（被污染）
              └── 项目 D → 必须用 pnpm（被污染）
```

**整条链路都被「感染」了！**

这意味着：
- 🔗 **所有相关项目**都必须改成 pnpm
- 👥 **所有参与开发的人**都必须安装 pnpm
- 🔧 **所有 CI/CD 环境**都必须配置 pnpm
- 📦 如果你的项目 B 被**其他人依赖**，他们也被迫用 pnpm

---

## 痛点详解：pnpm workspace 的那些坑

### 1. 新人入坑的第一道门槛

你兴致勃勃地克隆了一个开源项目，运行 `npm install`，然后... 💥

```
npm ERR! Invalid tag name "workspace:*": Tags may not have any characters that encodeURIComponent encodes.
```

这个错误让无数新手一脸懵逼。原因？项目使用了 pnpm workspace，而你用的是 npm。

**解决方案？** 去安装 pnpm：

```bash
npm install -g pnpm
pnpm install
```

但问题来了：
- 为什么我需要为了一个项目安装一个新的包管理器？
- 我的其他项目都用 npm，现在要混用了？
- CI/CD 环境也需要配置 pnpm？

### 2. workspace:* 协议的兼容性噩梦

`workspace:*` 是 pnpm 的私有协议，它让你的 `package.json` 变成了这样：

```json
{
  "dependencies": {
    "@my-org/utils": "workspace:*",
    "@my-org/core": "workspace:^1.0.0"
  }
}
```

这意味着：
- ❌ **npm/yarn 无法识别** - 直接报错
- ❌ **发布前必须转换** - 需要用 `pnpm publish` 自动替换
- ❌ **锁定了包管理器** - 团队所有人必须用 pnpm
- ❌ **第三方工具可能不兼容** - 某些构建工具无法解析

### 3. 项目改造成本高

想把现有的 npm 项目改造成 pnpm workspace？你需要：

1. **创建 pnpm-workspace.yaml**
   ```yaml
   packages:
     - 'packages/*'
     - 'apps/*'
   ```

2. **修改所有 package.json**
   ```json
   {
     "dependencies": {
       "my-local-pkg": "workspace:*"  // 原来是 "^1.0.0"
     }
   }
   ```

3. **迁移 lock 文件**
   - 删除 `package-lock.json`
   - 运行 `pnpm install` 生成 `pnpm-lock.yaml`

4. **更新 CI/CD 配置**
   ```yaml
   # 原来
   - run: npm install
   
   # 改造后
   - run: npm install -g pnpm
   - run: pnpm install
   ```

5. **通知团队成员**
   - 所有人都要安装 pnpm
   - 所有人都要学习 pnpm 命令

**这一切，只是为了能够引用本地包的源码？**

### 4. 构建依赖的困扰

即使配置好了 workspace，你仍然需要：

```bash
# 先构建依赖包
cd packages/core
npm run build

# 再构建主包
cd packages/app
npm run build
```

每次修改依赖包代码，都要重新构建。这大大降低了开发效率。

---

## 解决方案：Mono - 零侵入式 Monorepo 开发

### 核心理念：不改变，只增强

Mono 的设计哲学很简单：

> **你的项目依然是一个标准的 npm 项目，Mono 只是在开发时帮你做模块解析。**

### 对比：pnpm workspace vs Mono

| 方面 | pnpm workspace | Mono |
|------|----------------|------|
| **安装** | 必须安装 pnpm | 可选安装 mono-mjs |
| **配置文件** | 需要 pnpm-workspace.yaml | 不需要任何配置文件 |
| **package.json** | 需要修改为 workspace:* | 完全不需要修改 |
| **克隆后使用** | 必须用 pnpm install | npm/yarn/pnpm 都可以 |
| **构建依赖** | 需要先构建 | 直接使用源码 |
| **团队协作** | 所有人必须用 pnpm | 不强制任何工具 |
| **发布流程** | 需要特殊处理 | 标准 npm publish |

### 各方案横向对比

| 方案 | 免安装 | 免编译 | 零配置 | 自动发现 | 复杂度 |
|------|:------:|:------:|:------:|:--------:|:------:|
| npm 原生 | ❌ | ❌ | ❌ | ❌ | 高 |
| pnpm workspace | ✅ | ⚠️ | ❌ | ✅ | 中 |
| tsconfig paths | ✅ | ✅ | ❌ | ❌ | 低 |
| Nx | ✅ | ✅ | ❌ | ✅ | 极高 |
| **mono** | ✅ | ✅ | ✅ | ✅ | **极低** |

> ⚠️ = 视配置而定

### 🔄 对比 npm `file:` 协议

传统 npm 本地依赖方式：

```json
{ "my-lib": "file:../packages/my-lib" }
```

| 修改本地包后 | npm `file:` | mono |
|--------------|:-----------:|:----:|
| 需要重新运行 `npm install`？ | ✅ 是 | ❌ 否 |
| 修改立即生效？ | ❌ 否 | ✅ 是 |

**使用 `file:` 协议时**，npm 会将包复制到 `node_modules`。每次修改本地包后，必须重新运行 `npm install` 来更新副本。

**使用 mono 时**，导入在运行时被重定向到源码。无需复制，无需重新安装。

> 💡 **注意**：来自 npm 仓库的第三方包仍然需要 `npm install`。「无需安装」的优势仅适用于**本地包**。

### 使用方式：一行命令

```bash
# 安装
npm install -g mono-mjs

# 运行（自动使用本地包源码）
mono ./src/index.ts

# 配合 Vite
mono ./node_modules/vite/bin/vite.js
```

**就这样！** 不需要任何配置，不需要修改任何文件。

### 工作原理

Mono 利用 Node.js 的 ESM Loader Hooks，在运行时拦截模块解析：

```
你的代码: import { utils } from 'my-utils'
                    ↓
Mono 拦截: 检测到 my-utils 是本地包
                    ↓
重定向: → /path/to/my-utils/src/index.ts
```

这意味着：
- ✅ **直接使用 TypeScript 源码** - 无需构建
- ✅ **修改立即生效** - 无需重新构建
- ✅ **package.json 保持干净** - 没有 workspace:* 协议

---

## Mono 适合什么样的用户？

### ✅ 非常适合

- **个人开发者** - 有多个相互依赖的 npm 包，想在本地快速开发调试
- **小团队** - 不想强制所有人使用特定的包管理器
- **开源项目维护者** - 希望贡献者能用任何包管理器克隆和运行项目
- **教学和演示** - 需要快速搭建多包项目的演示环境
- **渐进式迁移** - 正在考虑 monorepo 方案，想先试试水

### ⚠️ 可能不适合

- **大型企业级 monorepo** - 如果你有 500+ 个包，可能需要更专业的工具（如 Nx、Turborepo）
- **需要严格版本管理** - 如果你需要精确控制每个包的版本依赖关系
- **已经深度使用 pnpm workspace** - 迁移成本可能不值得

---

## 实际案例：从 pnpm workspace 到 Mono

### 改造前（pnpm workspace）

```
project/
├── pnpm-workspace.yaml        # 必须的配置
├── pnpm-lock.yaml             # pnpm 专用 lock 文件
├── packages/
│   ├── core/
│   │   └── package.json       # "main": "./dist/index.js"
│   └── app/
│       └── package.json       # "@my/core": "workspace:*"
```

**问题**：
- 新成员克隆后必须安装 pnpm
- 修改 core 后必须重新构建

### 改造后（Mono）

```
project/
├── package-lock.json          # 标准 npm lock 文件
├── packages/
│   ├── core/
│   │   └── package.json       # 添加 "local": "./src/index.ts"
│   └── app/
│       └── package.json       # "@my/core": "^1.0.0"（标准版本号）
```

**优势**：
- 新成员克隆后 `npm install` 即可
- 开发时运行 `mono ./src/index.ts` 自动使用源码
- 生产构建使用正常的 `npm run build`

---

## 开始使用

```bash
# 1. 安装
npm install -g mono-mjs

# 2. （可选）在本地包的 package.json 添加入口
{
  "name": "my-package",
  "local": "./src/index.ts"   // 可选，默认就是这个
}

# 3. 运行
mono ./src/index.ts
```

## 了解更多

- 📦 **GitHub**: https://github.com/alamhubb/mono
- 📖 **文档**: [mono-mjs](./mono) | [vite-plugin-mono](./vite-plugin-mono)

---

> **Mono - 让 Monorepo 开发回归简单**

