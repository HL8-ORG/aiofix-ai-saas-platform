import { BaseEntity } from '@aiofix/core';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { SmsStatus, SmsStatusType } from '../value-objects/sms-status.vo';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider, SmsProviderType } from '../value-objects/sms-provider.vo';

/**
 * 短信通知实体
 *
 * 负责管理短信通知的状态、业务规则和生命周期。
 *
 * 实体职责：
 * - 管理短信通知的状态和状态转换
 * - 维护短信通知的业务规则和约束
 * - 处理短信通知的生命周期管理
 * - 提供短信通知的业务方法
 *
 * 状态管理：
 * - 短信状态：PENDING -> SENDING -> SENT/FAILED
 * - 状态转换验证和业务规则检查
 * - 重试机制和失败处理
 *
 * 业务规则：
 * - 手机号必须有效且可接收短信
 * - 短信内容必须符合运营商要求
 * - 状态转换必须遵循预定义的状态机
 * - 重试次数不能超过最大限制
 *
 * @class SmsNotifEntity
 * @extends BaseEntity
 */
export class SmsNotifEntity extends BaseEntity {
  private readonly statusValidator = new SmsStatusValidator();

  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    private _phoneNumber: PhoneNumber,
    private _content: SmsContent,
    private _provider: SmsProvider,
    private _status: SmsStatus,
    private _scheduledAt?: Date,
    private _sentAt?: Date,
    private _deliveredAt?: Date,
    private _failureReason?: string,
    private _retryCount: number = 0,
    private _maxRetries: number = 3,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * 获取手机号
   *
   * @returns {PhoneNumber} 手机号
   */
  public getPhoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  /**
   * 获取短信内容
   *
   * @returns {SmsContent} 短信内容
   */
  public getContent(): SmsContent {
    return this._content;
  }

  /**
   * 获取短信提供商
   *
   * @returns {SmsProvider} 短信提供商
   */
  public getProvider(): SmsProvider {
    return this._provider;
  }

  /**
   * 获取短信状态
   *
   * @returns {SmsStatus} 短信状态
   */
  public getStatus(): SmsStatus {
    return this._status;
  }

  /**
   * 获取调度时间
   *
   * @returns {Date | undefined} 调度时间
   */
  public getScheduledAt(): Date | undefined {
    return this._scheduledAt;
  }

  /**
   * 获取发送时间
   *
   * @returns {Date | undefined} 发送时间
   */
  public getSentAt(): Date | undefined {
    return this._sentAt;
  }

  /**
   * 获取送达时间
   *
   * @returns {Date | undefined} 送达时间
   */
  public getDeliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  /**
   * 获取失败原因
   *
   * @returns {string | undefined} 失败原因
   */
  public getFailureReason(): string | undefined {
    return this._failureReason;
  }

  /**
   * 获取重试次数
   *
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this._retryCount;
  }

  /**
   * 获取最大重试次数
   *
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this._maxRetries;
  }

  /**
   * 检查是否可以发送
   *
   * @returns {boolean} 是否可以发送
   */
  public canSend(): boolean {
    return (
      (this._status.getStatus() === SmsStatusType.PENDING ||
        this._status.getStatus() === SmsStatusType.SCHEDULED) &&
      this._phoneNumber.canReceiveSms() &&
      this._provider.isAvailable()
    );
  }

  /**
   * 检查是否可以重试
   *
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return (
      this._status.getStatus() === SmsStatusType.FAILED &&
      this._retryCount < this._maxRetries
    );
  }

  /**
   * 检查是否已过期
   *
   * @returns {boolean} 是否已过期
   */
  public isExpired(): boolean {
    if (!this._scheduledAt) {
      return false;
    }

    // 短信有效期通常为24小时
    const expirationTime = 24 * 60 * 60 * 1000; // 24小时
    const expirationDate = new Date(
      this._scheduledAt.getTime() + expirationTime,
    );
    return new Date() > expirationDate;
  }

  /**
   * 标记为发送中
   *
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSending(): void {
    this._status = this._status.transitionTo(SmsStatusType.SENDING);
  }

  /**
   * 标记为已发送
   *
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsSent(): void {
    this._status = this._status.transitionTo(SmsStatusType.SENT);
    this._sentAt = new Date();
  }

  /**
   * 标记为已送达
   *
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsDelivered(): void {
    this._status = this._status.transitionTo(SmsStatusType.DELIVERED);
    this._deliveredAt = new Date();
  }

  /**
   * 标记为发送失败
   *
   * @param {string} reason 失败原因
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsFailed(reason: string): void {
    this._status = this._status.transitionTo(SmsStatusType.FAILED, reason);
    this._failureReason = reason;
  }

  /**
   * 标记为永久失败
   *
   * @param {string} reason 失败原因
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsPermanentlyFailed(reason: string): void {
    this._status = this._status.transitionTo(
      SmsStatusType.PERMANENTLY_FAILED,
      reason,
    );
    this._failureReason = reason;
  }

  /**
   * 标记为重试中
   *
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRetrying(): void {
    this._status = this._status.transitionTo(SmsStatusType.RETRYING);
    this._retryCount += 1;
  }

  /**
   * 取消短信发送
   *
   * @param {string} reason 取消原因
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public cancel(reason: string): void {
    this._status = this._status.transitionTo(SmsStatusType.CANCELLED, reason);
    this._failureReason = reason;
  }

  /**
   * 调度短信发送
   *
   * @param {Date} scheduledAt 调度时间
   * @throws {InvalidSchedulingError} 当调度时间无效时抛出
   */
  public schedule(scheduledAt: Date): void {
    if (scheduledAt <= new Date()) {
      throw new InvalidSchedulingError('调度时间必须是未来时间');
    }

    this._scheduledAt = scheduledAt;
    this._status = this._status.transitionTo(SmsStatusType.SCHEDULED);
  }

