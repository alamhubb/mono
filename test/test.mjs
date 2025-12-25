/**
 * 测试 monorepo-cli 功能
 */

import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixtureDir = join(__dirname, 'fixture');

/**
 * 运行命令并返回输出
 */
function runCommand(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { cwd, shell: true });
        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => { stdout += data; });
        child.stderr?.on('data', (data) => { stderr += data; });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', reject);
    });
}

async function main() {
    console.log('=== 测试 monorepo-cli ===\n');

    // 测试 1: 普通 node 运行
    console.log('1. 普通 node 运行（应该使用 dist/index.js）');
    const nodeResult = await runCommand('node', ['packages/app/index.js'], fixtureDir);
    console.log(nodeResult.stdout);
    const nodeUseDist = nodeResult.stdout.includes('[DIST]');
    console.log(`   结果: ${nodeUseDist ? '✅ 通过' : '❌ 失败'}\n`);

    // 测试 2: mono 运行
    console.log('2. mono 运行（应该使用 src/index.js）');
    const monoResult = await runCommand('mono', ['packages/app/index.js'], fixtureDir);
    console.log(monoResult.stdout);
    const monoUseSrc = monoResult.stdout.includes('[SRC]');
    console.log(`   结果: ${monoUseSrc ? '✅ 通过' : '❌ 失败'}\n`);

    console.log('=== 测试完成 ===');

    if (!nodeUseDist || !monoUseSrc) {
        process.exit(1);
    }
}

main().catch(console.error);
