import { EventSourcedAggregateRoot } from '@aiofix/core/src/domain/base/event-sourced-aggregate-root';
import { IDomainEvent } from '@aiofix/core/src/domain/base/domain-event';
import { NotifId } from '@aiofix/core/src/domain/value-objects/notif-id.vo';
import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';
import { NotifType } from '@aiofix/core/src/domain/value-objects/notif-type.vo';
import { NotifPriority } from '@aiofix/core/src/domain/value-objects/notif-priority.vo';
import { EmailAddress } from '../value-objects/email-address.vo';
import { EmailStatus } from '../value-objects/email-status.vo';
import { EmailProvider } from '../value-objects/email-provider.vo';
import { TemplateId } from '../value-objects/template-id.vo';
import { EmailContent } from '../value-objects/email-content.vo';
import { EmailNotifEntity } from '../entities/email-notif.entity';
import { EmailNotifCreatedEvent } from '../events/email-notif-created.event';
import { EmailNotifSendingEvent } from '../events/email-notif-sending.event';
import { EmailNotifSentEvent } from '../events/email-notif-sent.event';
import { EmailNotifFailedEvent } from '../events/email-notif-failed.event';
import { EmailNotifPermanentlyFailedEvent } from '../events/email-notif-permanently-failed.event';

/**
 * @class EmailNotif
 * @description
 * 邮件通知聚合根，负责管理邮件通知的业务协调、事件发布和事务边界控制。
 *
 * 架构设计：
 * 1. 聚合根继承 EventSourcedAggregateRoot，负责业务协调和事件发布
 * 2. 领域实体继承 BaseEntity，负责状态管理和基础设施功能
 * 3. 通过组合模式实现职责分离
 *
 * 业务协调职责：
 * 1. 协调邮件通知的创建和发送流程
 * 2. 管理邮件状态转换的业务规则
 * 3. 处理发送失败和重试逻辑
 * 4. 发布领域事件通知其他聚合根
 *
 * 事件发布职责：
 * 1. 在状态变更时发布相应的领域事件
 * 2. 确保事件的数据完整性和一致性
 * 3. 支持事件溯源和状态重建
 *
 * 事务边界控制：
 * 1. 确保邮件通知操作的原子性
 * 2. 管理并发访问和乐观锁控制
 * 3. 处理业务规则验证和异常情况
 *
 * @property {EmailNotifEntity} emailNotif 邮件通知领域实体
 *
 * @example
 * ```typescript
 * const emailNotif = EmailNotif.create(
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   emailContent,
 *   templateId,
 *   EmailProvider.SENDGRID,
 *   NotifPriority.HIGH,
 *   { source: 'system' }
 * );
 * emailNotif.markAsSending(); // 发布 EmailNotifSendingEvent
 * emailNotif.markAsSent(); // 发布 EmailNotifSentEvent
 * ```
 * @since 1.0.0
 */
export class EmailNotif extends EventSourcedAggregateRoot {
  private constructor(private emailNotif: EmailNotifEntity) {
    super();
  }

  /**
   * @method create
   * @description 创建邮件通知聚合根的静态工厂方法
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 收件人用户ID
   * @param {EmailAddress} recipientEmail 收件人邮箱地址
   * @param {EmailContent} content 邮件内容
   * @param {TemplateId} templateId 邮件模板ID
   * @param {EmailProvider} provider 邮件服务提供商
   * @param {NotifPriority} priority 通知优先级
   * @param {Record<string, unknown>} metadata 元数据
   * @param {string} createdBy 创建者
   * @returns {EmailNotif} 邮件通知聚合根
   * @throws {InvalidEmailNotifDataError} 当数据无效时抛出
   */
  public static create(
    tenantId: TenantId,
    recipientId: UserId,
    recipientEmail: EmailAddress,
    content: EmailContent,
    templateId: TemplateId,
    provider: EmailProvider,
    priority: NotifPriority = NotifPriority.NORMAL,
    metadata: Record<string, unknown> = {},
    createdBy: string = 'system',
  ): EmailNotif {
    // 生成通知ID
    const notifId = NotifId.generate();

    // 创建邮件通知实体
    const emailNotifEntity = new EmailNotifEntity(
      notifId,
      tenantId,
      recipientId,
      recipientEmail,
      content,
      templateId,
      provider,
      EmailStatus.PENDING,
      0, // retryCount
      3, // maxRetries
      undefined, // sentAt
      undefined, // deliveredAt
      undefined, // errorMessage
      { ...metadata, priority: priority },
      createdBy,
    );

    // 创建聚合根
    const emailNotif = new EmailNotif(emailNotifEntity);

    // 发布创建事件
    emailNotif.addDomainEvent(
      new EmailNotifCreatedEvent(
        notifId,
        tenantId,
        recipientId,
        recipientEmail,
        content,
        templateId,
        provider,
        priority,
        metadata,
        new Date(),
      ),
    );

    return emailNotif;
  }

