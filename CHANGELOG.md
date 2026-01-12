# Monorepo CLI 更新日志

## v0.0.2 - 2026-01-12

### 🚀 重大改进：全新的自动包发现机制

#### 核心变更

1. **零配置自动扫描**
   - 不再依赖 npm workspaces 配置
   - 自动从项目根目录递归扫描所有包
   - 只需要 `package.json` 有 `name` 字段即可

2. **智能根目录识别**
   - 新增 `.git` 作为根目录标识
   - 完整的根目录标识列表：`.git` / `.idea` / `.vscode` / `package.json`
   - 向上查找**最顶层**的根目录

3. **默认源码入口**
   - 默认使用 `src/index.ts` 作为源码入口
   - 支持通过 `"monorepo": "./custom/path.ts"` 自定义
   - 完全向后兼容

4. **node_modules 过滤优化**
   - 正确跳过路径中包含 `node_modules` 的所有目录
   - 避免扫描第三方依赖
   - 大幅提升扫描性能

#### 使用示例

**之前（需要配置）：**
```json
// 根目录 package.json
{
  "workspaces": ["packages/*"]
}

// 每个包的 package.json
{
  "name": "@my/utils",
  "monorepo": "./src/index.ts"  // 必须配置
}
```

**现在（零配置）：**
```json
// 只需要 name 字段
{
  "name": "@my/utils"
  // monorepo 字段可选，默认使用 src/index.ts
}
```

#### 性能对比

测试项目：`d:\project\parserall`（包含多个子项目）

- **优化前**：扫描 151 个包（包含 node_modules 中的包）
- **优化后**：扫描 57 个包（仅本地源码包）
- **性能提升**：~62% 减少

#### 破坏性变更

⚠️ 无破坏性变更，完全向后兼容

#### 文档更新

- ✅ 更新配置步骤说明
- ✅ 更新方案对比表格
- ✅ 更新实现原理和执行流程
- ✅ 更新设计原则和限制说明
- ✅ 重写"多层嵌套 Workspace 支持" → "自动包发现机制"

#### 已知问题

无

---

## v0.0.1 - 初始版本

- 基于 npm workspaces 的 monorepo 源码拦截
- 支持多层嵌套 workspace
- 需要显式配置 `monorepo` 字段
