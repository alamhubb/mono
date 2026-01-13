#!/usr/bin/env node

/**
 * mono CLI 入口
 * 
 * 命令:
 * - mono <file>        运行 TypeScript 文件，注入自定义 loader
 * - mono --debug <file> 开启调试模式运行
 * - mono i             递归安装所有嵌套 monorepo 的依赖
 * 
 * loader.mjs 会自动：
 * 1. 注册 tsx ESM loader（TypeScript 支持）
 * 2. 注册 mono resolve hooks（包名拦截）
 */

import spawn from 'cross-spawn';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 获取 loader 文件路径（file:// URL 格式）
 */
function getLoaderUrl() {
    const loaderPath = join(__dirname, '..', 'src', 'loader.mjs');
    return pathToFileURL(loaderPath).href;
}

/**
 * 递归查找所有嵌套的 monorepo 目录
 */
function findAllMonorepos(startDir) {
    const monorepos = [];

    function scanDir(dir) {
        const pkgPath = join(dir, 'package.json');

        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

                // 如果有 workspaces 配置，这是一个 monorepo
                if (pkg.workspaces) {
                    monorepos.push(dir);

                    // 继续查找嵌套的 workspace
                    let patterns = [];
                    if (Array.isArray(pkg.workspaces)) {
                        patterns = pkg.workspaces;
                    } else if (pkg.workspaces?.packages) {
                        patterns = pkg.workspaces.packages;
                    }

                    for (const pattern of patterns) {
                        const dirs = findMatchingDirs(dir, pattern);
                        for (const subDir of dirs) {
                            scanDir(subDir);
                        }
                    }
                }
            } catch {
                // 忽略解析错误
            }
        }
    }

    scanDir(startDir);
    return monorepos;
}

/**
 * 查找匹配 pattern 的目录
 */
function findMatchingDirs(root, pattern) {
    const dirs = [];

    if (pattern.endsWith('/*')) {
        const baseDir = join(root, pattern.slice(0, -2));
        if (existsSync(baseDir)) {
            const entries = readdirSync(baseDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    dirs.push(join(baseDir, entry.name));
                }
            }
        }
    } else if (pattern.endsWith('/**')) {
        const baseDir = join(root, pattern.slice(0, -3));
        findDirsRecursive(baseDir, dirs);
    } else {
        const dir = join(root, pattern);
        if (existsSync(dir)) {
            dirs.push(dir);
        }
    }

    return dirs;
}

/**
 * 递归查找目录
 */
function findDirsRecursive(dir, result) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
            const subDir = join(dir, entry.name);
            result.push(subDir);
            findDirsRecursive(subDir, result);
        }
    }
}

/**
 * 在指定目录执行 npm install
 */
async function runNpmInstall(dir) {
    return new Promise((resolve, reject) => {
        console.log(`\n[mono i] Installing in: ${dir}`);

        const child = spawn('npm', ['install'], {
            cwd: dir,
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`npm install failed with code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

/**
 * mono i - 递归安装所有嵌套 monorepo 的依赖
 */
async function installCommand() {
    const cwd = process.cwd();
    console.log('[mono i] 扫描嵌套 monorepo...');

    const monorepos = findAllMonorepos(cwd);

    if (monorepos.length === 0) {
        console.log('[mono i] 未找到任何 monorepo');
        return;
    }

    console.log(`[mono i] 找到 ${monorepos.length} 个 monorepo:`);
    for (const dir of monorepos) {
        console.log(`  - ${dir}`);
    }

    // 从外到内安装（父级先安装）
    for (const dir of monorepos) {
        try {
            await runNpmInstall(dir);
        } catch (err) {
            console.error(`[mono i] 安装失败: ${dir}`, err.message);
            process.exit(1);
        }
    }

    console.log('\n[mono i] ✅ 所有 monorepo 安装完成！');
}

/**
 * 运行 TypeScript 文件
 */
function runCommand(args, debug = false) {
    const loaderUrl = getLoaderUrl();

    const nodeArgs = [
        `--import=${loaderUrl}`,
        ...args
    ];

    // 如果开启 debug，设置环境变量
    const env = { ...process.env };
    if (debug) {
        env.MONO_DEBUG = '1';
    }

    const child = spawn('node', nodeArgs, {
        stdio: 'inherit',
        env
    });

    child.on('close', (code) => {
        process.exit(code ?? 0);
    });

    child.on('error', (err) => {
        console.error('mono: 无法启动 node 进程', err.message);
        process.exit(1);
    });
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);

    // 检查调试参数（支持多种格式，可在任意位置）
    let debug = false;
    const filteredArgs = [];

    for (const arg of args) {
        if (arg === '--debug' || arg === '-debug' || arg === '-d' || arg === 'debug' || arg === 'd') {
            debug = true;
        } else {
            filteredArgs.push(arg);
        }
    }

    // 检查是否是 install 命令
    if (filteredArgs[0] === 'i' || filteredArgs[0] === 'install') {
        await installCommand();
        return;
    }

    // 否则运行 TypeScript 文件
    runCommand(filteredArgs, debug);
}

main();
