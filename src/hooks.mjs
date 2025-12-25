/**
 * ESM Loader Hooks - 被 register() 加载的 hooks 模块
 * 拦截模块解析，对 workspace 中的本地包应用 monorepo 配置
 *
 * 支持多层嵌套 workspace：
 * - 从当前目录向上查找所有 workspace
 * - 就近优先：近的 workspace 包优先于远的
 *
 * 注意：此文件使用纯 JavaScript，以便 Node.js 原生加载
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve as pathResolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// 缓存：workspace 包信息
let workspacePackages = null;

/**
 * 初始化 workspace 信息
 * 支持多层嵌套 workspace，从近到远收集所有包
 */
function initWorkspace() {
    if (workspacePackages !== null) return;

    workspacePackages = new Map();

    // 从当前工作目录开始，向上查找所有 workspace
    const cwd = process.cwd();
    const workspaceRoots = findAllWorkspaceRoots(cwd);

    // 从近到远遍历所有 workspace root
    // 近的优先：如果同名包已存在，不覆盖
    for (const wsRoot of workspaceRoots) {
        collectWorkspacePackages(wsRoot, workspacePackages);
    }
}

/**
 * 向上查找所有包含 workspaces 配置的 package.json
 * 返回从近到远排序的 workspace root 列表
 */
function findAllWorkspaceRoots(startDir) {
    const roots = [];
    let currentDir = pathResolve(startDir);

    while (currentDir !== dirname(currentDir)) {
        const pkgPath = join(currentDir, 'package.json');

        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
                if (pkg.workspaces) {
                    roots.push(currentDir);
                }
            } catch {
                // 忽略解析错误
            }
        }

        currentDir = dirname(currentDir);
    }

    return roots;
}

/**
 * 收集单个 workspace 的所有包
 * 包括直接子包和嵌套 workspace 的子包
 */
function collectWorkspacePackages(wsRoot, packages) {
    const rootPkgPath = join(wsRoot, 'package.json');
    if (!existsSync(rootPkgPath)) return;

    let rootPkg;
    try {
        rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    } catch {
        return;
    }

    // 支持两种 workspaces 格式
    let patterns = [];
    if (Array.isArray(rootPkg.workspaces)) {
        patterns = rootPkg.workspaces;
    } else if (rootPkg.workspaces?.packages) {
        patterns = rootPkg.workspaces.packages;
    }

    for (const pattern of patterns) {
        const dirs = findMatchingDirsSync(wsRoot, pattern);

        for (const dir of dirs) {
            const pkgPath = join(dir, 'package.json');

            if (existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

                    if (pkg.name) {
                        // 就近优先：如果已存在，不覆盖
                        if (!packages.has(pkg.name)) {
                            packages.set(pkg.name, {
                                name: pkg.name,
                                dir: dir,
                                monorepoEntry: typeof pkg.monorepo === 'string' ? pkg.monorepo : undefined
                            });
                        }

                        // 如果这个包自己也是 workspace，递归收集它的子包
                        if (pkg.workspaces) {
                            collectWorkspacePackages(dir, packages);
                        }
                    }
                } catch {
                    // 忽略
                }
            }
        }
    }
}

/**
 * 同步查找匹配的目录
 */
function findMatchingDirsSync(root, pattern) {
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
        findDirsRecursiveSync(baseDir, dirs);
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
function findDirsRecursiveSync(dir, result) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
            const subDir = join(dir, entry.name);
            result.push(subDir);
            findDirsRecursiveSync(subDir, result);
        }
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

    // 检查是否是 workspace 中的包
    const pkg = workspacePackages?.get(specifier);

    if (!pkg || !pkg.monorepoEntry) {
        // 不是 workspace 包，或没有 monorepo 配置，使用默认解析
        return nextResolve(specifier, context);
    }

    // 构造新的入口路径
    const newEntry = join(pkg.dir, pkg.monorepoEntry);
    const newUrl = pathToFileURL(newEntry).href;

    return {
        url: newUrl,
        shortCircuit: true
    };
}
