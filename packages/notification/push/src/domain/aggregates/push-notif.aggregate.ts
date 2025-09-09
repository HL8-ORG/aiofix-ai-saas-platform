import { EventSourcedAggregateRoot } from '@aiofix/core';
import { PushNotifEntity } from '../entities/push-notif.entity';
import { NotifId, TenantId, UserId } from '@aiofix/shared';
import { PushToken } from '../value-objects/push-token.vo';
import { PushContent } from '../value-objects/push-content.vo';
import { PushPriorityLevel } from '../value-objects/push-priority.vo';
import { PushNotifCreatedEvent } from '../events/push-notif-created.event';
import { PushNotifSendingEvent } from '../events/push-notif-sending.event';
import { PushNotifSentEvent } from '../events/push-notif-sent.event';
import { PushNotifDeliveredEvent } from '../events/push-notif-delivered.event';
import { PushNotifFailedEvent } from '../events/push-notif-failed.event';
import { PushNotifPermanentlyFailedEvent } from '../events/push-notif-permanently-failed.event';
import { PushNotifRetryingEvent } from '../events/push-notif-retrying.event';
import { PushNotifScheduledEvent } from '../events/push-notif-scheduled.event';

/**
 * @class PushNotifAggregate
 * @description
 * 推送通知聚合根，负责管理推送通知的业务协调和事件发布。
 *
 * 聚合根职责：
 * 1. 协调推送通知的创建、发送和状态管理
 * 2. 发布推送通知相关的领域事件
 * 3. 维护推送通知的业务不变性约束
 * 4. 提供推送通知的业务方法
 *
 * 业务协调：
 * 1. 推送通知创建和初始化
 * 2. 推送通知发送流程管理
 * 3. 推送通知状态转换控制
 * 4. 推送通知重试和恢复机制
 *
 * 事件发布：
 * 1. 推送通知创建事件
 * 2. 推送通知状态变更事件
 * 3. 推送通知发送结果事件
 * 4. 推送通知重试和失败事件
 *
 * 业务规则：
 * 1. 推送通知必须关联有效的用户和租户
 * 2. 推送令牌必须有效且未过期
 * 3. 推送内容必须符合平台要求
 * 4. 推送优先级影响发送策略
 *
 * @property {PushNotifEntity} pushNotif 推送通知实体
 * @property {DomainEvent[]} uncommittedEvents 未提交的领域事件
 *
 * @example
 * ```typescript
 * const aggregate = new PushNotifAggregate();
 * await aggregate.createPushNotif(
 *   'push-123',
 *   'tenant-456',
 *   'user-789',
 *   pushToken,
 *   pushContent,
 *   PushPriorityLevel.NORMAL
 * );
 * ```
 * @since 1.0.0
 */
export class PushNotifAggregate extends EventSourcedAggregateRoot {
  private pushNotif: PushNotifEntity;

  /**
   * @constructor
   * @description 创建推送通知聚合根
   * @param {PushNotifEntity} [pushNotif] 推送通知实体，可选
   */
  constructor(pushNotif?: PushNotifEntity) {
    super();
    this.pushNotif = pushNotif!;
  }

