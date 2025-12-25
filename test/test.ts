/**
 * 测试 workspace 解析功能
 */

import { findWorkspaceRoot, getWorkspacePackages } from '../src/workspace.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    console.log('=== 测试 monorepo-cli ===\n');

    const fixtureDir = join(__dirname, 'fixture');

    // 测试 findWorkspaceRoot
    console.log('1. 测试 findWorkspaceRoot');
    const wsRoot = findWorkspaceRoot(join(fixtureDir, 'packages', 'utils'));
    console.log(`   从 packages/utils 查找 workspace 根目录: ${wsRoot}`);
    console.log(`   期望: ${fixtureDir}`);
    console.log(`   结果: ${wsRoot === fixtureDir ? '✅ 通过' : '❌ 失败'}\n`);

    // 测试 getWorkspacePackages
    console.log('2. 测试 getWorkspacePackages');
    const packages = await getWorkspacePackages(fixtureDir);
    console.log(`   找到 ${packages.size} 个包:`);

    for (const [name, pkg] of packages) {
        console.log(`   - ${name}`);
        console.log(`     目录: ${pkg.dir}`);
        console.log(`     monorepo 入口: ${pkg.monorepoEntry || '(无)'}`);
    }

    const utilsPkg = packages.get('@test/utils');
    const hasMonorepoEntry = utilsPkg?.monorepoEntry === './src/index.ts';
    console.log(`\n   @test/utils 的 monorepo 入口: ${utilsPkg?.monorepoEntry}`);
    console.log(`   期望: ./src/index.ts`);
    console.log(`   结果: ${hasMonorepoEntry ? '✅ 通过' : '❌ 失败'}\n`);

    console.log('=== 测试完成 ===');
}

main().catch(console.error);
