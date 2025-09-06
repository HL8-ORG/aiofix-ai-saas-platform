/**
 * Aiofix通知模块
 *
 * 提供统一的通知发送功能，包括：
 * - 邮件通知
 * - 短信通知
 * - 推送通知
 * - 通知模板
 * - NestJS集成
 *
 * @fileoverview 通知模块入口
 * @author AI开发团队
 * @since 1.0.0
 */

// 通知服务导出
export * from './services/notification.service';
export * from './interfaces/notification.interface';

// 通知渠道导出
export * from './channels/email.channel';
export * from './channels/sms.channel';
export * from './channels/push.channel';

// 通知模块导出
export * from './notification.module';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/notification';
