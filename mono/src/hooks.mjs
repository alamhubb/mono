/**
 * ESM Loader Hooks - 被 register() 加载的 hooks 模块
 * 拦截模块解析，对项目中的本地包应用源码入口
 *
 * 新逻辑：
 * - 向上查找最顶层的包含 .idea / .vscode / package.json 的目录作为根目录
 * - 从根目录递归向下查找所有有 package.json 的项目
 * - 根据 package.json 的 name 字段注册
 * - 默认使用 src/index.ts，如果配置了 monorepo 字段则使用配置的
 *
 * 注意：此文件使用纯 JavaScript，以便 Node.js 原生加载
 */

import { readFileSync, existsSync, readdirSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve as pathResolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// 根目录标识符列表
const ROOT_MARKERS = ['.idea', '.vscode', '.git', 'package.json'];

// 默认源码入口
const DEFAULT_ENTRY = './src/index.ts';

// 调试日志文件
const DEBUG_LOG = join(process.cwd(), 'mono-debug.log');

// 是否启用调试日志（设置环境变量 MONO_DEBUG=1 开启，或临时设为 true）
const DEBUG_ENABLED = process.env.MONO_DEBUG === '1' || true;

function debugLog(msg) {
    if (!DEBUG_ENABLED) return;
    // 同时输出到控制台和文件
    console.log(msg);
    try {
        appendFileSync(DEBUG_LOG, `${new Date().toISOString()} ${msg}\n`);
    } catch { }
}

if (DEBUG_ENABLED) {
    debugLog('[mono hooks] hooks.mjs 已加载');
}

// 缓存：workspace 包信息
let workspacePackages = null;

/**
 * 检查目录是否包含根目录标识
 */
function hasRootMarker(dir) {
    for (const marker of ROOT_MARKERS) {
        if (existsSync(join(dir, marker))) {
            return true;
        }
    }
    return false;
}

/**
 * 向上查找最顶层的根目录
 * 找到最顶层的包含 .idea / .vscode / package.json 的目录
 */
function findProjectRoot(startDir) {
    let currentDir = pathResolve(startDir);
    let topMostRoot = null;

    while (currentDir !== dirname(currentDir)) {
        if (hasRootMarker(currentDir)) {
            topMostRoot = currentDir;
        }
        currentDir = dirname(currentDir);
    }

    return topMostRoot;
}

/**
 * 递归向下查找所有有 package.json 的项目
 */
function findAllPackages(rootDir, packages) {
    // 跳过路径中包含 node_modules 的目录
    if (rootDir.includes('node_modules')) {
        debugLog(`[mono] 跳过 node_modules: ${rootDir}`);
        return;
    }

    const pkgPath = join(rootDir, 'package.json');

    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

            if (pkg.name) {
                // 确定入口：优先使用 monorepo 配置，否则使用默认值
                const entry = typeof pkg.monorepo === 'string' ? pkg.monorepo : DEFAULT_ENTRY;

                packages.set(pkg.name, {
                    name: pkg.name,
                    dir: rootDir,
                    monorepoEntry: entry
                });

                debugLog(`[mono] 发现包: ${pkg.name} -> ${entry}`);
            }
        } catch {
            // 忽略解析错误
        }
    }

    // 递归查找子目录
    try {
        const entries = readdirSync(rootDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                findAllPackages(join(rootDir, entry.name), packages);
            }
        }
    } catch {
        // 忽略读取错误
    }
}

/**
 * 初始化 workspace 信息
 * 从根目录递归向下收集所有包
 */
function initWorkspace() {
    if (workspacePackages !== null) return;

    workspacePackages = new Map();

    // 从当前工作目录开始，向上找最顶层根目录
    const cwd = process.cwd();
    const projectRoot = findProjectRoot(cwd);

    if (!projectRoot) {
        debugLog('[mono] 未找到项目根目录');
        return;
    }

    debugLog(`[mono] 项目根目录: ${projectRoot}`);

    // 从根目录递归向下查找所有包
    findAllPackages(projectRoot, workspacePackages);

    debugLog(`[mono] 共发现 ${workspacePackages.size} 个包`);

    // 生成配置文件
    writeMonoConfig(cwd);
}

/**
 * 生成 monoConfig.json 配置文件
 * 记录包名与文件地址的映射关系
 * 
 * @param {string} cwd 当前工作目录
 */
function writeMonoConfig(cwd) {
    const monoDir = join(cwd, '.mono');
    const configPath = join(monoDir, 'monoConfig.json');

    // 确保 mono 目录存在
    if (!existsSync(monoDir)) {
        try {
            mkdirSync(monoDir, { recursive: true });
        } catch (err) {
            debugLog(`[mono] 创建目录失败: ${err.message}`);
            return;
        }
    }

    // 构建包映射
    const config = {};
    for (const [name, pkg] of workspacePackages) {
        const entryPath = join(pkg.dir, pkg.monorepoEntry);
        config[name] = entryPath;
    }

    // 写入配置文件
    try {
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        debugLog(`[mono] 已生成配置文件: ${configPath}`);
    } catch (err) {
        debugLog(`[mono] 写入配置文件失败: ${err.message}`);
    }
}

/**
 * 判断是否是包的主入口导入（不是子路径导入）
 */
function isMainEntryImport(specifier) {
    // 跳过相对路径和绝对路径
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
        return false;
    }

    // 跳过 node: 和其他协议
    if (specifier.includes(':')) {
        return false;
    }

    // 处理 scoped 包名 @scope/name
    if (specifier.startsWith('@')) {
        const parts = specifier.split('/');
        // @scope/name 正好两部分是主入口
        // @scope/name/sub 三部分及以上是子路径
        return parts.length === 2;
    }

    // 普通包名 name
    // name 是主入口，name/sub 是子路径
    return !specifier.includes('/');
}

/**
 * ESM Loader: resolve hook
 * 拦截模块解析
 */
export async function resolve(specifier, context, nextResolve) {
    // 初始化 workspace 信息（只初始化一次）
    initWorkspace();

    // 只处理主入口导入
    if (!isMainEntryImport(specifier)) {
        return nextResolve(specifier, context);
    }

    // 检查是否是本地包
    const pkg = workspacePackages?.get(specifier);

    if (!pkg) {
        // 不是本地包，使用默认解析
        return nextResolve(specifier, context);
    }

    // 构造新的入口路径
    const newEntry = join(pkg.dir, pkg.monorepoEntry);
    const newUrl = pathToFileURL(newEntry).href;

    // 日志：显示拦截的包
    debugLog(`[mono] 拦截: ${specifier} -> ${pkg.monorepoEntry}`);

    return {
        url: newUrl,
        shortCircuit: true
    };
}