  /**
   * @method createPushNotif
   * @description 创建推送通知
   * @param {string} id 推送通知ID
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {PushToken} pushToken 推送令牌
   * @param {PushContent} content 推送内容
   * @param {PushPriorityLevel} priority 推送优先级
   * @param {Date} [scheduledAt] 计划发送时间，可选
   * @param {Record<string, any>} [metadata] 元数据，可选
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  createPushNotif(
    id: string,
    tenantId: string,
    userId: string,
    pushToken: PushToken,
    content: PushContent,
    priority: PushPriorityLevel,
    scheduledAt?: Date,
    metadata?: Record<string, any>,
  ): void {
    // 验证业务规则
    this.validatePushNotifCreation(tenantId, userId, pushToken, content);

    // 创建推送通知实体
    this.pushNotif = new PushNotifEntity(
      id,
      tenantId,
      userId,
      pushToken,
      content,
      priority,
      scheduledAt,
      metadata,
    );

    // 发布推送通知创建事件
    this.addDomainEvent(
      new PushNotifCreatedEvent(
        new NotifId(id),
        new TenantId(tenantId),
        new UserId(userId),
        pushToken,
        content,
        priority,
        scheduledAt,
      ),
    );
  }

  /**
   * @method sendPushNotif
   * @description 发送推送通知
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  sendPushNotif(): void {
    // 验证业务规则
    this.validatePushNotifSending();

    // 标记为发送中状态
    this.pushNotif.markAsSending();

    // 发布推送通知发送中事件
    this.addDomainEvent(
      new PushNotifSendingEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
      ),
    );
  }

  /**
   * @method markAsSent
   * @description 标记推送通知为已发送
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  markAsSent(): void {
    // 验证业务规则
    this.validatePushNotifSent();

    // 标记为已发送状态
    this.pushNotif.markAsSent();

    // 发布推送通知已发送事件
    this.addDomainEvent(
      new PushNotifSentEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        this.pushNotif.getSentAt()!,
      ),
    );
  }

  /**
   * @method markAsDelivered
   * @description 标记推送通知为已送达
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  markAsDelivered(): void {
    // 验证业务规则
    this.validatePushNotifDelivered();

    // 标记为已送达状态
    this.pushNotif.markAsDelivered();

    // 发布推送通知已送达事件
    this.addDomainEvent(
      new PushNotifDeliveredEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        this.pushNotif.getDeliveredAt()!,
      ),
    );
  }

  /**
   * @method markAsFailed
   * @description 标记推送通知为失败
   * @param {string} reason 失败原因
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  markAsFailed(reason: string): void {
    // 验证业务规则
    this.validatePushNotifFailed(reason);

    // 标记为失败状态
    this.pushNotif.markAsFailed(reason);

    // 发布推送通知失败事件
    this.addDomainEvent(
      new PushNotifFailedEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        reason,
        this.pushNotif.getRetryCount(),
      ),
    );
  }

  /**
   * @method markAsPermanentlyFailed
   * @description 标记推送通知为永久失败
   * @param {string} reason 失败原因
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  markAsPermanentlyFailed(reason: string): void {
    // 验证业务规则
    this.validatePushNotifPermanentlyFailed(reason);

    // 标记为永久失败状态
    this.pushNotif.markAsPermanentlyFailed(reason);

    // 发布推送通知永久失败事件
    this.addDomainEvent(
      new PushNotifPermanentlyFailedEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        reason,
        this.pushNotif.getRetryCount(),
      ),
    );
  }

  /**
   * @method retryPushNotif
   * @description 重试推送通知
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  retryPushNotif(): void {
    // 验证业务规则
    this.validatePushNotifRetry();

    // 标记为重试中状态
    this.pushNotif.markAsRetrying();

    // 发布推送通知重试事件
    this.addDomainEvent(
      new PushNotifRetryingEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        this.pushNotif.getRetryCount(),
        this.pushNotif.getNextRetryTime(),
      ),
    );
  }

  /**
   * @method schedulePushNotif
   * @description 调度推送通知
   * @param {Date} scheduledAt 计划发送时间
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  schedulePushNotif(scheduledAt: Date): void {
    // 验证业务规则
    this.validatePushNotifScheduling(scheduledAt);

    // 调度推送通知
    this.pushNotif.schedule(scheduledAt);

    // 发布推送通知调度事件
    this.addDomainEvent(
      new PushNotifScheduledEvent(
        new NotifId(this.pushNotif.id),
        new TenantId(this.pushNotif.tenantId),
        new UserId(this.pushNotif.userId),
        this.pushNotif.getPushToken(),
        this.pushNotif.getContent(),
        this.pushNotif.getPriority().getValue(),
        scheduledAt,
      ),
    );
  }

  /**
   * @method updateContent
   * @description 更新推送内容
   * @param {PushContent} content 新的推送内容
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  updateContent(content: PushContent): void {
    // 验证业务规则
    this.validatePushNotifContentUpdate(content);

    // 更新推送内容
    this.pushNotif.updateContent(content);
  }

  /**
   * @method updatePriority
   * @description 更新推送优先级
   * @param {PushPriorityLevel} priority 新的推送优先级
   * @returns {void}
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   */
  updatePriority(priority: PushPriorityLevel): void {
    // 验证业务规则
    this.validatePushNotifPriorityUpdate(priority);

    // 更新推送优先级
    this.pushNotif.updatePriority(priority);
  }

  /**
   * @method getPushNotif
   * @description 获取推送通知实体
   * @returns {PushNotifEntity} 推送通知实体
   */
  getPushNotif(): PushNotifEntity {
    return this.pushNotif;
  }

