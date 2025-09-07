/**
 * @file index.ts
 * @description 共享包主入口文件
 *
 * 提供跨业务域使用的通用组件：
 * - 标识符值对象 (identifiers)
 * - 通用值对象 (common)
 * - 业务值对象 (business)
 * - 通用枚举 (enums)
 * - 通用类型 (types)
 * - 工具函数 (utils)
 */

// 标识符值对象
export * from './identifiers';

// 通用值对象
export * from './common';

// 业务值对象 - 暂时注释，待后续实现
// export * from './business';

// 通用枚举
export * from './enums';

// 通用类型
export * from './types';

// 工具函数
export * from './utils';
