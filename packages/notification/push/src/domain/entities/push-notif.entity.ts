import { BaseEntity } from '@aiofix/core';
import { PushToken } from '../value-objects/push-token.vo';
import { PushStatus, PushStatusType } from '../value-objects/push-status.vo';
import {
  PushPriority,
  PushPriorityLevel,
} from '../value-objects/push-priority.vo';
import { PushContent } from '../value-objects/push-content.vo';

/**
 * @class PushNotifEntity
 * @description
 * 推送通知实体，负责管理推送通知的状态、业务规则和生命周期。
 *
 * 实体职责：
 * 1. 管理推送通知的状态和状态转换
 * 2. 维护推送通知的业务规则和约束
 * 3. 提供推送通知的查询和验证功能
 * 4. 支持推送通知的审计和跟踪
 *
 * 状态管理：
 * 1. 推送状态：PENDING -> SENDING -> SENT/FAILED
 * 2. 状态转换验证和业务规则检查
 * 3. 状态历史记录和审计日志
 * 4. 支持状态的重试和恢复机制
 *
 * 业务规则：
 * 1. 推送令牌必须有效且未过期
 * 2. 推送内容必须符合平台要求
 * 3. 推送优先级影响发送策略
 * 4. 支持推送通知的批量处理
 *
 * @property {string} id 推送通知ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {PushToken} pushToken 推送令牌
 * @property {PushContent} content 推送内容
 * @property {PushStatus} status 推送状态
 * @property {PushPriority} priority 推送优先级
 * @property {Date} [scheduledAt] 计划发送时间，可选
 * @property {Date} [sentAt] 实际发送时间，可选
 * @property {Date} [deliveredAt] 送达时间，可选
 * @property {string} [failureReason] 失败原因，可选
 * @property {number} retryCount 重试次数
 * @property {number} maxRetries 最大重试次数
 * @property {Record<string, any>} [metadata] 元数据，可选
 *
 * @example
 * ```typescript
 * const entity = new PushNotifEntity(
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
export class PushNotifEntity extends BaseEntity {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly userId: string;
  private readonly _pushToken: PushToken;
  private _content: PushContent;
  private _status: PushStatus;
  private _priority: PushPriority;
  private _scheduledAt?: Date;
  private _sentAt?: Date;
  private _deliveredAt?: Date;
  private _failureReason?: string;
  private _retryCount: number;
  private _maxRetries: number;
  private _metadata?: Record<string, any>;

  /**
   * @constructor
   * @description 创建推送通知实体
   * @param {string} id 推送通知ID
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {PushToken} pushToken 推送令牌
   * @param {PushContent} content 推送内容
   * @param {PushPriorityLevel} priority 推送优先级
   * @param {Date} [scheduledAt] 计划发送时间，可选
   * @param {Record<string, any>} [metadata] 元数据，可选
   */
  constructor(
    id: string,
    tenantId: string,
    userId: string,
    pushToken: PushToken,
    content: PushContent,
    priority: PushPriorityLevel,
    scheduledAt?: Date,
    metadata?: Record<string, any>,
  ) {
    super();
    this.id = id;
    this.tenantId = tenantId;
    this.userId = userId;
    this._pushToken = pushToken;
    this._content = content;
    this._status = new PushStatus(PushStatusType.PENDING);
    this._priority = new PushPriority(priority);
    this._scheduledAt = scheduledAt;
    this._retryCount = 0;
    this._maxRetries = this._priority.getRetryCount();
    this._metadata = metadata;
  }

  /**
   * @method getPushToken
   * @description 获取推送令牌
   * @returns {PushToken} 推送令牌
   */
  getPushToken(): PushToken {
    return this._pushToken;
  }

  /**
   * @method getContent
   * @description 获取推送内容
   * @returns {PushContent} 推送内容
   */
  getContent(): PushContent {
    return this._content;
  }

  /**
   * @method getStatus
   * @description 获取推送状态
   * @returns {PushStatus} 推送状态
   */
  getStatus(): PushStatus {
    return this._status;
  }

  /**
   * @method getPriority
   * @description 获取推送优先级
   * @returns {PushPriority} 推送优先级
   */
  getPriority(): PushPriority {
    return this._priority;
  }

  /**
   * @method getScheduledAt
   * @description 获取计划发送时间
   * @returns {Date | undefined} 计划发送时间
   */
  getScheduledAt(): Date | undefined {
    return this._scheduledAt;
  }

  /**
   * @method getSentAt
   * @description 获取实际发送时间
   * @returns {Date | undefined} 实际发送时间
   */
  getSentAt(): Date | undefined {
    return this._sentAt;
  }

  /**
   * @method getDeliveredAt
   * @description 获取送达时间
   * @returns {Date | undefined} 送达时间
   */
  getDeliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  /**
   * @method getFailureReason
   * @description 获取失败原因
   * @returns {string | undefined} 失败原因
   */
  getFailureReason(): string | undefined {
    return this._failureReason;
  }

  /**
   * @method getRetryCount
   * @description 获取重试次数
   * @returns {number} 重试次数
   */
  getRetryCount(): number {
    return this._retryCount;
  }

  /**
   * @method getMaxRetries
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  getMaxRetries(): number {
    return this._maxRetries;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, any> | undefined} 元数据
   */
  getMetadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  /**
   * @method isPending
   * @description 判断是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  isPending(): boolean {
    return this._status.isPending();
  }

  /**
   * @method isSending
   * @description 判断是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  isSending(): boolean {
    return this._status.isSending();
  }

  /**
   * @method isSent
   * @description 判断是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  isSent(): boolean {
    return this._status.isSent();
  }

  /**
   * @method isDelivered
   * @description 判断是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  isDelivered(): boolean {
    return this._status.isDelivered();
  }

  /**
   * @method isFailed
   * @description 判断是否为失败状态
   * @returns {boolean} 是否为失败状态
   */
  isFailed(): boolean {
    return this._status.isFailed();
  }

  /**
   * @method isPermanentlyFailed
   * @description 判断是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  isPermanentlyFailed(): boolean {
    return this._status.isPermanentlyFailed();
  }

  /**
   * @method isScheduled
   * @description 判断是否为已调度状态
   * @returns {boolean} 是否为已调度状态
   */
  isScheduled(): boolean {
    return this._status.isScheduled();
  }

  /**
   * @method isRetrying
   * @description 判断是否为重试中状态
   * @returns {boolean} 是否为重试中状态
   */
  isRetrying(): boolean {
    return this._status.isFailed() && this._retryCount > 0;
  }

  /**
   * @method canRetry
   * @description 判断是否可以重试
   * @returns {boolean} 是否可以重试
   */
  canRetry(): boolean {
    return this._retryCount < this._maxRetries && this._status.isFailed();
  }

  /**
   * @method isExpired
   * @description 判断是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    if (!this._scheduledAt) {
      return false;
    }

    const expirationTime = this._priority.getExpirationTime();
    const expirationDate = new Date(
      this._scheduledAt.getTime() + expirationTime,
    );
    return new Date() > expirationDate;
  }

  /**
   * @method shouldSendNow
   * @description 判断是否应该立即发送
   * @returns {boolean} 是否应该立即发送
   */
  shouldSendNow(): boolean {
    if (!this._scheduledAt) {
      return true;
    }

    return new Date() >= this._scheduledAt;
  }

  /**
   * @method markAsSending
   * @description 标记为发送中状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsSending(): void {
    this._status = this._status.transitionTo(PushStatusType.SENDING);
    this._sentAt = new Date();
  }

  /**
   * @method markAsSent
   * @description 标记为已发送状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsSent(): void {
    this._status = this._status.transitionTo(PushStatusType.SENT);
    this._sentAt = new Date();
  }

  /**
   * @method markAsDelivered
   * @description 标记为已送达状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsDelivered(): void {
    this._status = this._status.transitionTo(PushStatusType.DELIVERED);
    this._deliveredAt = new Date();
  }

  /**
   * @method markAsFailed
   * @description 标记为失败状态
   * @param {string} reason 失败原因
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsFailed(reason: string): void {
    this._status = this._status.transitionTo(PushStatusType.FAILED);
    this._failureReason = reason;
  }

  /**
   * @method markAsPermanentlyFailed
   * @description 标记为永久失败状态
   * @param {string} reason 失败原因
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsPermanentlyFailed(reason: string): void {
    this._status = this._status.transitionTo(PushStatusType.PERMANENTLY_FAILED);
    this._failureReason = reason;
  }

  /**
   * @method markAsRetrying
   * @description 标记为重试中状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  markAsRetrying(): void {
    this._status = this._status.transitionTo(PushStatusType.SENDING);
    this._retryCount++;
  }

  /**
   * @method schedule
   * @description 调度推送通知
   * @param {Date} scheduledAt 计划发送时间
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  schedule(scheduledAt: Date): void {
    this._status = this._status.transitionTo(PushStatusType.SCHEDULED);
    this._scheduledAt = scheduledAt;
  }

  /**
   * @method updateContent
   * @description 更新推送内容
   * @param {PushContent} content 新的推送内容
   * @returns {void}
   * @throws {InvalidPushContentError} 当内容无效时抛出
   */
  updateContent(content: PushContent): void {
    if (this._status.isSent() || this._status.isDelivered()) {
      throw new Error('无法更新已发送的推送通知内容');
    }

    this._content = content;
  }

  /**
   * @method updatePriority
   * @description 更新推送优先级
   * @param {PushPriorityLevel} priority 新的推送优先级
   * @returns {void}
   */
  updatePriority(priority: PushPriorityLevel): void {
    this._priority = new PushPriority(priority);
    this._maxRetries = this._priority.getRetryCount();
  }

  /**
   * @method updateMetadata
   * @description 更新元数据
   * @param {Record<string, any>} metadata 新的元数据
   * @returns {void}
   */
  updateMetadata(metadata: Record<string, any>): void {
    this._metadata = { ...this._metadata, ...metadata };
  }

  /**
   * @method getNextRetryTime
   * @description 获取下次重试时间
   * @returns {Date | undefined} 下次重试时间
   */
  getNextRetryTime(): Date | undefined {
    if (!this.canRetry()) {
      return undefined;
    }

    const retryInterval = this._priority.getRetryInterval();
    return new Date(Date.now() + retryInterval);
  }

  /**
   * @method getPlatformContent
   * @description 获取平台特定的推送内容
   * @returns {Record<string, any>} 平台特定的推送内容
   */
  getPlatformContent(): Record<string, any> {
    return this._content.getPlatformContent(this._pushToken.getPlatform());
  }

  /**
   * @method toPlainObject
   * @description 转换为普通对象
   * @returns {Record<string, any>} 普通对象
   */
  toPlainObject(): Record<string, any> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      userId: this.userId,
      pushToken: this._pushToken.toString(),
      content: this._content.toPlainObject(),
      status: this._status.value,
      priority: this._priority.getValue(),
      scheduledAt: this._scheduledAt,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
      failureReason: this._failureReason,
      retryCount: this._retryCount,
      maxRetries: this._maxRetries,
      metadata: this._metadata,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
    };
  }

  /**
   * @method getEntityId
   * @description 获取实体ID
   * @returns {string} 实体ID
   */
  getEntityId(): string {
    return this.id;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  getTenantId(): string {
    return this.tenantId;
  }
}
