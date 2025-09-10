import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { UserId } from '@aiofix/shared';

/**
 * @class NotificationService
 * @description
 * 通知服务适配器，负责处理各种类型的通知发送。
 *
 * 通知服务职责：
 * 1. 发送多种类型的通知（邮件、短信、推送）
 * 2. 管理通知模板和内容
 * 3. 处理通知发送状态跟踪
 * 4. 支持多租户通知配置
 *
 * 通知类型：
 * 1. 邮件通知：通过邮件服务发送
 * 2. 短信通知：通过短信服务发送
 * 3. 推送通知：通过推送服务发送
 * 4. 站内通知：通过站内消息系统发送
 *
 * 多租户支持：
 * 1. 租户级通知配置
 * 2. 租户级通知模板
 * 3. 租户级发送限制
 * 4. 租户级通知统计
 *
 * @param {ConfigService} configService 配置服务
 * @param {Logger} logger 日志服务
 * @param {EmailService} emailService 邮件服务
 *
 * @example
 * ```typescript
 * const notificationService = new NotificationService(configService, logger, emailService);
 * await notificationService.sendWelcomeNotification(userId, 'John');
 * ```
 * @since 1.0.0
 */
@Injectable()
export class NotificationService {
  constructor(
    // private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly emailService: any, // EmailService 类型
  ) {}

