# mono

> Node.js CLI tool for monorepo - auto-discover local packages and use source code

在开发时自动使用本地包的 TypeScript 源代码，无需构建。

## 安装

```bash
npm install -g mono
```

## 使用

### 运行 TypeScript 文件

```bash
mono ./src/index.ts
```

### 批量安装依赖

```bash
mono i
```

## 工作原理

1. 向上查找项目根目录（包含 `.idea`/`.vscode`/`.git`）
2. 从根目录递归向下查找所有 `package.json`
3. 拦截包导入，将包名重定向到源码入口
4. 使用 `tsx` 编译 TypeScript 文件

## 配置

在包的 `package.json` 中添加 `monorepo` 字段指定源码入口：

```json
{
  "name": "my-package",
  "monorepo": "./src/index.ts"
}
```

## 调试

设置环境变量开启调试日志：

```bash
MONO_DEBUG=1 mono ./src/index.ts
```

## License

MIT
