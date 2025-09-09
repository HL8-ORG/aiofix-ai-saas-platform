import { ValueObject } from '@aiofix/core';

/**
 * @enum EmailPriorityType
 * @description 邮件优先级类型枚举
 *
 * 定义邮件发送的优先级级别
 */
export enum EmailPriorityType {
  /** 低优先级 */
  LOW = 'LOW',
  /** 普通优先级 */
  NORMAL = 'NORMAL',
  /** 高优先级 */
  HIGH = 'HIGH',
  /** 紧急优先级 */
  URGENT = 'URGENT',
}

/**
 * @class EmailPriority
 * @description
 * 邮件优先级值对象，封装邮件发送的优先级信息。
 *
 * 优先级特性：
 * 1. 表示邮件发送的优先级级别
 * 2. 影响邮件发送的调度顺序
 * 3. 提供优先级相关的业务规则
 * 4. 支持优先级比较和排序
 *
 * 优先级规则：
 * 1. URGENT > HIGH > NORMAL > LOW
 * 2. 高优先级邮件优先发送
 * 3. 优先级影响重试策略
 * 4. 优先级影响失败处理
 *
 * @property {EmailPriorityType} value 优先级值
 *
 * @example
 * ```typescript
 * const priority = new EmailPriority(EmailPriorityType.HIGH);
 * console.log(priority.isHigherThan(EmailPriorityType.NORMAL)); // true
 * ```
 * @since 1.0.0
 */
export class EmailPriority extends ValueObject<EmailPriorityType> {
  constructor(value: EmailPriorityType) {
    super(value);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证优先级值的有效性
   * @returns {void}
   * @throws {InvalidEmailPriorityError} 当优先级值无效时抛出
   * @private
   */
  private validate(): void {
    if (!Object.values(EmailPriorityType).includes(this.value)) {
      throw new InvalidEmailPriorityError(
        `Invalid email priority: ${this.value}`,
      );
    }
  }

  /**
   * @method isHigherThan
   * @description 检查当前优先级是否高于指定优先级
   * @param {EmailPriorityType} other 其他优先级
   * @returns {boolean} 是否高于指定优先级
   */
  isHigherThan(other: EmailPriorityType): boolean {
    const priorityOrder = {
      [EmailPriorityType.LOW]: 1,
      [EmailPriorityType.NORMAL]: 2,
      [EmailPriorityType.HIGH]: 3,
      [EmailPriorityType.URGENT]: 4,
    };

    return priorityOrder[this.value] > priorityOrder[other];
  }

  /**
   * @method isLowerThan
   * @description 检查当前优先级是否低于指定优先级
   * @param {EmailPriorityType} other 其他优先级
   * @returns {boolean} 是否低于指定优先级
   */
  isLowerThan(other: EmailPriorityType): boolean {
    const priorityOrder = {
      [EmailPriorityType.LOW]: 1,
      [EmailPriorityType.NORMAL]: 2,
      [EmailPriorityType.HIGH]: 3,
      [EmailPriorityType.URGENT]: 4,
    };

    return priorityOrder[this.value] < priorityOrder[other];
  }

  /**
   * @method isEqual
   * @description 检查当前优先级是否等于指定优先级
   * @param {EmailPriorityType} other 其他优先级
   * @returns {boolean} 是否等于指定优先级
   */
  isEqual(other: EmailPriorityType): boolean {
    return this.value === other;
  }

  /**
   * @method getRetryDelay
   * @description 根据优先级获取重试延迟时间（毫秒）
   * @returns {number} 重试延迟时间
   */
  getRetryDelay(): number {
    const retryDelays = {
      [EmailPriorityType.LOW]: 300000, // 5分钟
      [EmailPriorityType.NORMAL]: 180000, // 3分钟
      [EmailPriorityType.HIGH]: 60000, // 1分钟
      [EmailPriorityType.URGENT]: 30000, // 30秒
    };

    return retryDelays[this.value];
  }

  /**
   * @method getMaxRetries
   * @description 根据优先级获取最大重试次数
   * @returns {number} 最大重试次数
   */
  getMaxRetries(): number {
    const maxRetries = {
      [EmailPriorityType.LOW]: 2,
      [EmailPriorityType.NORMAL]: 3,
      [EmailPriorityType.HIGH]: 5,
      [EmailPriorityType.URGENT]: 8,
    };

    return maxRetries[this.value];
  }

  /**
   * @method isUrgent
   * @description 检查是否为紧急优先级
   * @returns {boolean} 是否为紧急优先级
   */
  isUrgent(): boolean {
    return this.value === EmailPriorityType.URGENT;
  }

  /**
   * @method isHigh
   * @description 检查是否为高优先级
   * @returns {boolean} 是否为高优先级
   */
  isHigh(): boolean {
    return this.value === EmailPriorityType.HIGH;
  }

  /**
   * @method isNormal
   * @description 检查是否为普通优先级
   * @returns {boolean} 是否为普通优先级
   */
  isNormal(): boolean {
    return this.value === EmailPriorityType.NORMAL;
  }

  /**
   * @method isLow
   * @description 检查是否为低优先级
   * @returns {boolean} 是否为低优先级
   */
  isLow(): boolean {
    return this.value === EmailPriorityType.LOW;
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
 * @class InvalidEmailPriorityError
 * @description 无效邮件优先级错误
 */
export class InvalidEmailPriorityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailPriorityError';
  }
}

// 导出优先级常量
export const EmailPriorityConstants = {
  LOW: EmailPriorityType.LOW,
  NORMAL: EmailPriorityType.NORMAL,
  HIGH: EmailPriorityType.HIGH,
  URGENT: EmailPriorityType.URGENT,
} as const;
