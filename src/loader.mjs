/**
 * ESM Loader 入口
 * 使用 register() API 注册自定义 hooks
 * 
 * 用法: node --import=./src/loader.mjs app.js
 * 
 * 注意：此文件使用纯 JavaScript，以便 Node.js 原生加载
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 注册 hooks 模块
const hooksPath = join(__dirname, 'hooks.mjs');
register(pathToFileURL(hooksPath).href, import.meta.url);
