import { BaseEntity } from '@aiofix/core';
import { NotifId, TenantId, UserId, Email } from '@aiofix/shared';
import { EmailAddress } from '../value-objects/email-address.vo';
import {
  EmailStatus,
  EmailStatusValidator,
} from '../value-objects/email-status.vo';
import { EmailProvider } from '../value-objects/email-provider.vo';
import { TemplateId } from '../value-objects/template-id.vo';
import { EmailContent } from '../value-objects/email-content.vo';

/**
 * @class EmailNotifEntity
 * @description
 * 邮件通知领域实体，负责维护邮件通知的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识邮件通知身份
 * 2. 管理邮件通知的发送状态（待发送、发送中、已发送、失败等）
 * 3. 维护邮件通知的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 邮件通知ID一旦创建不可变更
 * 2. 邮件状态变更必须遵循预定义的状态机
 * 3. 发送失败时采用重试机制
 * 4. 达到最大重试次数后标记为永久失败
 *
 * 基础设施功能：
 * 1. 继承BaseEntity提供审计追踪、乐观锁、软删除等功能
 * 2. 支持多租户数据隔离
 * 3. 提供版本控制和并发控制
 *
 * @property {NotifId} id 邮件通知唯一标识符，不可变更
 * @property {TenantId} tenantId 租户ID，用于多租户数据隔离
 * @property {UserId} recipientId 收件人用户ID
 * @property {EmailAddress} recipientEmail 收件人邮箱地址
 * @property {EmailContent} content 邮件内容（主题、HTML、纯文本）
 * @property {TemplateId} templateId 邮件模板ID
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {EmailStatus} status 邮件发送状态
 * @property {number} retryCount 重试次数
 * @property {number} maxRetries 最大重试次数
 * @property {Date} sentAt 发送时间
 * @property {Date} deliveredAt 送达时间
 * @property {string} errorMessage 错误信息
 * @property {Record<string, unknown>} metadata 元数据
 *
 * @example
 * ```typescript
 * const emailNotif = new EmailNotifEntity(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   emailContent,
 *   templateId,
 *   EmailProvider.SENDGRID
 * );
 * emailNotif.markAsSending(); // 标记为发送中
 * emailNotif.markAsSent(); // 标记为已发送
 * ```
 * @since 1.0.0
 */
export class EmailNotifEntity extends BaseEntity {
  private readonly statusValidator = new EmailStatusValidator();

