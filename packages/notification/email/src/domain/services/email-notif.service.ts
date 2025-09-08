import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';
import { NotifType } from '@aiofix/core/src/domain/value-objects/notif-type.vo';
import { NotifPriority } from '@aiofix/core/src/domain/value-objects/notif-priority.vo';
import { EmailAddress } from '../value-objects/email-address.vo';
import {
  EmailProvider,
  EmailProviderValidator,
} from '../value-objects/email-provider.vo';
import { EmailContent } from '../value-objects/email-content.vo';
import { TemplateId } from '../value-objects/template-id.vo';

/**
 * @class EmailNotifService
 * @description
 * 邮件通知领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调邮件通知和用户偏好之间的业务规则
 * 2. 处理邮件通知和租户设置之间的关联关系
 * 3. 管理邮件发送策略的复杂计算逻辑
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的邮件计算逻辑
 * 2. 提供可重用的邮件规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 *
 * @example
 * ```typescript
 * const emailService = new EmailNotifService();
 * const canSend = emailService.canSendEmail(userId, tenantId, type);
 * const priority = emailService.calculatePriority(type, urgency);
 * ```
 * @since 1.0.0
 */
export class EmailNotifService {
  private readonly providerValidator = new EmailProviderValidator();

  /**
   * @method canSendEmail
   * @description 判断是否可以发送邮件，跨聚合权限计算
   * @param {UserId} userId 用户ID
   * @param {TenantId} tenantId 租户ID
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否可以发送
   *
   * 业务逻辑：
   * 1. 检查用户是否属于指定租户
   * 2. 验证用户邮件偏好设置
   * 3. 检查租户邮件策略
   * 4. 考虑邮件类型限制
   */
  public canSendEmail(
    userId: UserId,
    tenantId: TenantId,
    type: NotifType,
  ): boolean {
    // 基础验证
    if (!userId || !tenantId || !type) {
      return false;
    }

    // 检查邮件类型是否被允许
    if (this.isRestrictedEmailType(type)) {
      return false;
    }

    // 检查租户邮件策略
    if (!this.isTenantEmailEnabled(tenantId, type)) {
      return false;
    }

    return true;
  }

  /**
   * @method calculatePriority
   * @description 计算邮件发送优先级，无状态优先级计算
   * @param {NotifType} type 通知类型
   * @param {boolean} isUrgent 是否紧急
   * @param {Record<string, any>} metadata 元数据
   * @returns {NotifPriority} 计算出的优先级
   */
  public calculatePriority(
    type: NotifType,
    isUrgent: boolean = false,
    metadata: Record<string, unknown> = {},
  ): NotifPriority {
    // 紧急邮件直接设为最高优先级
    if (isUrgent) {
      return NotifPriority.CRITICAL;
    }

    // 根据通知类型确定基础优先级
    const basePriority = this.getBasePriorityByType(type);

    // 根据元数据调整优先级
    const adjustedPriority = this.adjustPriorityByMetadata(
      basePriority,
      metadata,
    );

    return adjustedPriority;
  }

  /**
   * @method validateEmailContent
   * @description 验证邮件内容的合法性
   * @param {EmailContent} content 邮件内容
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否合法
   */
  public validateEmailContent(content: EmailContent, type: NotifType): boolean {
    // 基础内容验证
    if (!content) {
      return false;
    }

    // 根据类型验证内容格式
    if (!this.validateContentByType(content, type)) {
      return false;
    }

    return true;
  }

  /**
   * @method shouldSendEmail
   * @description 判断是否应该发送邮件
   * @param {UserId} userId 用户ID
   * @param {NotifType} type 通知类型
   * @param {NotifPriority} priority 通知优先级
   * @returns {boolean} 是否应该发送
   */
  public shouldSendEmail(
    userId: UserId,
    type: NotifType,
    priority: NotifPriority,
  ): boolean {
    // 高优先级邮件总是发送
    if (
      priority === NotifPriority.CRITICAL ||
      priority === NotifPriority.URGENT
    ) {
      return true;
    }

    // 系统邮件总是发送
    if (type === NotifType.SYSTEM) {
      return true;
    }

    // 其他情况根据用户偏好决定
    return true; // 简化实现，实际应该查询用户偏好
  }