  /**
   * @method sendWelcomeNotification
   * @description 发送欢迎通知
   * @param {UserId} userId 用户ID
   * @param {string} firstName 用户名字
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<void>}
   * @throws {NotificationSendError} 当通知发送失败时抛出
   *
   * 发送流程：
   * 1. 获取用户通知偏好
   * 2. 根据偏好选择通知渠道
   * 3. 发送通知到各个渠道
   * 4. 记录发送结果
   */
  async sendWelcomeNotification(
    userId: UserId,
    firstName: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      // 1. 获取用户通知偏好
      const preferences = await this.getUserNotificationPreferences(userId);

      // 2. 发送邮件通知
      if (preferences.email.enabled) {
        await this.emailService.sendWelcomeEmail(
          await this.getUserEmail(userId),
          firstName,
          tenantId,
        );
      }

      // 3. 发送站内通知
      if (preferences.inApp.enabled) {
        await this.sendInAppNotification(userId, {
          type: 'welcome',
          title: '欢迎加入！',
          message: `欢迎 ${firstName}，感谢您注册我们的平台！`,
          tenantId,
        });
      }

      // 4. 记录发送日志
      await this.logNotificationSent('welcome', userId, tenantId);

      this.logger.log(`Welcome notification sent to user: ${userId.value}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome notification to user: ${userId.value}`,
        error,
      );
      throw new NotificationSendError(
        `Failed to send welcome notification: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method sendUserStatusChangeNotification
   * @description 发送用户状态变更通知
   * @param {UserId} userId 用户ID
   * @param {string} oldStatus 旧状态
   * @param {string} newStatus 新状态
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<void>}
   * @throws {NotificationSendError} 当通知发送失败时抛出
   */
  async sendUserStatusChangeNotification(
    userId: UserId,
    oldStatus: string,
    newStatus: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);

      // 发送邮件通知
      if (preferences.email.enabled) {
        await this.emailService.sendNotificationEmail(
          await this.getUserEmail(userId),
          '账户状态变更通知',
          'user-status-change',
          {
            oldStatus: this.getStatusDisplayName(oldStatus),
            newStatus: this.getStatusDisplayName(newStatus),
            changeTime: new Date().toLocaleString('zh-CN'),
          },
          tenantId,
        );
      }

      // 发送站内通知
      if (preferences.inApp.enabled) {
        await this.sendInAppNotification(userId, {
          type: 'status_change',
          title: '账户状态变更',
          message: `您的账户状态已从 ${this.getStatusDisplayName(oldStatus)} 变更为 ${this.getStatusDisplayName(newStatus)}`,
          tenantId,
        });
      }

      await this.logNotificationSent('user_status_change', userId, tenantId);

      this.logger.log(
        `User status change notification sent to user: ${userId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send user status change notification to user: ${userId.value}`,
        error,
      );
      throw new NotificationSendError(
        `Failed to send user status change notification: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method sendPasswordChangeNotification
   * @description 发送密码变更通知
   * @param {UserId} userId 用户ID
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<void>}
   * @throws {NotificationSendError} 当通知发送失败时抛出
   */
  async sendPasswordChangeNotification(
    userId: UserId,
    tenantId?: string,
  ): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);

      // 发送邮件通知
      if (preferences.email.enabled) {
        await this.emailService.sendNotificationEmail(
          await this.getUserEmail(userId),
          '密码变更通知',
          'password-change',
          {
            changeTime: new Date().toLocaleString('zh-CN'),
            ipAddress: '未知', // TODO: 从请求上下文获取IP地址
            userAgent: '未知', // TODO: 从请求上下文获取User Agent
          },
          tenantId,
        );
      }

      // 发送站内通知
      if (preferences.inApp.enabled) {
        await this.sendInAppNotification(userId, {
          type: 'password_change',
          title: '密码已变更',
          message: '您的账户密码已成功变更，如有疑问请联系客服。',
          tenantId,
        });
      }

      await this.logNotificationSent('password_change', userId, tenantId);

      this.logger.log(
        `Password change notification sent to user: ${userId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password change notification to user: ${userId.value}`,
        error,
      );
      throw new NotificationSendError(
        `Failed to send password change notification: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method sendSecurityAlertNotification
   * @description 发送安全警报通知
   * @param {UserId} userId 用户ID
   * @param {string} alertType 警报类型
   * @param {string} message 警报消息
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<void>}
   * @throws {NotificationSendError} 当通知发送失败时抛出
   */
  async sendSecurityAlertNotification(
    userId: UserId,
    alertType: string,
    message: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      const preferences = await this.getUserNotificationPreferences(userId);

      // 安全警报通常需要立即通知，优先使用邮件和短信
      if (preferences.email.enabled) {
        await this.emailService.sendNotificationEmail(
          await this.getUserEmail(userId),
          '安全警报',
          'security-alert',
          {
            alertType,
            message,
            alertTime: new Date().toLocaleString('zh-CN'),
          },
          tenantId,
        );
      }

      // 发送短信通知（如果启用）
      if (preferences.sms.enabled) {
        await this.sendSmsNotification(
          await this.getUserPhoneNumber(userId),
          `安全警报：${message}`,
        );
      }

      // 发送站内通知
      if (preferences.inApp.enabled) {
        await this.sendInAppNotification(userId, {
          type: 'security_alert',
          title: '安全警报',
          message,
          priority: 'high',
          tenantId,
        });
      }

      await this.logNotificationSent('security_alert', userId, tenantId);

      this.logger.log(
        `Security alert notification sent to user: ${userId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send security alert notification to user: ${userId.value}`,
        error,
      );
      throw new NotificationSendError(
        `Failed to send security alert notification: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method getUserNotificationPreferences
   * @description 获取用户通知偏好设置
   * @param {UserId} userId 用户ID
   * @returns {Promise<NotificationPreferences>} 通知偏好设置
   * @private
   */
  private async getUserNotificationPreferences(
    userId: UserId,
  ): Promise<NotificationPreferences> {
    // TODO: 从用户实体或数据库获取通知偏好设置
    // 这里返回默认设置
    return {
      email: { enabled: true, types: ['account', 'security'] },
      sms: { enabled: false, types: [] },
      push: { enabled: true, types: ['general'] },
      inApp: { enabled: true, types: ['all'] },
    };
  }

  /**
   * @method getUserEmail
   * @description 获取用户邮箱地址
   * @param {UserId} userId 用户ID
   * @returns {Promise<string>} 用户邮箱
   * @private
   */
  private async getUserEmail(userId: UserId): Promise<string> {
    // TODO: 从用户实体或数据库获取邮箱地址
    return 'user@example.com';
  }

  /**
   * @method getUserPhoneNumber
   * @description 获取用户手机号码
   * @param {UserId} userId 用户ID
   * @returns {Promise<string>} 用户手机号
   * @private
   */
  private async getUserPhoneNumber(userId: UserId): Promise<string> {
    // TODO: 从用户实体或数据库获取手机号码
    return '+86 138 0013 8000';
  }

  /**
   * @method sendInAppNotification
   * @description 发送站内通知
   * @param {UserId} userId 用户ID
   * @param {InAppNotificationData} data 通知数据
   * @returns {Promise<void>}
   * @private
   */
  private async sendInAppNotification(
    userId: UserId,
    data: InAppNotificationData,
  ): Promise<void> {
    // TODO: 实现站内通知发送逻辑
    // 1. 保存通知到数据库
    // 2. 通过WebSocket推送给在线用户
    // 3. 更新用户未读通知计数
    this.logger.log(`In-app notification sent to user: ${userId.value}`);
  }

  /**
   * @method sendSmsNotification
   * @description 发送短信通知
   * @param {string} phoneNumber 手机号码
   * @param {string} message 消息内容
   * @returns {Promise<void>}
   * @private
   */
  private async sendSmsNotification(
    phoneNumber: string,
    message: string,
  ): Promise<void> {
    // TODO: 实现短信发送逻辑
    // 1. 集成短信服务提供商
    // 2. 处理短信发送状态
    // 3. 记录短信发送日志
    this.logger.log(`SMS notification sent to: ${phoneNumber}`);
  }

  /**
   * @method getStatusDisplayName
   * @description 获取状态显示名称
   * @param {string} status 状态值
   * @returns {string} 显示名称
   * @private
   */
  private getStatusDisplayName(status: string): string {
    const statusNames: Record<string, string> = {
      pending: '待激活',
      active: '正常',
      disabled: '已禁用',
      locked: '已锁定',
      suspended: '已暂停',
      deleted: '已删除',
    };

    return statusNames[status] || status;
  }

  /**
   * @method logNotificationSent
   * @description 记录通知发送日志
   * @param {string} notificationType 通知类型
   * @param {UserId} userId 用户ID
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<void>}
   * @private
   */
  private async logNotificationSent(
    notificationType: string,
    userId: UserId,
    tenantId?: string,
  ): Promise<void> {
    // TODO: 实现通知发送日志记录
    // 1. 记录到数据库
    // 2. 更新通知统计
    // 3. 记录到日志文件
    this.logger.log(
      `Notification sent: ${notificationType} to user ${userId.value} (tenant: ${tenantId || 'platform'})`,
    );
  }
}

/**
 * 通知偏好设置接口
 */
interface NotificationPreferences {
  email: { enabled: boolean; types: string[] };
  sms: { enabled: boolean; types: string[] };
  push: { enabled: boolean; types: string[] };
  inApp: { enabled: boolean; types: string[] };
}

/**
 * 站内通知数据接口
 */
interface InAppNotificationData {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  tenantId?: string;
}

/**
 * 通知发送异常
 */
export class NotificationSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationSendError';
  }
}
