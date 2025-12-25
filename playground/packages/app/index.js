// 测试应用 - 导入 @playground/utils 并打印结果
import { greet, VERSION } from '@playground/utils';

console.log('=== monorepo-cli 测试 ===');
console.log('greet("World"):', greet('World'));
console.log('VERSION:', VERSION);
console.log('========================');

// 根据输出判断使用的是哪个入口：
// - [SRC] 开头 = monorepo 模式生效，使用源码入口
// - [DIST] 开头 = 普通模式，使用编译产物入口