  /**
   * @method markAsSending
   * @description 标记邮件为发送中状态，发布发送中事件
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSending(): void {
    this.emailNotif.markAsSending();

    // 发布发送中事件
    this.addDomainEvent(
      new EmailNotifSendingEvent(
        this.emailNotif.id,
        this.emailNotif.tenantId,
        this.emailNotif.recipientId,
        this.emailNotif.recipientEmail,
        this.emailNotif.provider,
        new Date(),
      ),
    );
  }

  /**
   * @method markAsSent
   * @description 标记邮件为已发送状态，发布已发送事件
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSent(): void {
    this.emailNotif.markAsSent();

    // 发布已发送事件
    this.addDomainEvent(
      new EmailNotifSentEvent(
        this.emailNotif.id,
        this.emailNotif.tenantId,
        this.emailNotif.recipientId,
        this.emailNotif.recipientEmail,
        this.emailNotif.provider,
        this.emailNotif.getSentAt()!,
        new Date(),
      ),
    );
  }

  /**
   * @method markAsDelivered
   * @description 标记邮件为已送达状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsDelivered(): void {
    this.emailNotif.markAsDelivered();
    // 注意：已送达事件可以根据需要添加
  }

  /**
   * @method markAsFailed
   * @description 标记邮件为发送失败状态，发布失败事件
   * @param {string} errorMessage 错误信息
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsFailed(errorMessage: string): void {
    this.emailNotif.markAsFailed(errorMessage);

    // 检查是否达到最大重试次数
    if (this.emailNotif.getRetryCount() >= this.emailNotif.getMaxRetries()) {
      this.emailNotif.markAsPermanentlyFailed(errorMessage);

      // 发布永久失败事件
      this.addDomainEvent(
        new EmailNotifPermanentlyFailedEvent(
          this.emailNotif.id,
          this.emailNotif.tenantId,
          this.emailNotif.recipientId,
          this.emailNotif.recipientEmail,
          this.emailNotif.provider,
          errorMessage,
          this.emailNotif.getRetryCount(),
          new Date(),
        ),
      );
    } else {
      // 发布失败事件
      this.addDomainEvent(
        new EmailNotifFailedEvent(
          this.emailNotif.id,
          this.emailNotif.tenantId,
          this.emailNotif.recipientId,
          this.emailNotif.recipientEmail,
          this.emailNotif.provider,
          errorMessage,
          this.emailNotif.getRetryCount(),
          new Date(),
        ),
      );
    }
  }

  /**
   * @method retry
   * @description 重试发送邮件
   * @returns {void}
   * @throws {InvalidOperationError} 当无法重试时抛出
   */
  public retry(): void {
    if (!this.emailNotif.canRetry()) {
      throw new InvalidOperationError('邮件通知无法重试');
    }

    this.markAsSending();
  }

  /**
   * @method canRetry
   * @description 检查是否可以重试发送
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return this.emailNotif.canRetry();
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  public isPending(): boolean {
    return this.emailNotif.isPending();
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  public isSending(): boolean {
    return this.emailNotif.isSending();
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  public isSent(): boolean {
    return this.emailNotif.isSent();
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  public isDelivered(): boolean {
    return this.emailNotif.isDelivered();
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  public isFailed(): boolean {
    return this.emailNotif.isFailed();
  }

  /**
   * @method isPermanentlyFailed
   * @description 检查是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  public isPermanentlyFailed(): boolean {
    return this.emailNotif.isPermanentlyFailed();
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return this.emailNotif.isFinal();
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {EmailStatus} 当前状态
   */
  public getStatus(): EmailStatus {
    return this.emailNotif.getStatus();
  }

  /**
   * @method getRetryCount
   * @description 获取重试次数
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this.emailNotif.getRetryCount();
  }

  /**
   * @method getMaxRetries
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this.emailNotif.getMaxRetries();
  }

  /**
   * @method getSentAt
   * @description 获取发送时间
   * @returns {Date | undefined} 发送时间
   */
  public getSentAt(): Date | undefined {
    return this.emailNotif.getSentAt();
  }

  /**
   * @method getDeliveredAt
   * @description 获取送达时间
   * @returns {Date | undefined} 送达时间
   */
  public getDeliveredAt(): Date | undefined {
    return this.emailNotif.getDeliveredAt();
  }

  /**
   * @method getErrorMessage
   * @description 获取错误信息
   * @returns {string | undefined} 错误信息
   */
  public getErrorMessage(): string | undefined {
    return this.emailNotif.getErrorMessage();
  }

  // 访问器方法，暴露实体属性
  public get id(): NotifId {
    return this.emailNotif.id;
  }

  public get tenantId(): TenantId {
    return this.emailNotif.tenantId;
  }

  public get recipientId(): UserId {
    return this.emailNotif.recipientId;
  }

  public get recipientEmail(): EmailAddress {
    return this.emailNotif.recipientEmail;
  }

  public get content(): EmailContent {
    return this.emailNotif.content;
  }

  public get templateId(): TemplateId {
    return this.emailNotif.templateId;
  }

  public get provider(): EmailProvider {
    return this.emailNotif.provider;
  }

  public get metadata(): Record<string, unknown> {
    return this.emailNotif.metadata;
  }

  /**
   * @method getEntity
   * @description 获取邮件通知实体
   * @returns {EmailNotifEntity} 邮件通知实体
   */
  public getEntity(): EmailNotifEntity {
    return this.emailNotif;
  }

  /**
   * @method updateEntity
   * @description 更新邮件通知实体
   * @param {EmailNotifEntity} entity 新的实体
   * @returns {void}
   */
  public updateEntity(entity: EmailNotifEntity): void {
    this.emailNotif = entity;
  }
}

/**
 * @class InvalidOperationError
 * @description 无效操作错误
 */
export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}
