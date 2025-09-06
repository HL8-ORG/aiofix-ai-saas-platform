/**
 * Aiofix配置模块
 *
 * 提供统一的配置管理功能，包括：
 * - 环境变量管理
 * - 配置验证
 * - 配置类型安全
 * - 配置热重载
 * - NestJS集成
 *
 * @fileoverview 配置模块入口
 * @author AI开发团队
 * @since 1.0.0
 */

// 配置服务导出
export * from './services/config.service';
export * from './interfaces/config.interface';

// 配置类导出
export * from './config/app.config';
export * from './config/database.config';
export * from './config/redis.config';

// 配置模块导出
export * from './config.module';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/config';
