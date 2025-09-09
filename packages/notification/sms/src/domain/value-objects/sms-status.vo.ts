/**
 * @enum SmsStatusType
 * @description 短信通知状态类型枚举
 */
export enum SmsStatusType {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  PERMANENTLY_FAILED = 'PERMANENTLY_FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * @class SmsStatus
 * @description
 * 短信通知状态值对象，封装短信通知的状态管理和转换规则。
 *
 * 状态管理职责：
 * 1. 管理短信通知的生命周期状态
 * 2. 定义状态转换的业务规则
 * 3. 提供状态查询和验证方法
 * 4. 确保状态转换的合法性
 *
 * 状态转换规则：
 * 1. PENDING -> SENDING: 开始发送短信
 * 2. SENDING -> SENT: 短信发送成功
 * 3. SENDING -> FAILED: 短信发送失败
 * 4. SENT -> DELIVERED: 短信送达确认
 * 5. FAILED -> SENDING: 重试发送短信
 * 6. FAILED -> PERMANENTLY_FAILED: 达到最大重试次数
 *
 * 终态状态：
 * - DELIVERED: 成功送达
 * - PERMANENTLY_FAILED: 永久失败
 *
 * @property {SmsStatusType} value 状态值
 *
 * @example
 * ```typescript
 * const status = new SmsStatus(SmsStatusType.PENDING);
 * console.log(status.isPending()); // true
 * console.log(status.canTransitionTo(SmsStatusType.SENDING)); // true
 * ```
 * @since 1.0.0
 */
export class SmsStatus {
  constructor(public readonly value: SmsStatusType) {
    this.validateStatus(value);
  }

  /**
   * @method create
   * @description 创建状态对象
   * @param {SmsStatusType} status 状态类型
   * @returns {SmsStatus} 状态对象
   * @static
   */
  public static create(status: SmsStatusType): SmsStatus {
    return new SmsStatus(status);
  }

  /**
   * @method getStatus
   * @description 获取状态值
   * @returns {SmsStatusType} 状态值
   */
  public getStatus(): SmsStatusType {
    return this.value;
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  public isPending(): boolean {
    return this.value === SmsStatusType.PENDING;
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  public isSending(): boolean {
    return this.value === SmsStatusType.SENDING;
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  public isSent(): boolean {
    return this.value === SmsStatusType.SENT;
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  public isDelivered(): boolean {
    return this.value === SmsStatusType.DELIVERED;
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  public isFailed(): boolean {
    return this.value === SmsStatusType.FAILED;
  }

  /**
   * @method isPermanentlyFailed
   * @description 检查是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  public isPermanentlyFailed(): boolean {
    return this.value === SmsStatusType.PERMANENTLY_FAILED;
  }

  /**
   * @method isScheduled
   * @description 检查是否为已调度状态
   * @returns {boolean} 是否为已调度状态
   */
  public isScheduled(): boolean {
    return this.value === SmsStatusType.SCHEDULED;
  }

  /**
   * @method isRetrying
   * @description 检查是否为重试状态
   * @returns {boolean} 是否为重试状态
   */
  public isRetrying(): boolean {
    return this.value === SmsStatusType.RETRYING;
  }

  /**
   * @method isCancelled
   * @description 检查是否为已取消状态
   * @returns {boolean} 是否为已取消状态
   */
  public isCancelled(): boolean {
    return this.value === SmsStatusType.CANCELLED;
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return (
      this.isDelivered() || this.isPermanentlyFailed() || this.isCancelled()
    );
  }

  /**
   * @method isFinalStatus
   * @description 检查是否为终态（别名方法）
   * @returns {boolean} 是否为终态
   */
  public isFinalStatus(): boolean {
    return this.isFinal();
  }

  /**
   * @method isSuccessStatus
   * @description 检查是否为成功状态
   * @returns {boolean} 是否为成功状态
   */
  public isSuccessStatus(): boolean {
    return this.isDelivered();
  }

  /**
   * @method canTransitionTo
   * @description 检查是否可以转换到指定状态
   * @param {SmsStatusType} targetStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransitionTo(targetStatus: SmsStatusType): boolean {
    const validTransitions: Record<SmsStatusType, SmsStatusType[]> = {
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
      [SmsStatusType.DELIVERED]: [], // 终态
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
      [SmsStatusType.PERMANENTLY_FAILED]: [], // 终态
      [SmsStatusType.CANCELLED]: [], // 终态
    };

    return validTransitions[this.value].includes(targetStatus);
  }

  /**
   * @method transitionTo
   * @description 转换到指定状态
   * @param {SmsStatusType} targetStatus 目标状态
   * @returns {SmsStatus} 新的状态对象
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public transitionTo(targetStatus: SmsStatusType): SmsStatus {
    if (!this.canTransitionTo(targetStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${this.value} to ${targetStatus}`,
      );
    }

    return new SmsStatus(targetStatus);
  }

  /**
   * @method equals
   * @description 比较两个状态对象是否相等
   * @param {SmsStatus} other 另一个状态对象
   * @returns {boolean} 是否相等
   */
  public equals(other: SmsStatus): boolean {
    return this.value === other.value;
  }

  /**
   * @method toString
   * @description 返回状态的字符串表示
   * @returns {string} 状态字符串
   */
  public toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 返回状态的JSON表示
   * @returns {string} 状态JSON字符串
   */
  public toJSON(): string {
    return JSON.stringify({ value: this.value });
  }

  /**
   * @method fromJSON
   * @description 从JSON创建状态对象
   * @param {string} json JSON字符串
   * @returns {SmsStatus} 状态对象
   */
  public static fromJSON(json: string): SmsStatus {
    const data = JSON.parse(json);
    return new SmsStatus(data.value);
  }

  /**
   * @method validateStatus
   * @description 验证状态值的有效性
   * @param {SmsStatusType} status 状态值
   * @returns {void}
   * @throws {InvalidSmsStatusError} 当状态无效时抛出
   * @private
   */
  private validateStatus(status: SmsStatusType): void {
    if (!Object.values(SmsStatusType).includes(status)) {
      throw new InvalidSmsStatusError(`Invalid SMS status: ${status}`);
    }
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

/**
 * @class InvalidSmsStatusError
 * @description 无效短信状态错误
 */
export class InvalidSmsStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSmsStatusError';
  }
}

/**
 * @object SmsStatusConstants
 * @description 短信状态常量
 */
export const SmsStatusConstants = {
  /**
   * 所有状态类型
   */
  ALL_STATUSES: Object.values(SmsStatusType),

  /**
   * 终态状态
   */
  FINAL_STATUSES: [
    SmsStatusType.DELIVERED,
    SmsStatusType.PERMANENTLY_FAILED,
    SmsStatusType.CANCELLED,
  ],

  /**
   * 可重试状态
   */
  RETRYABLE_STATUSES: [SmsStatusType.PENDING, SmsStatusType.FAILED],

  /**
   * 进行中状态
   */
  IN_PROGRESS_STATUSES: [SmsStatusType.SENDING],
} as const;
