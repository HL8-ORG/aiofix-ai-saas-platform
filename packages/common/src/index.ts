/**
 * 公共基础包入口文件
 *
 * 导出所有公共基础组件，包括：
 * - 常量定义
 * - 异常类
 * - 基础类型
 * - 工具函数
 * - 装饰器
 * - 验证器
 *
 * @fileoverview 公共基础包 - 提供通用的工具函数、装饰器、异常等基础组件
 * @author AI开发团队
 * @since 1.0.0
 */

// 常量导出
export * from './constants';

// 异常导出
export * from './exceptions';

// 类型导出
export * from './types';

// 测试工厂导出
export * from './test-factories';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/common';
