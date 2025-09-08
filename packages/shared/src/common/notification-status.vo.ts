import { ValueObject } from '@aiofix/core';

/**
 * @enum NotificationStatusType
 * @description 通知状态类型枚举
 *
 * 定义通知发送过程中的各种状态
 */
export enum NotificationStatusType {
  /** 待发送 */
  PENDING = 'PENDING',
  /** 已调度 */
  SCHEDULED = 'SCHEDULED',
  /** 发送中 */
  SENDING = 'SENDING',
  /** 已发送 */
  SENT = 'SENT',
  /** 已送达 */
  DELIVERED = 'DELIVERED',
  /** 发送失败 */
  FAILED = 'FAILED',
  /** 重试中 */
  RETRYING = 'RETRYING',
  /** 永久失败 */
  PERMANENTLY_FAILED = 'PERMANENTLY_FAILED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

/**
 * @class NotificationStatus
 * @description
 * 通知状态值对象，封装通知发送过程中的状态信息。
 *
 * 状态特性：
 * 1. 表示通知的当前处理状态
 * 2. 支持状态转换和状态机验证
 * 3. 提供状态相关的业务规则
 * 4. 支持状态历史跟踪和审计
 *
 * 状态流转：
 * 1. PENDING -> SENDING -> SENT/FAILED
 * 2. PENDING -> SCHEDULED -> SENDING -> SENT/FAILED
 * 3. SENT -> DELIVERED/FAILED
 * 4. FAILED -> RETRYING -> SENT/PERMANENTLY_FAILED
 *
 * 业务规则：
 * 1. 状态转换必须遵循预定义的状态机
 * 2. 某些状态转换需要满足特定条件
 * 3. 失败状态需要记录失败原因
 * 4. 支持状态的重试和恢复机制
 *
 * @example
 * ```typescript
 * const status = NotificationStatus.create(NotificationStatusType.PENDING);
 * const failedStatus = status.transitionTo(NotificationStatusType.FAILED, '网络超时');
 * ```
 * @since 1.0.0
 */
export class NotificationStatus extends ValueObject<{
  readonly status: NotificationStatusType;
  readonly timestamp: Date;
  readonly reason?: string;
  readonly retryCount: number;
  readonly maxRetries: number;
}> {
  /**
   * @method create
   * @description 创建通知状态值对象
   * @param {NotificationStatusType} status 状态类型
   * @param {string} [reason] 状态原因
   * @param {number} [retryCount] 重试次数
   * @param {number} [maxRetries] 最大重试次数
   * @returns {NotificationStatus} 通知状态值对象
   */
  public static create(
    status: NotificationStatusType,
    reason?: string,
    retryCount: number = 0,
    maxRetries: number = 3,
  ): NotificationStatus {
    return new NotificationStatus({
      status,
      timestamp: new Date(),
      reason,
      retryCount,
      maxRetries,
    });
  }

  /**
   * @method getStatus
   * @description 获取状态类型
   * @returns {NotificationStatusType} 状态类型
   */
  public getStatus(): NotificationStatusType {
    return this.value.status;
  }

  /**
   * @method getTimestamp
   * @description 获取状态时间戳
   * @returns {Date} 状态时间戳
   */
  public getTimestamp(): Date {
    return this.value.timestamp;
  }

  /**
   * @method getReason
   * @description 获取状态原因
   * @returns {string | undefined} 状态原因
   */
  public getReason(): string | undefined {
    return this.value.reason;
  }

  /**
   * @method getRetryCount
   * @description 获取重试次数
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this.value.retryCount;
  }

  /**
   * @method getMaxRetries
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this.value.maxRetries;
  }

  /**
   * @method isPending
   * @description 判断是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  public isPending(): boolean {
    return this.value.status === NotificationStatusType.PENDING;
  }

  /**
   * @method isSending
   * @description 判断是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  public isSending(): boolean {
    return this.value.status === NotificationStatusType.SENDING;
  }

  /**
   * @method isSent
   * @description 判断是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  public isSent(): boolean {
    return this.value.status === NotificationStatusType.SENT;
  }

  /**
   * @method isDelivered
   * @description 判断是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  public isDelivered(): boolean {
    return this.value.status === NotificationStatusType.DELIVERED;
  }

  /**
   * @method isFailed
   * @description 判断是否为失败状态
   * @returns {boolean} 是否为失败状态
   */
  public isFailed(): boolean {
    return this.value.status === NotificationStatusType.FAILED;
  }

  /**
   * @method isPermanentlyFailed
   * @description 判断是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  public isPermanentlyFailed(): boolean {
    return this.value.status === NotificationStatusType.PERMANENTLY_FAILED;
  }

  /**
   * @method isScheduled
   * @description 判断是否为已调度状态
   * @returns {boolean} 是否为已调度状态
   */
  public isScheduled(): boolean {
    return this.value.status === NotificationStatusType.SCHEDULED;
  }

  /**
   * @method isRetrying
   * @description 判断是否为重试中状态
   * @returns {boolean} 是否为重试中状态
   */
  public isRetrying(): boolean {
    return this.value.status === NotificationStatusType.RETRYING;
  }

  /**
   * @method isCancelled
   * @description 判断是否为已取消状态
   * @returns {boolean} 是否为已取消状态
   */
  public isCancelled(): boolean {
    return this.value.status === NotificationStatusType.CANCELLED;
  }

  /**
   * @method canRetry
   * @description 检查是否可以重试
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return (
      this.value.status === NotificationStatusType.FAILED &&
      this.value.retryCount < this.value.maxRetries
    );
  }

  /**
   * @method hasExceededMaxRetries
   * @description 检查是否已超过最大重试次数
   * @returns {boolean} 是否已超过最大重试次数
   */
  public hasExceededMaxRetries(): boolean {
    return this.value.retryCount >= this.value.maxRetries;
  }

  /**
   * @method isFinalStatus
   * @description 检查是否为最终状态
   * @returns {boolean} 是否为最终状态
   */
  public isFinalStatus(): boolean {
    return [
      NotificationStatusType.SENT,
      NotificationStatusType.DELIVERED,
      NotificationStatusType.PERMANENTLY_FAILED,
      NotificationStatusType.CANCELLED,
    ].includes(this.value.status);
  }

  /**
   * @method isFailedStatus
   * @description 检查是否为失败状态
   * @returns {boolean} 是否为失败状态
   */
  public isFailedStatus(): boolean {
    return [
      NotificationStatusType.FAILED,
      NotificationStatusType.PERMANENTLY_FAILED,
    ].includes(this.value.status);
  }

  /**
   * @method isSuccessStatus
   * @description 检查是否为成功状态
   * @returns {boolean} 是否为成功状态
   */
  public isSuccessStatus(): boolean {
    return [
      NotificationStatusType.SENT,
      NotificationStatusType.DELIVERED,
    ].includes(this.value.status);
  }

  /**
   * @method canTransitionTo
   * @description 判断是否可以转换到指定状态
   * @param {NotificationStatusType} targetStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransitionTo(targetStatus: NotificationStatusType): boolean {
    const currentStatus = this.value.status;
    const validTransitions = this.getValidTransitions(currentStatus);
    return validTransitions.includes(targetStatus);
  }

  /**
   * @method transitionTo
   * @description 转换到新状态
   * @param {NotificationStatusType} newStatus 新状态
   * @param {string} [reason] 状态变更原因
   * @returns {NotificationStatus} 新的通知状态
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public transitionTo(
    newStatus: NotificationStatusType,
    reason?: string,
  ): NotificationStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        `无法从状态 ${this.value.status} 转换到状态 ${newStatus}`,
      );
    }

    let newRetryCount = this.value.retryCount;

    // 如果是重试，增加重试次数
    if (newStatus === NotificationStatusType.RETRYING) {
      newRetryCount += 1;
    }

    return new NotificationStatus({
      status: newStatus,
      timestamp: new Date(),
      reason,
      retryCount: newRetryCount,
      maxRetries: this.value.maxRetries,
    });
  }

  /**
   * @method getValidTransitions
   * @description 获取当前状态的有效转换状态
   * @param {NotificationStatusType} currentStatus 当前状态
   * @returns {NotificationStatusType[]} 有效转换状态列表
   * @private
   */
  private getValidTransitions(
    currentStatus: NotificationStatusType,
  ): NotificationStatusType[] {
    const transitionMap: Record<
      NotificationStatusType,
      NotificationStatusType[]
    > = {
      [NotificationStatusType.PENDING]: [
        NotificationStatusType.SENDING,
        NotificationStatusType.SCHEDULED,
        NotificationStatusType.CANCELLED,
      ],
      [NotificationStatusType.SCHEDULED]: [
        NotificationStatusType.SENDING,
        NotificationStatusType.CANCELLED,
      ],
      [NotificationStatusType.SENDING]: [
        NotificationStatusType.SENT,
        NotificationStatusType.FAILED,
        NotificationStatusType.CANCELLED,
      ],
      [NotificationStatusType.SENT]: [
        NotificationStatusType.DELIVERED,
        NotificationStatusType.FAILED,
      ],
      [NotificationStatusType.DELIVERED]: [], // 最终状态
      [NotificationStatusType.FAILED]: [
        NotificationStatusType.RETRYING,
        NotificationStatusType.PERMANENTLY_FAILED,
        NotificationStatusType.CANCELLED,
      ],
      [NotificationStatusType.RETRYING]: [
        NotificationStatusType.SENDING,
        NotificationStatusType.PERMANENTLY_FAILED,
        NotificationStatusType.CANCELLED,
      ],
      [NotificationStatusType.PERMANENTLY_FAILED]: [], // 最终状态
      [NotificationStatusType.CANCELLED]: [], // 最终状态
    };

    return transitionMap[currentStatus] || [];
  }

  /**
   * @method getStatusDescription
   * @description 获取状态描述
   * @returns {string} 状态描述
   */
  public getStatusDescription(): string {
    const descriptions: Record<NotificationStatusType, string> = {
      [NotificationStatusType.PENDING]: '待发送',
      [NotificationStatusType.SCHEDULED]: '已调度',
      [NotificationStatusType.SENDING]: '发送中',
      [NotificationStatusType.SENT]: '已发送',
      [NotificationStatusType.DELIVERED]: '已送达',
      [NotificationStatusType.FAILED]: '发送失败',
      [NotificationStatusType.RETRYING]: '重试中',
      [NotificationStatusType.PERMANENTLY_FAILED]: '永久失败',
      [NotificationStatusType.CANCELLED]: '已取消',
    };

    return descriptions[this.value.status] || '未知状态';
  }

  /**
   * @method getStatusPriority
   * @description 获取状态优先级（用于排序）
   * @returns {number} 状态优先级
   */
  public getStatusPriority(): number {
    const priorities: Record<NotificationStatusType, number> = {
      [NotificationStatusType.PENDING]: 1,
      [NotificationStatusType.SCHEDULED]: 2,
      [NotificationStatusType.SENDING]: 3,
      [NotificationStatusType.RETRYING]: 4,
      [NotificationStatusType.SENT]: 5,
      [NotificationStatusType.DELIVERED]: 6,
      [NotificationStatusType.FAILED]: 7,
      [NotificationStatusType.PERMANENTLY_FAILED]: 8,
      [NotificationStatusType.CANCELLED]: 9,
    };

    return priorities[this.value.status] || 0;
  }

  /**
   * @method getSummary
   * @description 获取状态摘要信息
   * @returns {object} 状态摘要
   */
  public getSummary(): {
    status: NotificationStatusType;
    description: string;
    timestamp: Date;
    reason?: string;
    retryCount: number;
    maxRetries: number;
    canRetry: boolean;
    isFinal: boolean;
  } {
    return {
      status: this.value.status,
      description: this.getStatusDescription(),
      timestamp: this.value.timestamp,
      reason: this.value.reason,
      retryCount: this.value.retryCount,
      maxRetries: this.value.maxRetries,
      canRetry: this.canRetry(),
      isFinal: this.isFinalStatus(),
    };
  }
}

/**
 * @class InvalidStatusTransitionError
 * @description 无效状态转换错误
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
