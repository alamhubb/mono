/**
 * vite-plugin-mono
 * 
 * Vite 插件版本的 mono，用于拦截浏览器端的模块解析
 * 自动发现本地包并使用源码入口
 * 
 * 与 Node.js 端的 mono CLI 配合使用，实现完整的源码开发体验
 */

import type { Plugin, ResolvedConfig } from 'vite'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, dirname, resolve } from 'path'

// 根目录标识符列表
const ROOT_MARKERS = ['.idea', '.vscode', '.git', 'package.json']

// 默认源码入口
const DEFAULT_ENTRY = './src/index.ts'

interface PackageInfo {
    name: string
    dir: string
    entry: string
}

interface ViteMonoOptions {
    /** 是否输出调试日志，默认 true */
    debug?: boolean
    /** 额外的包映射 */
    packages?: Record<string, string>
}

/**
 * 检查目录是否包含根目录标识
 */
function hasRootMarker(dir: string): boolean {
    for (const marker of ROOT_MARKERS) {
        if (existsSync(join(dir, marker))) {
            return true
        }
    }
    return false
}

/**
 * 向上查找最顶层的根目录
 */
function findProjectRoot(startDir: string): string | null {
    let currentDir = resolve(startDir)
    let topMostRoot: string | null = null

    while (currentDir !== dirname(currentDir)) {
        if (hasRootMarker(currentDir)) {
            topMostRoot = currentDir
        }
        currentDir = dirname(currentDir)
    }

    return topMostRoot
}

/**
 * 递归向下查找所有有 package.json 的项目
 */
function findAllPackages(rootDir: string, packages: Map<string, PackageInfo>): void {
    // 跳过路径中包含 node_modules 的目录
    if (rootDir.includes('node_modules')) {
        return
    }

    const pkgPath = join(rootDir, 'package.json')

    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

            if (pkg.name) {
                // 确定入口：优先使用 monorepo 配置，否则使用默认值
                const entry = typeof pkg.monorepo === 'string' ? pkg.monorepo : DEFAULT_ENTRY

                packages.set(pkg.name, {
                    name: pkg.name,
                    dir: rootDir,
                    entry
                })
            }
        } catch {
            // 忽略解析错误
        }
    }

    // 递归查找子目录
    try {
        const entries = readdirSync(rootDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                findAllPackages(join(rootDir, entry.name), packages)
            }
        }
    } catch {
        // 忽略读取错误
    }
}

/**
 * 判断是否是包的主入口导入（不是子路径导入）
 */
function isMainEntryImport(specifier: string): boolean {
    // 跳过相对路径和绝对路径
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
        return false
    }

    // 跳过 node: 和其他协议
    if (specifier.includes(':')) {
        return false
    }

    // 处理 scoped 包名 @scope/name
    if (specifier.startsWith('@')) {
        const parts = specifier.split('/')
        // @scope/name 正好两部分是主入口
        return parts.length === 2
    }

    // 普通包名 name
    return !specifier.includes('/')
}

/**
 * vite-plugin-mono
 * 
 * 自动发现本地包并使用源码入口
 */
export function viteMono(options: ViteMonoOptions = {}): Plugin {
    const { debug = false, packages: extraPackages = {} } = options
    const packages = new Map<string, PackageInfo>()
    let config: ResolvedConfig

    function log(msg: string): void {
        if (debug) {
            console.log(msg)
        }
    }

    return {
        name: 'vite-plugin-mono',
        enforce: 'pre',

        configResolved(resolvedConfig) {
            config = resolvedConfig

            // 从当前工作目录开始，向上找最顶层根目录
            const cwd = process.cwd()
            const projectRoot = findProjectRoot(cwd)

            if (!projectRoot) {
                log('[vite-mono] 未找到项目根目录')
                return
            }

            log(`[vite-mono] 项目根目录: ${projectRoot}`)

            // 从根目录递归向下查找所有包
            findAllPackages(projectRoot, packages)

            // 添加额外的包映射
            for (const [name, entry] of Object.entries(extraPackages)) {
                packages.set(name, {
                    name,
                    dir: cwd,
                    entry
                })
            }

            log(`[vite-mono] 共发现 ${packages.size} 个本地包`)
        },

        resolveId(source) {
            // 只处理主入口导入
            if (!isMainEntryImport(source)) {
                return null
            }

            // 检查是否是本地包
            const pkg = packages.get(source)

            if (!pkg) {
                return null
            }

            // 构造新的入口路径
            const resolvedPath = join(pkg.dir, pkg.entry)

            // 检查文件是否存在
            if (!existsSync(resolvedPath)) {
                log(`[vite-mono] 警告: ${source} 的入口文件不存在: ${resolvedPath}`)
                return null
            }

            log(`[vite-mono] 拦截: ${source} -> ${pkg.entry}`)

            return resolvedPath
        }
    }
}

export default viteMono