  /**
   * @method selectEmailProvider
   * @description 选择合适的邮件服务提供商
   * @param {TenantId} tenantId 租户ID
   * @param {NotifPriority} priority 通知优先级
   * @param {NotifType} type 通知类型
   * @returns {EmailProvider} 邮件服务提供商
   */
  public selectEmailProvider(
    tenantId: TenantId,
    priority: NotifPriority,
    type: NotifType,
  ): EmailProvider {
    // 高优先级邮件使用云服务提供商
    if (
      priority === NotifPriority.CRITICAL ||
      priority === NotifPriority.URGENT
    ) {
      return EmailProvider.SENDGRID;
    }

    // 系统邮件使用可靠的云服务提供商
    if (type === NotifType.SYSTEM) {
      return EmailProvider.SENDGRID;
    }

    // 其他情况根据租户配置选择
    return EmailProvider.SMTP; // 简化实现，实际应该查询租户配置
  }

  /**
   * @method calculateRetryDelay
   * @description 计算重试延迟时间（指数退避策略）
   * @param {number} retryCount 重试次数
   * @param {EmailProvider} provider 邮件服务提供商
   * @returns {number} 延迟时间（毫秒）
   */
  public calculateRetryDelay(
    retryCount: number,
    provider: EmailProvider,
  ): number {
    const baseDelay = 1000; // 1秒基础延迟
    const maxDelay = 300000; // 5分钟最大延迟

    // 指数退避：baseDelay * 2^retryCount
    const delay = baseDelay * Math.pow(2, retryCount);

    // 根据服务提供商调整延迟
    const providerMultiplier = this.getProviderRetryMultiplier(provider);
    const adjustedDelay = delay * providerMultiplier;

    return Math.min(adjustedDelay, maxDelay);
  }

  /**
   * @method isRetryableError
   * @description 判断错误是否可重试
   * @param {string} errorMessage 错误信息
   * @param {EmailProvider} provider 邮件服务提供商
   * @returns {boolean} 是否可重试
   */
  public isRetryableError(
    errorMessage: string,
    provider: EmailProvider,
  ): boolean {
    // 永久性错误，不可重试
    const permanentErrors = [
      'invalid email address',
      'recipient not found',
      'mailbox full',
      'domain not found',
      'authentication failed',
    ];

    const lowerErrorMessage = errorMessage.toLowerCase();
    if (permanentErrors.some(error => lowerErrorMessage.includes(error))) {
      return false;
    }

    // 临时性错误，可以重试
    const temporaryErrors = [
      'timeout',
      'connection refused',
      'server unavailable',
      'rate limit exceeded',
      'temporary failure',
    ];

    return temporaryErrors.some(error => lowerErrorMessage.includes(error));
  }

  /**
   * @method isRestrictedEmailType
   * @description 检查邮件类型是否受限制
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否受限制
   * @private
   */
  private isRestrictedEmailType(type: NotifType): boolean {
    // 定义受限制的邮件类型
    const restrictedTypes: NotifType[] = [
      // 可以根据业务需求添加受限制的类型
    ];

    return restrictedTypes.includes(type);
  }

  /**
   * @method isTenantEmailEnabled
   * @description 检查租户是否启用邮件
   * @param {TenantId} tenantId 租户ID
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否启用
   * @private
   */
  private isTenantEmailEnabled(_tenantId: TenantId, _type: NotifType): boolean {
    // 简化实现，实际应该查询租户设置
    return true;
  }

  /**
   * @method getBasePriorityByType
   * @description 根据通知类型获取基础优先级
   * @param {NotifType} type 通知类型
   * @returns {NotifPriority} 基础优先级
   * @private
   */
  private getBasePriorityByType(type: NotifType): NotifPriority {
    const priorityMap: Record<NotifType, NotifPriority> = {
      [NotifType.SYSTEM]: NotifPriority.HIGH,
      [NotifType.PLATFORM_MANAGEMENT]: NotifPriority.HIGH,
      [NotifType.TENANT_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.USER_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.ORGANIZATION_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.DEPARTMENT_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.ROLE_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.PERMISSION_MANAGEMENT]: NotifPriority.HIGH,
      [NotifType.BUSINESS]: NotifPriority.NORMAL,
      [NotifType.REMINDER]: NotifPriority.LOW,
      [NotifType.ALERT]: NotifPriority.URGENT,
      [NotifType.INFO]: NotifPriority.LOW,
    };

    return priorityMap[type] ?? NotifPriority.NORMAL;
  }

