import { ValueObject } from '@aiofix/core';

/**
 * @class PushPriority
 * @description
 * 推送优先级值对象，封装推送通知的优先级信息。
 *
 * 推送优先级特性：
 * 1. 控制推送通知的发送优先级和顺序
 * 2. 影响推送通知的送达速度和可靠性
 * 3. 支持不同平台的优先级映射
 * 4. 提供优先级相关的业务规则
 *
 * 优先级级别：
 * 1. CRITICAL：关键通知，立即发送，最高优先级
 * 2. HIGH：高优先级通知，优先发送
 * 3. NORMAL：普通通知，正常发送
 * 4. LOW：低优先级通知，延迟发送
 * 5. BACKGROUND：后台通知，最低优先级
 *
 * 业务规则：
 * 1. 高优先级通知可以抢占低优先级通知的发送资源
 * 2. 不同优先级有不同的重试策略
 * 3. 优先级影响推送通知的过期时间
 * 4. 支持优先级的动态调整和升级
 *
 * @property {PushPriorityLevel} value 推送优先级值
 * @property {number} weight 优先级权重，用于排序
 *
 * @example
 * ```typescript
 * const criticalPriority = new PushPriority(PushPriorityLevel.CRITICAL);
 * const normalPriority = new PushPriority(PushPriorityLevel.NORMAL);
 * ```
 * @since 1.0.0
 */
