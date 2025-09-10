/**
 * 外部服务适配器导出
 *
 * 包含用户模块所需的外部服务适配器：
 * - EmailService: 邮件服务适配器，处理邮件发送和模板管理
 * - NotificationService: 通知服务适配器，处理多种类型的通知发送
 * - AuditService: 审计服务适配器，记录用户操作和系统事件的审计日志
 */

export * from './email.service';
export * from './notification.service';
export * from './audit.service';