  constructor(
    public readonly id: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: EmailAddress,
    public readonly content: EmailContent,
    public readonly templateId: TemplateId,
    public readonly provider: EmailProvider,
    private status: EmailStatus = EmailStatus.PENDING,
    private retryCount: number = 0,
    private readonly maxRetries: number = 3,
    private sentAt?: Date,
    private deliveredAt?: Date,
    private errorMessage?: string,
    public readonly metadata: Record<string, unknown> = {},
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method markAsSending
   * @description 标记邮件为发送中状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSending(): void {
    this.statusValidator.validateTransition(this.status, EmailStatus.SENDING);
    this.status = EmailStatus.SENDING;
    this.updatedAt = new Date();
    this.updatedBy = 'system';
  }

  /**
   * @method markAsSent
   * @description 标记邮件为已发送状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSent(): void {
    this.statusValidator.validateTransition(this.status, EmailStatus.SENT);
    this.status = EmailStatus.SENT;
    this.sentAt = new Date();
    this.updatedAt = new Date();
    this.updatedBy = 'system';
  }

  /**
   * @method markAsDelivered
   * @description 标记邮件为已送达状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsDelivered(): void {
    this.statusValidator.validateTransition(this.status, EmailStatus.DELIVERED);
    this.status = EmailStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
    this.updatedBy = 'system';
  }

  /**
   * @method markAsFailed
   * @description 标记邮件为发送失败状态
   * @param {string} errorMessage 错误信息
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsFailed(errorMessage: string): void {
    this.statusValidator.validateTransition(this.status, EmailStatus.FAILED);
    this.status = EmailStatus.FAILED;
    this.retryCount++;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
    this.updatedBy = 'system';
  }

  /**
   * @method markAsPermanentlyFailed
   * @description 标记邮件为永久失败状态
   * @param {string} errorMessage 错误信息
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsPermanentlyFailed(errorMessage: string): void {
    this.statusValidator.validateTransition(
      this.status,
      EmailStatus.PERMANENTLY_FAILED,
    );
    this.status = EmailStatus.PERMANENTLY_FAILED;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
    this.updatedBy = 'system';
  }

  /**
   * @method canRetry
   * @description 检查是否可以重试发送
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return (
      this.status === EmailStatus.FAILED && this.retryCount < this.maxRetries
    );
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  public isPending(): boolean {
    return this.status === EmailStatus.PENDING;
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  public isSending(): boolean {
    return this.status === EmailStatus.SENDING;
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  public isSent(): boolean {
    return this.status === EmailStatus.SENT;
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  public isDelivered(): boolean {
    return this.status === EmailStatus.DELIVERED;
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  public isFailed(): boolean {
    return this.status === EmailStatus.FAILED;
  }

  /**
   * @method isPermanentlyFailed
   * @description 检查是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  public isPermanentlyFailed(): boolean {
    return this.status === EmailStatus.PERMANENTLY_FAILED;
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return this.statusValidator.isFinal(this.status);
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {EmailStatus} 当前状态
   */
  public getStatus(): EmailStatus {
    return this.status;
  }

  /**
   * @method getRetryCount
   * @description 获取重试次数
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * @method getMaxRetries
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this.maxRetries;
  }

  /**
   * @method getSentAt
   * @description 获取发送时间
   * @returns {Date | undefined} 发送时间
   */
  public getSentAt(): Date | undefined {
    return this.sentAt;
  }

  /**
   * @method getDeliveredAt
   * @description 获取送达时间
   * @returns {Date | undefined} 送达时间
   */
  public getDeliveredAt(): Date | undefined {
    return this.deliveredAt;
  }

  /**
   * @method getErrorMessage
   * @description 获取错误信息
   * @returns {string | undefined} 错误信息
   */
  public getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  /**
   * @method getEntityId
   * @description 获取实体ID，实现BaseEntity抽象方法
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.id.value;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId.value;
  }

  /**
   * @method validate
   * @description 验证实体数据的有效性
   * @returns {void}
   * @throws {InvalidEmailNotifDataError} 当实体数据无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.id) {
      throw new InvalidEmailNotifDataError('邮件通知ID不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidEmailNotifDataError('租户ID不能为空');
    }

    if (!this.recipientId) {
      throw new InvalidEmailNotifDataError('收件人ID不能为空');
    }

    if (!this.recipientEmail) {
      throw new InvalidEmailNotifDataError('收件人邮箱不能为空');
    }

    if (!this.content) {
      throw new InvalidEmailNotifDataError('邮件内容不能为空');
    }

    if (!this.templateId) {
      throw new InvalidEmailNotifDataError('模板ID不能为空');
    }

    if (!this.provider) {
      throw new InvalidEmailNotifDataError('邮件服务提供商不能为空');
    }

    if (this.retryCount < 0) {
      throw new InvalidEmailNotifDataError('重试次数不能为负数');
    }

    if (this.maxRetries < 0) {
      throw new InvalidEmailNotifDataError('最大重试次数不能为负数');
    }

    if (this.retryCount > this.maxRetries) {
      throw new InvalidEmailNotifDataError('重试次数不能超过最大重试次数');
    }
  }

  /**
   * @method equals
   * @description 比较两个实体是否相等
   * @param {EmailNotifEntity} other 另一个实体
   * @returns {boolean} 是否相等
   */
  public equals(other: EmailNotifEntity): boolean {
    if (!other) {
      return false;
    }
    return this.id.equals(other.id);
  }

  /**
   * @method clone
   * @description 克隆实体
   * @returns {EmailNotifEntity} 克隆的实体
   */
  public clone(): EmailNotifEntity {
    return new EmailNotifEntity(
      this.id,
      this.tenantId,
      this.recipientId,
      this.recipientEmail,
      this.content,
      this.templateId,
      this.provider,
      this.status,
      this.retryCount,
      this.maxRetries,
      this.sentAt,
      this.deliveredAt,
      this.errorMessage,
      { ...this.metadata },
      this.createdBy,
    );
  }

  /**
   * @method toJSON
   * @description 将实体转换为JSON对象
   * @returns {object} JSON对象
   */
  public toJSON(): object {
    return {
      id: this.id.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      recipientEmail: this.recipientEmail.value,
      content: {
        subject: this.content.subject,
        htmlContent: this.content.htmlContent,
        textContent: this.content.textContent,
      },
      templateId: this.templateId.value,
      provider: this.provider,
      status: this.status,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      errorMessage: this.errorMessage,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }
}

/**
 * @class InvalidEmailNotifDataError
 * @description 无效邮件通知数据错误
 */
export class InvalidEmailNotifDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailNotifDataError';
  }
}
