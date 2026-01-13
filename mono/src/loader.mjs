/**
 * ESM Loader 入口
 * 使用 register() API 注册自定义 hooks
 * 
 * 用法: node --import=./src/loader.mjs app.ts
 * 
 * 功能：
 * 1. 注册 tsx 的 ESM loader 以支持 TypeScript 编译
 * 2. 注册 mono 的 resolve hooks 以拦截包名解析到源码
 * 
 * 注册顺序说明：
 * Node.js loader hooks 使用洋葱模型，后注册的先被调用。
 * 我们希望 mono 先拦截包名，再由 tsx 编译 .ts 文件。
 * 所以先注册 tsx，再注册 mono（后注册先调用）。
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 是否启用调试日志（设置环境变量 MONO_DEBUG=1 开启）
const DEBUG_ENABLED = process.env.MONO_DEBUG === '1';

if (DEBUG_ENABLED) console.log('[mono] 加载 loader.mjs');

// 1. 先注册 tsx 的 ESM loader（TypeScript 编译）
if (DEBUG_ENABLED) console.log('[mono] 注册 tsx ESM loader...');
await import('tsx/esm');

// 2. 再注册 mono 的 resolve hooks（包名拦截）
// 后注册先调用，所以 mono 会先于 tsx 处理 resolve
const hooksPath = join(__dirname, 'hooks.mjs');
if (DEBUG_ENABLED) console.log('[mono] 注册 mono hooks:', hooksPath);
register(pathToFileURL(hooksPath).href, import.meta.url);