  /**
   * @method adjustPriorityByMetadata
   * @description 根据元数据调整优先级
   * @param {NotifPriority} basePriority 基础优先级
   * @param {Record<string, any>} metadata 元数据
   * @returns {NotifPriority} 调整后的优先级
   * @private
   */
  private adjustPriorityByMetadata(
    basePriority: NotifPriority,
    metadata: Record<string, unknown>,
  ): NotifPriority {
    // 检查是否有紧急标记
    if (metadata.isUrgent === true) {
      return this.upgradePriority(basePriority);
    }

    // 检查是否有重要标记
    if (metadata.isImportant === true) {
      return this.upgradePriority(basePriority);
    }

    return basePriority;
  }

  /**
   * @method upgradePriority
   * @description 升级优先级
   * @param {NotifPriority} priority 当前优先级
   * @returns {NotifPriority} 升级后的优先级
   * @private
   */
  private upgradePriority(priority: NotifPriority): NotifPriority {
    const priorityOrder = [
      NotifPriority.LOW,
      NotifPriority.NORMAL,
      NotifPriority.HIGH,
      NotifPriority.URGENT,
      NotifPriority.CRITICAL,
    ];

    const currentIndex = priorityOrder.indexOf(priority);
    const nextIndex = Math.min(currentIndex + 1, priorityOrder.length - 1);

    return priorityOrder[nextIndex];
  }

  /**
   * @method validateContentByType
   * @description 根据通知类型验证内容格式
   * @param {EmailContent} content 邮件内容
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否合法
   * @private
   */
  private validateContentByType(
    content: EmailContent,
    type: NotifType,
  ): boolean {
    // 系统邮件需要特定格式
    if (type === NotifType.SYSTEM) {
      return this.validateSystemEmailContent(content);
    }

    // 警告邮件需要特定格式
    if (type === NotifType.ALERT) {
      return this.validateAlertEmailContent(content);
    }

    // 其他类型的基础验证
    return this.validateBasicEmailContent(content);
  }

  /**
   * @method validateSystemEmailContent
   * @description 验证系统邮件内容
   * @param {EmailContent} content 邮件内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateSystemEmailContent(content: EmailContent): boolean {
    // 系统邮件主题不能为空
    if (!content.subject.trim()) {
      return false;
    }

    // 系统邮件内容不能为空
    if (!content.htmlContent.trim() && !content.textContent.trim()) {
      return false;
    }

    return true;
  }

  /**
   * @method validateAlertEmailContent
   * @description 验证警告邮件内容
   * @param {EmailContent} content 邮件内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateAlertEmailContent(content: EmailContent): boolean {
    // 警告邮件主题不能为空
    if (!content.subject.trim()) {
      return false;
    }

    // 警告邮件内容不能为空
    if (!content.htmlContent.trim() && !content.textContent.trim()) {
      return false;
    }

    // 警告邮件主题应该包含警告标识
    if (
      !content.subject.includes('警告') &&
      !content.subject.includes('Alert')
    ) {
      return false;
    }

    return true;
  }

  /**
   * @method validateBasicEmailContent
   * @description 验证基础邮件内容
   * @param {EmailContent} content 邮件内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateBasicEmailContent(content: EmailContent): boolean {
    // 基础验证：主题和内容不能为空
    return (
      content.subject.trim().length > 0 &&
      (content.htmlContent.trim().length > 0 ||
        content.textContent.trim().length > 0)
    );
  }

  /**
   * @method getProviderRetryMultiplier
   * @description 获取服务提供商的重试延迟倍数
   * @param {EmailProvider} provider 邮件服务提供商
   * @returns {number} 重试延迟倍数
   * @private
   */
  private getProviderRetryMultiplier(provider: EmailProvider): number {
    const multipliers: Record<EmailProvider, number> = {
      [EmailProvider.SMTP]: 1.0,
      [EmailProvider.SENDGRID]: 0.5, // 云服务提供商重试更快
      [EmailProvider.MAILGUN]: 0.5,
      [EmailProvider.SES]: 0.5,
      [EmailProvider.CUSTOM]: 2.0, // 自定义服务重试更慢
    };

    return multipliers[provider] ?? 1.0;
  }
}
