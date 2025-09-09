import { EventSourcedAggregateRoot } from '@aiofix/core';
import { SmsNotifEntity } from '../entities/sms-notif.entity';
import { PhoneNumber, NotifId, TenantId, UserId } from '@aiofix/shared';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider } from '../value-objects/sms-provider.vo';
import { SmsStatus, SmsStatusType } from '../value-objects/sms-status.vo';
import { SmsNotifCreatedEvent } from '../events/sms-notif-created.event';
import { SmsNotifSendingEvent } from '../events/sms-notif-sending.event';
import { SmsNotifSentEvent } from '../events/sms-notif-sent.event';
import { SmsNotifDeliveredEvent } from '../events/sms-notif-delivered.event';
import { SmsNotifFailedEvent } from '../events/sms-notif-failed.event';
import { SmsNotifPermanentlyFailedEvent } from '../events/sms-notif-permanently-failed.event';
import { SmsNotifRetryingEvent } from '../events/sms-notif-retrying.event';
import { SmsNotifScheduledEvent } from '../events/sms-notif-scheduled.event';
import { SmsNotifCancelledEvent } from '../events/sms-notif-cancelled.event';

/**
 * 短信通知聚合根
 *
 * 负责管理短信通知的业务协调和事件发布。
 *
 * 聚合根职责：
 * - 协调短信通知的创建、发送和状态管理
 * - 发布短信通知相关的领域事件
 * - 维护短信通知的业务不变性
 * - 处理短信通知的复杂业务逻辑
 *
 * 业务协调：
 * - 短信通知创建和初始化
 * - 短信通知发送流程管理
 * - 短信通知状态转换控制
 * - 短信通知重试机制管理
 *
 * 事件发布：
 * - 短信通知创建事件
 * - 短信通知状态变更事件
 * - 短信通知发送结果事件
 * - 短信通知重试事件
 *
 * @class SmsNotif
 * @extends EventSourcedAggregateRoot
 */
export class SmsNotif extends EventSourcedAggregateRoot {
  private constructor(private smsNotif: SmsNotifEntity) {
    super();
  }

  /**
   * 创建短信通知聚合根
   *
   * @param {string} id 短信通知ID
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {PhoneNumber} phoneNumber 手机号
   * @param {SmsContent} content 短信内容
   * @param {SmsProvider} provider 短信提供商
   * @param {string} [createdBy] 创建者
   * @returns {SmsNotif} 短信通知聚合根
   */
  public static create(
    id: string,
    tenantId: string,
    userId: string,
    phoneNumber: PhoneNumber,
    content: SmsContent,
    provider: SmsProvider,
    createdBy: string = 'system',
  ): SmsNotif {
    const status = SmsStatus.create(SmsStatusType.PENDING);
    const smsNotif = new SmsNotifEntity(
      id,
      tenantId,
      userId,
      phoneNumber,
      content,
      provider,
      status,
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      3,
      createdBy,
    );

    const aggregate = new SmsNotif(smsNotif);

    // 发布创建事件
    aggregate.addDomainEvent(
      new SmsNotifCreatedEvent(
        new NotifId(id),
        new TenantId(tenantId),
        new UserId(userId),
        phoneNumber,
        content,
        provider,
        createdBy,
      ),
    );

    return aggregate;
  }

  /**
   * 从实体重建聚合根
   *
   * @param {SmsNotifEntity} smsNotif 短信通知实体
   * @returns {SmsNotif} 短信通知聚合根
   */
  public static fromEntity(smsNotif: SmsNotifEntity): SmsNotif {
    return new SmsNotif(smsNotif);
  }

  /**
   * 获取短信通知实体
   *
   * @returns {SmsNotifEntity} 短信通知实体
   */
  public getSmsNotif(): SmsNotifEntity {
    return this.smsNotif;
  }

  /**
   * 获取短信通知ID
   *
   * @returns {string} 短信通知ID
   */
  public getId(): string {
    return this.smsNotif.id;
  }

  /**
   * 获取租户ID
   *
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.smsNotif.tenantId;
  }

  /**
   * 获取用户ID
   *
   * @returns {string} 用户ID
   */
  public getUserId(): string {
    return this.smsNotif.userId;
  }

  /**
   * 获取手机号
   *
   * @returns {PhoneNumber} 手机号
   */
  public getPhoneNumber(): PhoneNumber {
    return this.smsNotif.getPhoneNumber();
  }

  /**
   * 获取短信内容
   *
   * @returns {SmsContent} 短信内容
   */
  public getContent(): SmsContent {
    return this.smsNotif.getContent();
  }

  /**
   * 获取短信提供商
   *
   * @returns {SmsProvider} 短信提供商
   */
  public getProvider(): SmsProvider {
    return this.smsNotif.getProvider();
  }

  /**
   * 获取短信状态
   *
   * @returns {SmsStatus} 短信状态
   */
  public getStatus(): SmsStatus {
    return this.smsNotif.getStatus();
  }

  /**
   * 获取调度时间
   *
   * @returns {Date | undefined} 调度时间
   */
  public getScheduledAt(): Date | undefined {
    return this.smsNotif.getScheduledAt();
  }

  /**
   * 获取发送时间
   *
   * @returns {Date | undefined} 发送时间
   */
  public getSentAt(): Date | undefined {
    return this.smsNotif.getSentAt();
  }

  /**
   * 获取送达时间
   *
   * @returns {Date | undefined} 送达时间
   */
  public getDeliveredAt(): Date | undefined {
    return this.smsNotif.getDeliveredAt();
  }

