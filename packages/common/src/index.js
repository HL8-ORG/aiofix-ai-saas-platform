"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_NAME = exports.VERSION = void 0;
// 常量导出
__exportStar(require("./constants"), exports);
// 异常导出
__exportStar(require("./exceptions"), exports);
// 类型导出
__exportStar(require("./types"), exports);
// 测试工厂导出
__exportStar(require("./test-factories"), exports);
// 版本信息
exports.VERSION = '1.0.0';
exports.PACKAGE_NAME = '@aiofix/common';
//# sourceMappingURL=index.js.map