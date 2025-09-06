/**
 * Aiofix数据库模块
 *
 * 提供统一的数据库管理功能，包括：
 * - MikroORM集成
 * - 数据库连接管理
 * - 迁移管理
 * - 多数据库支持
 * - NestJS集成
 *
 * @fileoverview 数据库模块入口
 * @author AI开发团队
 * @since 1.0.0
 */

// 数据库服务导出
export * from './services/database.service';
export * from './interfaces/database.interface';

// 数据库配置导出
export * from './config/database.config';

// 数据库模块导出
export * from './database.module';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/database';
