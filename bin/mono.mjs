#!/usr/bin/env node

/**
 * mono CLI 入口
 * 透明代理 tsx 命令，注入自定义 loader
 */

import spawn from 'cross-spawn';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 获取 loader 文件路径（file:// URL 格式）
 */
function getLoaderUrl() {
    const loaderPath = join(__dirname, '..', 'src', 'monorepo-loader.mjs');
    return pathToFileURL(loaderPath).href;
}

/**
 * 主函数
 */
function main() {
    // 获取传递给 mono 的所有参数
    const args = process.argv.slice(2);

    // 获取 loader 路径
    const loaderUrl = getLoaderUrl();

    // 构造 tsx 命令参数
    // 注入 monorepo loader，其他参数原样传递给 tsx
    const tsxArgs = [
        `--import=${loaderUrl}`,
        ...args
    ];

    // 获取本地 tsx 路径（使用 monorepo-cli 自身安装的 tsx）
    // Windows 上需要使用 .cmd 文件
    const tsxBin = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
    const tsxPath = join(__dirname, '..', 'node_modules', '.bin', tsxBin);

    // 启动 tsx 进程
    const child = spawn(tsxPath, tsxArgs, {
        stdio: 'inherit',
        env: process.env
    });

    // 转发退出码
    child.on('close', (code) => {
        process.exit(code ?? 0);
    });

    // 处理错误
    child.on('error', (err) => {
        console.error('mono: 无法启动 tsx 进程', err.message);
        process.exit(1);
    });
}

main();
