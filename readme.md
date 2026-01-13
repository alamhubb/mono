# Monorepo Tools

> 用于 monorepo 项目的开发工具集合

这是一个工具集合目录，包含两个独立的包：

## 📦 包列表

### 1. [mono](./mono)

Node.js CLI 工具，用于在开发时自动使用本地包的源代码。

```bash
npm install -g mono

# 运行 TypeScript 文件
mono ./src/index.ts
```

### 2. [vite-plugin-mono](./vite-plugin-mono)

Vite 插件，用于在浏览器端自动使用本地包的源代码。

```bash
npm install -D vite-plugin-mono
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import viteMono from 'vite-plugin-mono'

export default defineConfig({
  plugins: [viteMono()]
})
```

## 核心特性

- 🔍 **自动发现** - 递归扫描项目，自动发现所有本地包
- 🎯 **源码开发** - 直接使用 TypeScript 源码，无需构建
- ⚡️ **快速热更新** - 修改立即生效
- 📝 **配置文件** - 自动生成 `.mono/monoConfig.json` 记录包映射

## 工作原理

两个工具采用相同的包发现逻辑：

1. 向上查找项目根目录（包含 `.idea`/`.vscode`/`.git`）
2. 从根目录递归向下查找所有 `package.json`
3. 根据 `package.json` 的 `name` 字段注册包
4. 使用 `monorepo` 字段指定的入口，默认为 `./src/index.ts`

## 配置

在包的 `package.json` 中添加 `monorepo` 字段指定源码入口：

```json
{
  "name": "my-package",
  "monorepo": "./src/index.ts"
}
```

## License

MIT