export class PushPriority extends ValueObject<{
  value: PushPriorityLevel;
  weight: number;
}> {
  /**
   * @constructor
   * @description 创建推送优先级值对象
   * @param {PushPriorityLevel} value 推送优先级值
   * @throws {InvalidPushPriorityError} 当优先级值无效时抛出
   */
  constructor(value: PushPriorityLevel) {
    const weight = PushPriority.getPriorityWeightStatic(value);
    super({ value, weight });
  }

  /**
   * @method getValue
   * @description 获取推送优先级值
   * @returns {PushPriorityLevel} 推送优先级值
   */
  getValue(): PushPriorityLevel {
    return this.value.value;
  }

  /**
   * @method getWeight
   * @description 获取优先级权重
   * @returns {number} 优先级权重
   */
  getWeight(): number {
    return this.value.weight;
  }

  /**
   * @method isCritical
   * @description 判断是否为关键优先级
   * @returns {boolean} 是否为关键优先级
   */
  isCritical(): boolean {
    return this.value.value === PushPriorityLevel.CRITICAL;
  }

  /**
   * @method isHigh
   * @description 判断是否为高优先级
   * @returns {boolean} 是否为高优先级
   */
  isHigh(): boolean {
    return this.value.value === PushPriorityLevel.HIGH;
  }

  /**
   * @method isNormal
   * @description 判断是否为普通优先级
   * @returns {boolean} 是否为普通优先级
   */
  isNormal(): boolean {
    return this.value.value === PushPriorityLevel.NORMAL;
  }

  /**
   * @method isLow
   * @description 判断是否为低优先级
   * @returns {boolean} 是否为低优先级
   */
  isLow(): boolean {
    return this.value.value === PushPriorityLevel.LOW;
  }

  /**
   * @method isBackground
   * @description 判断是否为后台优先级
   * @returns {boolean} 是否为后台优先级
   */
  isBackground(): boolean {
    return this.value.value === PushPriorityLevel.BACKGROUND;
  }

  /**
   * @method isHigherThan
   * @description 判断是否比指定优先级更高
   * @param {PushPriority} other 另一个推送优先级
   * @returns {boolean} 是否更高
   */
  isHigherThan(other: PushPriority): boolean {
    return this.value.weight > other.value.weight;
  }

  /**
   * @method isLowerThan
   * @description 判断是否比指定优先级更低
   * @param {PushPriority} other 另一个推送优先级
   * @returns {boolean} 是否更低
   */
  isLowerThan(other: PushPriority): boolean {
    return this.value.weight < other.value.weight;
  }

  /**
   * @method isEqualTo
   * @description 判断是否与指定优先级相等
   * @param {PushPriority} other 另一个推送优先级
   * @returns {boolean} 是否相等
   */
  isEqualTo(other: PushPriority): boolean {
    return this.value.weight === other.value.weight;
  }

  /**
   * @method getRetryCount
   * @description 获取重试次数
   * @returns {number} 重试次数
   */
  getRetryCount(): number {
    const retryCountMap: Record<PushPriorityLevel, number> = {
      [PushPriorityLevel.CRITICAL]: 5,
      [PushPriorityLevel.HIGH]: 3,
      [PushPriorityLevel.NORMAL]: 2,
      [PushPriorityLevel.LOW]: 1,
      [PushPriorityLevel.BACKGROUND]: 0,
    };

    return retryCountMap[this.value.value];
  }

  /**
   * @method getRetryInterval
   * @description 获取重试间隔（毫秒）
   * @returns {number} 重试间隔
   */
  getRetryInterval(): number {
    const retryIntervalMap: Record<PushPriorityLevel, number> = {
      [PushPriorityLevel.CRITICAL]: 1000, // 1秒
      [PushPriorityLevel.HIGH]: 5000, // 5秒
      [PushPriorityLevel.NORMAL]: 30000, // 30秒
      [PushPriorityLevel.LOW]: 60000, // 1分钟
      [PushPriorityLevel.BACKGROUND]: 300000, // 5分钟
    };

    return retryIntervalMap[this.value.value];
  }

  /**
   * @method getExpirationTime
   * @description 获取过期时间（毫秒）
   * @returns {number} 过期时间
   */
  getExpirationTime(): number {
    const expirationTimeMap: Record<PushPriorityLevel, number> = {
      [PushPriorityLevel.CRITICAL]: 300000, // 5分钟
      [PushPriorityLevel.HIGH]: 1800000, // 30分钟
      [PushPriorityLevel.NORMAL]: 3600000, // 1小时
      [PushPriorityLevel.LOW]: 7200000, // 2小时
      [PushPriorityLevel.BACKGROUND]: 86400000, // 24小时
    };

    return expirationTimeMap[this.value.value];
  }

  /**
   * @method getPlatformPriority
   * @description 获取平台特定的优先级值
   * @param {string} platform 推送平台
   * @returns {string} 平台特定的优先级值
   */
  getPlatformPriority(platform: string): string {
    const platformPriorityMap: Record<
      PushPriorityLevel,
      Record<string, string>
    > = {
      [PushPriorityLevel.CRITICAL]: {
        FCM: 'high',
        APNS: '10',
        HUAWEI: 'HIGH',
        XIAOMI: 'high',
      },
      [PushPriorityLevel.HIGH]: {
        FCM: 'high',
        APNS: '10',
        HUAWEI: 'HIGH',
        XIAOMI: 'high',
      },
      [PushPriorityLevel.NORMAL]: {
        FCM: 'normal',
        APNS: '5',
        HUAWEI: 'NORMAL',
        XIAOMI: 'normal',
      },
      [PushPriorityLevel.LOW]: {
        FCM: 'normal',
        APNS: '5',
        HUAWEI: 'NORMAL',
        XIAOMI: 'normal',
      },
      [PushPriorityLevel.BACKGROUND]: {
        FCM: 'normal',
        APNS: '1',
        HUAWEI: 'LOW',
        XIAOMI: 'low',
      },
    };

    return platformPriorityMap[this.value.value][platform] || 'normal';
  }

  /**
   * @method getPriorityWeightStatic
   * @description 获取优先级权重（静态方法）
   * @param {PushPriorityLevel} priority 优先级级别
   * @returns {number} 优先级权重
   * @static
   */
  static getPriorityWeightStatic(priority: PushPriorityLevel): number {
    const weightMap: Record<PushPriorityLevel, number> = {
      [PushPriorityLevel.CRITICAL]: 100,
      [PushPriorityLevel.HIGH]: 80,
      [PushPriorityLevel.NORMAL]: 60,
      [PushPriorityLevel.LOW]: 40,
      [PushPriorityLevel.BACKGROUND]: 20,
    };

    return weightMap[priority];
  }

  /**
   * @method getPriorityWeight
   * @description 获取优先级权重
   * @param {PushPriorityLevel} priority 优先级级别
   * @returns {number} 优先级权重
   * @private
   */
  private getPriorityWeight(priority: PushPriorityLevel): number {
    const weightMap: Record<PushPriorityLevel, number> = {
      [PushPriorityLevel.CRITICAL]: 100,
      [PushPriorityLevel.HIGH]: 80,
      [PushPriorityLevel.NORMAL]: 60,
      [PushPriorityLevel.LOW]: 40,
      [PushPriorityLevel.BACKGROUND]: 20,
    };

    return weightMap[priority];
  }

  /**
   * @method equals
   * @description 比较两个推送优先级是否相等
   * @param {PushPriority} other 另一个推送优先级
   * @returns {boolean} 是否相等
   */
  equals(other: PushPriority): boolean {
    return this.value.value === other.value.value;
  }

  /**
   * @method toString
   * @description 返回推送优先级的字符串表示
   * @returns {string} 推送优先级字符串
   */
  toString(): string {
    return this.value.value;
  }
}

/**
 * @enum PushPriorityLevel
 * @description 推送优先级级别枚举
 */
export enum PushPriorityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  BACKGROUND = 'BACKGROUND',
}

/**
 * @class InvalidPushPriorityError
 * @description 无效推送优先级错误
 */
export class InvalidPushPriorityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPushPriorityError';
  }
}
