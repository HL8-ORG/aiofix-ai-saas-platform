import { ValueObject } from '@aiofix/core';

/**
 * @enum EmailStatusType
 * @description 邮件状态类型枚举
 *
 * 定义邮件发送过程中的各种状态
 */
export enum EmailStatusType {
  /** 待发送 */
  PENDING = 'PENDING',
  /** 发送中 */
  SENDING = 'SENDING',
  /** 已发送 */
  SENT = 'SENT',
  /** 已送达 */
  DELIVERED = 'DELIVERED',
  /** 发送失败 */
  FAILED = 'FAILED',
  /** 永久失败 */
  PERMANENTLY_FAILED = 'PERMANENTLY_FAILED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

/**
 * @class EmailStatus
 * @description
 * 邮件状态值对象，封装邮件发送过程中的状态信息。
 *
 * 状态特性：
 * 1. 表示邮件的当前发送状态
 * 2. 支持状态转换和状态机验证
 * 3. 提供状态相关的业务规则
 * 4. 支持状态历史跟踪和审计
 *
 * 状态流转：
 * 1. PENDING -> SENDING -> SENT/FAILED
 * 2. SENT -> DELIVERED/FAILED
 * 3. FAILED -> SENDING (重试) -> SENT/PERMANENTLY_FAILED
 * 4. 任何状态 -> CANCELLED
 *
 * 业务规则：
 * 1. 状态转换必须遵循预定义的状态机
 * 2. 某些状态转换需要满足特定条件
 * 3. 失败状态需要记录失败原因
 * 4. 终态状态不能再次转换
 *
 * @property {EmailStatusType} value 状态值
 *
 * @example
 * ```typescript
 * const status = new EmailStatus(EmailStatusType.PENDING);
 * console.log(status.canTransitionTo(EmailStatusType.SENDING)); // true
 * ```
 * @since 1.0.0
 */
export class EmailStatus extends ValueObject<EmailStatusType> {
  constructor(value: EmailStatusType) {
    super(value);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证状态值的有效性
   * @returns {void}
   * @throws {InvalidEmailStatusError} 当状态值无效时抛出
   * @private
   */
  private validate(): void {
    if (!Object.values(EmailStatusType).includes(this.value)) {
      throw new InvalidEmailStatusError(`Invalid email status: ${this.value}`);
    }
  }

  /**
   * @method canTransitionTo
   * @description 检查是否可以转换到指定状态
   * @param {EmailStatusType} targetStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  canTransitionTo(targetStatus: EmailStatusType): boolean {
    const validTransitions: Record<EmailStatusType, EmailStatusType[]> = {
      [EmailStatusType.PENDING]: [
        EmailStatusType.SENDING,
        EmailStatusType.CANCELLED,
      ],
      [EmailStatusType.SENDING]: [
        EmailStatusType.SENT,
        EmailStatusType.FAILED,
        EmailStatusType.CANCELLED,
      ],
      [EmailStatusType.SENT]: [
        EmailStatusType.DELIVERED,
        EmailStatusType.FAILED,
      ],
      [EmailStatusType.DELIVERED]: [], // 终态
      [EmailStatusType.FAILED]: [
        EmailStatusType.SENDING, // 重试
        EmailStatusType.PERMANENTLY_FAILED,
        EmailStatusType.CANCELLED,
      ],
      [EmailStatusType.PERMANENTLY_FAILED]: [], // 终态
      [EmailStatusType.CANCELLED]: [], // 终态
    };

    return validTransitions[this.value].includes(targetStatus);
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  isFinal(): boolean {
    const finalStatuses = [
      EmailStatusType.DELIVERED,
      EmailStatusType.PERMANENTLY_FAILED,
      EmailStatusType.CANCELLED,
    ];
    return finalStatuses.includes(this.value);
  }

  /**
   * @method isPending
   * @description 检查是否为待发送状态
   * @returns {boolean} 是否为待发送状态
   */
  isPending(): boolean {
    return this.value === EmailStatusType.PENDING;
  }

  /**
   * @method isSending
   * @description 检查是否为发送中状态
   * @returns {boolean} 是否为发送中状态
   */
  isSending(): boolean {
    return this.value === EmailStatusType.SENDING;
  }

  /**
   * @method isSent
   * @description 检查是否为已发送状态
   * @returns {boolean} 是否为已发送状态
   */
  isSent(): boolean {
    return this.value === EmailStatusType.SENT;
  }

  /**
   * @method isDelivered
   * @description 检查是否为已送达状态
   * @returns {boolean} 是否为已送达状态
   */
  isDelivered(): boolean {
    return this.value === EmailStatusType.DELIVERED;
  }

  /**
   * @method isFailed
   * @description 检查是否为发送失败状态
   * @returns {boolean} 是否为发送失败状态
   */
  isFailed(): boolean {
    return this.value === EmailStatusType.FAILED;
  }

  /**
   * @method isPermanentlyFailed
   * @description 检查是否为永久失败状态
   * @returns {boolean} 是否为永久失败状态
   */
  isPermanentlyFailed(): boolean {
    return this.value === EmailStatusType.PERMANENTLY_FAILED;
  }

  /**
   * @method isCancelled
   * @description 检查是否为已取消状态
   * @returns {boolean} 是否为已取消状态
   */
  isCancelled(): boolean {
    return this.value === EmailStatusType.CANCELLED;
  }

  /**
   * @method canRetry
   * @description 检查是否可以重试
   * @returns {boolean} 是否可以重试
   */
  canRetry(): boolean {
    return this.value === EmailStatusType.FAILED;
  }

  /**
   * @method toString
   * @description 转换为字符串表示
   * @returns {string} 字符串表示
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 转换为JSON格式
   * @returns {string} JSON字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class EmailStatusValidator
 * @description 邮件状态验证器
 */
export class EmailStatusValidator {
  /**
   * @method validateTransition
   * @description 验证状态转换的有效性
   * @param {EmailStatusType} fromStatus 源状态
   * @param {EmailStatusType} toStatus 目标状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  validateTransition(
    fromStatus: EmailStatusType,
    toStatus: EmailStatusType,
  ): void {
    const fromStatusObj = new EmailStatus(fromStatus);
    if (!fromStatusObj.canTransitionTo(toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }
}

/**
 * @class InvalidEmailStatusError
 * @description 无效邮件状态错误
 */
export class InvalidEmailStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailStatusError';
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

// 导出状态常量
export const EmailStatusConstants = {
  PENDING: EmailStatusType.PENDING,
  SENDING: EmailStatusType.SENDING,
  SENT: EmailStatusType.SENT,
  DELIVERED: EmailStatusType.DELIVERED,
  FAILED: EmailStatusType.FAILED,
  PERMANENTLY_FAILED: EmailStatusType.PERMANENTLY_FAILED,
  CANCELLED: EmailStatusType.CANCELLED,
} as const;