  /**
   * @method validatePushNotifCreation
   * @description 验证推送通知创建
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {PushToken} pushToken 推送令牌
   * @param {PushContent} content 推送内容
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifCreation(
    tenantId: string,
    userId: string,
    pushToken: PushToken,
    content: PushContent,
  ): void {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new InvalidPushNotifError('租户ID不能为空');
    }

    if (!userId || userId.trim().length === 0) {
      throw new InvalidPushNotifError('用户ID不能为空');
    }

    if (!pushToken) {
      throw new InvalidPushNotifError('推送令牌不能为空');
    }

    if (!content) {
      throw new InvalidPushNotifError('推送内容不能为空');
    }
  }

  /**
   * @method validatePushNotifSending
   * @description 验证推送通知发送
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifSending(): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!this.pushNotif.isPending() && !this.pushNotif.isScheduled()) {
      throw new InvalidPushNotifError('推送通知状态不允许发送');
    }

    if (this.pushNotif.isExpired()) {
      throw new InvalidPushNotifError('推送通知已过期');
    }
  }

  /**
   * @method validatePushNotifSent
   * @description 验证推送通知已发送
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifSent(): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!this.pushNotif.isSending()) {
      throw new InvalidPushNotifError('推送通知状态不允许标记为已发送');
    }
  }

  /**
   * @method validatePushNotifDelivered
   * @description 验证推送通知已送达
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifDelivered(): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!this.pushNotif.isSent()) {
      throw new InvalidPushNotifError('推送通知状态不允许标记为已送达');
    }
  }

  /**
   * @method validatePushNotifFailed
   * @description 验证推送通知失败
   * @param {string} reason 失败原因
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifFailed(reason: string): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!reason || reason.trim().length === 0) {
      throw new InvalidPushNotifError('失败原因不能为空');
    }

    if (!this.pushNotif.isSending()) {
      throw new InvalidPushNotifError('推送通知状态不允许标记为失败');
    }
  }

  /**
   * @method validatePushNotifPermanentlyFailed
   * @description 验证推送通知永久失败
   * @param {string} reason 失败原因
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifPermanentlyFailed(reason: string): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!reason || reason.trim().length === 0) {
      throw new InvalidPushNotifError('失败原因不能为空');
    }

    if (!this.pushNotif.isFailed() && !this.pushNotif.isRetrying()) {
      throw new InvalidPushNotifError('推送通知状态不允许标记为永久失败');
    }
  }

  /**
   * @method validatePushNotifRetry
   * @description 验证推送通知重试
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifRetry(): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!this.pushNotif.canRetry()) {
      throw new InvalidPushNotifError('推送通知不允许重试');
    }
  }

  /**
   * @method validatePushNotifScheduling
   * @description 验证推送通知调度
   * @param {Date} scheduledAt 计划发送时间
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifScheduling(scheduledAt: Date): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!scheduledAt) {
      throw new InvalidPushNotifError('计划发送时间不能为空');
    }

    if (scheduledAt <= new Date()) {
      throw new InvalidPushNotifError('计划发送时间必须是未来时间');
    }

    if (!this.pushNotif.isPending()) {
      throw new InvalidPushNotifError('推送通知状态不允许调度');
    }
  }

  /**
   * @method validatePushNotifContentUpdate
   * @description 验证推送通知内容更新
   * @param {PushContent} content 新的推送内容
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifContentUpdate(content: PushContent): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!content) {
      throw new InvalidPushNotifError('推送内容不能为空');
    }

    if (this.pushNotif.isSent() || this.pushNotif.isDelivered()) {
      throw new InvalidPushNotifError('无法更新已发送的推送通知内容');
    }
  }

  /**
   * @method validatePushNotifPriorityUpdate
   * @description 验证推送通知优先级更新
   * @param {PushPriorityLevel} priority 新的推送优先级
   * @throws {InvalidPushNotifError} 当推送通知无效时抛出
   * @private
   */
  private validatePushNotifPriorityUpdate(priority: PushPriorityLevel): void {
    if (!this.pushNotif) {
      throw new InvalidPushNotifError('推送通知不存在');
    }

    if (!priority) {
      throw new InvalidPushNotifError('推送优先级不能为空');
    }
  }
}

/**
 * @class InvalidPushNotifError
 * @description 无效推送通知错误
 */
export class InvalidPushNotifError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPushNotifError';
  }
}
