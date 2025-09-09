/**
 * @enum PushStatusType
 * @description 推送通知状态类型枚举
 */
export enum PushStatusType {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  PERMANENTLY_FAILED = 'PERMANENTLY_FAILED',
}

/**
 * @class PushStatus
 * @description
 * 推送通知状态值对象，封装推送通知的状态管理和转换规则。
 *
 * 状态管理职责：
 * 1. 管理推送通知的生命周期状态
 * 2. 定义状态转换的业务规则
 * 3. 提供状态查询和验证方法
 * 4. 确保状态转换的合法性
 *
 * 状态转换规则：
 * 1. PENDING -> SENDING: 开始发送推送
 * 2. PENDING -> SCHEDULED: 延迟发送推送
 * 3. SCHEDULED -> SENDING: 执行延迟推送
 * 4. SENDING -> SENT: 推送发送成功
 * 5. SENDING -> FAILED: 推送发送失败
 * 6. SENT -> DELIVERED: 推送送达确认
 * 7. FAILED -> SENDING: 重试发送推送
 * 8. FAILED -> PERMANENTLY_FAILED: 达到最大重试次数
 *
 * 终态状态：
 * - DELIVERED: 成功送达
 * - PERMANENTLY_FAILED: 永久失败
 *
 * @property {PushStatusType} value 状态值
 *
 * @example
 * ```typescript
 * const status = new PushStatus(PushStatusType.PENDING);
 * console.log(status.isPending()); // true
 * console.log(status.canTransitionTo(PushStatusType.SENDING)); // true
 * ```
 * @since 1.0.0
 */
export class PushStatus {
  constructor(public readonly value: PushStatusType) {
    this.validateStatus(value);
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  public isPending(): boolean {
    return this.value === PushStatusType.PENDING;
  }

  /**
   * @method isScheduled
   * @description 检查是否为已调度状态
   * @returns {boolean} 是否为已调度状态
   */
  public isScheduled(): boolean {
    return this.value === PushStatusType.SCHEDULED;
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  public isSending(): boolean {
    return this.value === PushStatusType.SENDING;
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  public isSent(): boolean {
    return this.value === PushStatusType.SENT;
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  public isDelivered(): boolean {
    return this.value === PushStatusType.DELIVERED;
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  public isFailed(): boolean {
    return this.value === PushStatusType.FAILED;
  }

  /**
   * @method isPermanentlyFailed
   * @description 检查是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  public isPermanentlyFailed(): boolean {
    return this.value === PushStatusType.PERMANENTLY_FAILED;
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return this.isDelivered() || this.isPermanentlyFailed();
  }

  /**
   * @method canTransitionTo
   * @description 检查是否可以转换到指定状态
   * @param {PushStatusType} targetStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransitionTo(targetStatus: PushStatusType): boolean {
    const validTransitions: Record<PushStatusType, PushStatusType[]> = {
      [PushStatusType.PENDING]: [
        PushStatusType.SENDING,
        PushStatusType.SCHEDULED,
      ],
      [PushStatusType.SCHEDULED]: [PushStatusType.SENDING],
      [PushStatusType.SENDING]: [PushStatusType.SENT, PushStatusType.FAILED],
      [PushStatusType.SENT]: [PushStatusType.DELIVERED],
      [PushStatusType.DELIVERED]: [], // 终态
      [PushStatusType.FAILED]: [
        PushStatusType.SENDING,
        PushStatusType.PERMANENTLY_FAILED,
      ],
      [PushStatusType.PERMANENTLY_FAILED]: [], // 终态
    };

    return validTransitions[this.value].includes(targetStatus);
  }

  /**
   * @method transitionTo
   * @description 转换到指定状态
   * @param {PushStatusType} targetStatus 目标状态
   * @returns {PushStatus} 新的状态对象
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public transitionTo(targetStatus: PushStatusType): PushStatus {
    if (!this.canTransitionTo(targetStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${this.value} to ${targetStatus}`,
      );
    }

    return new PushStatus(targetStatus);
  }

  /**
   * @method equals
   * @description 比较两个状态对象是否相等
   * @param {PushStatus} other 另一个状态对象
   * @returns {boolean} 是否相等
   */
  public equals(other: PushStatus): boolean {
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
   * @returns {PushStatus} 状态对象
   */
  public static fromJSON(json: string): PushStatus {
    const data = JSON.parse(json);
    return new PushStatus(data.value);
  }

  /**
   * @method validateStatus
   * @description 验证状态值的有效性
   * @param {PushStatusType} status 状态值
   * @returns {void}
   * @throws {InvalidPushStatusError} 当状态无效时抛出
   * @private
   */
  private validateStatus(status: PushStatusType): void {
    if (!Object.values(PushStatusType).includes(status)) {
      throw new InvalidPushStatusError(`Invalid push status: ${status}`);
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
 * @class InvalidPushStatusError
 * @description 无效推送状态错误
 */
export class InvalidPushStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPushStatusError';
  }
}

/**
 * @object PushStatusConstants
 * @description 推送状态常量
 */
export const PushStatusConstants = {
  /**
   * 所有状态类型
   */
  ALL_STATUSES: Object.values(PushStatusType),

  /**
   * 终态状态
   */
  FINAL_STATUSES: [PushStatusType.DELIVERED, PushStatusType.PERMANENTLY_FAILED],

  /**
   * 可重试状态
   */
  RETRYABLE_STATUSES: [
    PushStatusType.PENDING,
    PushStatusType.SCHEDULED,
    PushStatusType.FAILED,
  ],

  /**
   * 进行中状态
   */
  IN_PROGRESS_STATUSES: [PushStatusType.SENDING],
} as const;