  /**
   * 获取失败原因
   *
   * @returns {string | undefined} 失败原因
   */
  public getFailureReason(): string | undefined {
    return this.smsNotif.getFailureReason();
  }

  /**
   * 获取重试次数
   *
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this.smsNotif.getRetryCount();
  }

  /**
   * 获取最大重试次数
   *
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this.smsNotif.getMaxRetries();
  }

  /**
   * 检查是否可以发送
   *
   * @returns {boolean} 是否可以发送
   */
  public canSend(): boolean {
    return this.smsNotif.canSend();
  }

  /**
   * 检查是否可以重试
   *
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return this.smsNotif.canRetry();
  }

  /**
   * 检查是否已过期
   *
   * @returns {boolean} 是否已过期
   */
  public isExpired(): boolean {
    return this.smsNotif.isExpired();
  }

  /**
   * 开始发送短信
   *
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public startSending(): void {
    if (!this.canSend()) {
      throw new InvalidSmsOperationError('短信通知当前状态不允许发送');
    }

    this.smsNotif.markAsSending();

    // 发布发送中事件
    this.addDomainEvent(
      new SmsNotifSendingEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
      ),
    );
  }

  /**
   * 标记短信为已发送
   *
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public markAsSent(): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.SENDING) {
      throw new InvalidSmsOperationError(
        '只有发送中状态的短信才能标记为已发送',
      );
    }

    this.smsNotif.markAsSent();

    // 发布已发送事件
    this.addDomainEvent(
      new SmsNotifSentEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        this.getSentAt()!,
      ),
    );
  }

  /**
   * 标记短信为已送达
   *
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public markAsDelivered(): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.SENT) {
      throw new InvalidSmsOperationError(
        '只有已发送状态的短信才能标记为已送达',
      );
    }

    this.smsNotif.markAsDelivered();

    // 发布已送达事件
    this.addDomainEvent(
      new SmsNotifDeliveredEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        this.getDeliveredAt()!,
      ),
    );
  }

  /**
   * 标记短信为发送失败
   *
   * @param {string} reason 失败原因
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public markAsFailed(reason: string): void {
    if (!this.smsNotif.getStatus().isSending()) {
      throw new InvalidSmsOperationError('只有发送中状态的短信才能标记为失败');
    }

    this.smsNotif.markAsFailed(reason);

    // 发布失败事件
    this.addDomainEvent(
      new SmsNotifFailedEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        reason,
        this.getRetryCount(),
      ),
    );
  }

  /**
   * 标记短信为永久失败
   *
   * @param {string} reason 失败原因
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public markAsPermanentlyFailed(reason: string): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.FAILED) {
      throw new InvalidSmsOperationError(
        '只有失败状态的短信才能标记为永久失败',
      );
    }

    this.smsNotif.markAsPermanentlyFailed(reason);

    // 发布永久失败事件
    this.addDomainEvent(
      new SmsNotifPermanentlyFailedEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        reason,
        this.getRetryCount(),
      ),
    );
  }

  /**
   * 重试发送短信
   *
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public retry(): void {
    if (!this.canRetry()) {
      throw new InvalidSmsOperationError('短信通知当前状态不允许重试');
    }

    this.smsNotif.markAsRetrying();

    // 发布重试事件
    this.addDomainEvent(
      new SmsNotifRetryingEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        this.getRetryCount(),
      ),
    );
  }

  /**
   * 调度短信发送
   *
   * @param {Date} scheduledAt 调度时间
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public schedule(scheduledAt: Date): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.PENDING) {
      throw new InvalidSmsOperationError('只有待发送状态的短信才能调度');
    }

    this.smsNotif.schedule(scheduledAt);

    // 发布调度事件
    this.addDomainEvent(
      new SmsNotifScheduledEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        scheduledAt,
      ),
    );
  }

  /**
   * 取消短信发送
   *
   * @param {string} reason 取消原因
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public cancel(reason: string): void {
    if (this.smsNotif.getStatus().isFinalStatus()) {
      throw new InvalidSmsOperationError('已完成状态的短信不能取消');
    }

    this.smsNotif.cancel(reason);

    // 发布取消事件
    this.addDomainEvent(
      new SmsNotifCancelledEvent(
        new NotifId(this.getId()),
        new TenantId(this.getTenantId()),
        new UserId(this.getUserId()),
        this.getPhoneNumber(),
        this.getContent(),
        this.getProvider(),
        reason,
      ),
    );
  }

  /**
   * 更新短信内容
   *
   * @param {SmsContent} content 新的短信内容
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public updateContent(content: SmsContent): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.PENDING) {
      throw new InvalidSmsOperationError('只有待发送状态的短信才能更新内容');
    }

    this.smsNotif.updateContent(content);
  }

  /**
   * 更新短信提供商
   *
   * @param {SmsProvider} provider 新的短信提供商
   * @throws {InvalidSmsOperationError} 当操作无效时抛出
   */
  public updateProvider(provider: SmsProvider): void {
    if (this.smsNotif.getStatus().getStatus() !== SmsStatusType.PENDING) {
      throw new InvalidSmsOperationError('只有待发送状态的短信才能更新提供商');
    }

    this.smsNotif.updateProvider(provider);
  }

  /**
   * 获取短信摘要信息
   *
   * @returns {object} 短信摘要信息
   */
  public getSummary(): object {
    return this.smsNotif.getSummary();
  }
}

/**
 * 无效短信操作错误
 */
export class InvalidSmsOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSmsOperationError';
  }
}