  /**
   * 更新短信内容
   *
   * @param {SmsContent} content 新的短信内容
   * @throws {InvalidContentUpdateError} 当内容更新无效时抛出
   */
  public updateContent(content: SmsContent): void {
    if (this._status.getStatus() !== SmsStatusType.PENDING) {
      throw new InvalidContentUpdateError('只有待发送状态的短信才能更新内容');
    }

    this._content = content;
  }

  /**
   * 更新短信提供商
   *
   * @param {SmsProvider} provider 新的短信提供商
   * @throws {InvalidProviderUpdateError} 当提供商更新无效时抛出
   */
  public updateProvider(provider: SmsProvider): void {
    if (this._status.getStatus() !== SmsStatusType.PENDING) {
      throw new InvalidProviderUpdateError(
        '只有待发送状态的短信才能更新提供商',
      );
    }

    if (!provider.supportsRegion(this._phoneNumber.getRegion())) {
      throw new InvalidProviderUpdateError('提供商不支持该地区');
    }

    this._provider = provider;
  }

  /**
   * 获取短信摘要信息
   *
   * @returns {object} 短信摘要信息
   */
  public getSummary(): object {
    return {
      id: this.id,
      phoneNumber: this._phoneNumber.getInternationalFormat(),
      content: this._content.getSummary(),
      status: this._status.getStatus(),
      provider: this._provider.getProviderName(),
      retryCount: this._retryCount,
      maxRetries: this._maxRetries,
      scheduledAt: this._scheduledAt,
      sentAt: this._sentAt,
      deliveredAt: this._deliveredAt,
    };
  }

  /**
   * 验证实体状态
   *
   * @throws {InvalidSmsNotifError} 当实体状态无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidSmsNotifError('短信通知ID不能为空');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new InvalidSmsNotifError('租户ID不能为空');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new InvalidSmsNotifError('用户ID不能为空');
    }

    if (!this._phoneNumber.isValid()) {
      throw new InvalidSmsNotifError('手机号无效');
    }

    if (!this._phoneNumber.canReceiveSms()) {
      throw new InvalidSmsNotifError('手机号不支持短信接收');
    }

    if (!this._provider.supportsRegion(this._phoneNumber.getRegion())) {
      throw new InvalidSmsNotifError('提供商不支持该地区');
    }

    if (!this._provider.supportsEncoding(this._content.getEncoding())) {
      throw new InvalidSmsNotifError('提供商不支持该编码方式');
    }

    if (this._retryCount < 0) {
      throw new InvalidSmsNotifError('重试次数不能为负数');
    }

    if (this._maxRetries < 0) {
      throw new InvalidSmsNotifError('最大重试次数不能为负数');
    }

    if (this._retryCount > this._maxRetries) {
      throw new InvalidSmsNotifError('重试次数不能超过最大重试次数');
    }
  }
}

/**
 * 短信状态验证器
 */
class SmsStatusValidator {
  /**
   * 验证状态转换
   *
   * @param {SmsStatusType} fromStatus 原状态
   * @param {SmsStatusType} toStatus 目标状态
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public validateTransition(
    fromStatus: SmsStatusType,
    toStatus: SmsStatusType,
  ): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  /**
   * 检查是否可以转换状态
   *
   * @param {SmsStatusType} fromStatus 原状态
   * @param {SmsStatusType} toStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransition(
    fromStatus: SmsStatusType,
    toStatus: SmsStatusType,
  ): boolean {
    const transitionRules: Record<SmsStatusType, SmsStatusType[]> = {
      [SmsStatusType.PENDING]: [
        SmsStatusType.SENDING,
        SmsStatusType.SCHEDULED,
        SmsStatusType.CANCELLED,
      ],
      [SmsStatusType.SCHEDULED]: [
        SmsStatusType.SENDING,
        SmsStatusType.CANCELLED,
      ],
      [SmsStatusType.SENDING]: [
        SmsStatusType.SENT,
        SmsStatusType.FAILED,
        SmsStatusType.CANCELLED,
      ],
      [SmsStatusType.SENT]: [SmsStatusType.DELIVERED, SmsStatusType.FAILED],
      [SmsStatusType.DELIVERED]: [], // 最终状态
      [SmsStatusType.FAILED]: [
        SmsStatusType.RETRYING,
        SmsStatusType.PERMANENTLY_FAILED,
        SmsStatusType.CANCELLED,
      ],
      [SmsStatusType.RETRYING]: [
        SmsStatusType.SENDING,
        SmsStatusType.PERMANENTLY_FAILED,
        SmsStatusType.CANCELLED,
      ],
      [SmsStatusType.PERMANENTLY_FAILED]: [], // 最终状态
      [SmsStatusType.CANCELLED]: [], // 最终状态
    };

    return transitionRules[fromStatus]?.includes(toStatus) ?? false;
  }
}

/**
 * 无效短信通知错误
 */
export class InvalidSmsNotifError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSmsNotifError';
  }
}

/**
 * 无效状态转换错误
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * 无效调度错误
 */
export class InvalidSchedulingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSchedulingError';
  }
}

/**
 * 无效内容更新错误
 */
export class InvalidContentUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContentUpdateError';
  }
}

/**
 * 无效提供商更新错误
 */
export class InvalidProviderUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProviderUpdateError';
  }
}
