import { ValueObject } from '@aiofix/core';

/**
 * 租户配额数据接口
 */
export interface TenantQuotaData {
  /** 用户数量限制 */
  maxUsers: number;
  /** 存储空间限制（字节） */
  maxStorage: number;
  /** API调用次数限制（每月） */
  maxApiCalls: number;
  /** 带宽限制（字节/月） */
  maxBandwidth: number;
  /** 数据库连接数限制 */
  maxConnections: number;
  /** 自定义配额配置 */
  customQuotas?: Record<string, number>;
}

/**
 * 配额类型枚举
 */
export enum QuotaType {
  /** 用户数量 */
  USERS = 'USERS',
  /** 存储空间 */
  STORAGE = 'STORAGE',
  /** API调用 */
  API_CALLS = 'API_CALLS',
  /** 带宽 */
  BANDWIDTH = 'BANDWIDTH',
  /** 数据库连接 */
  CONNECTIONS = 'CONNECTIONS',
}

/**
 * @class TenantQuota
 * @description
 * 租户配额值对象，封装租户资源配额的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 配额值必须为非负数
 * 2. 配额类型必须是预定义的有效值
 * 3. 配额配置一旦创建不可变更
 * 4. 配额限制必须符合业务规则
 *
 * 相等性判断：
 * 1. 基于配额配置的标准化值进行相等性比较
 * 2. 忽略自定义配额的顺序差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装配额验证和计算逻辑
 * 2. 提供配额使用情况检查
 * 3. 隐藏配额管理细节
 *
 * @property {number} maxUsers 最大用户数
 * @property {number} maxStorage 最大存储空间
 * @property {number} maxApiCalls 最大API调用数
 * @property {number} maxBandwidth 最大带宽
 * @property {number} maxConnections 最大连接数
 * @property {Record<string, number>} customQuotas 自定义配额
 *
 * @example
 * ```typescript
 * const quota = new TenantQuota({
 *   maxUsers: 100,
 *   maxStorage: 1024 * 1024 * 1024, // 1GB
 *   maxApiCalls: 10000,
 *   maxBandwidth: 10 * 1024 * 1024 * 1024, // 10GB
 *   maxConnections: 50
 * });
 * ```
 * @since 1.0.0
 */
export class TenantQuota extends ValueObject<TenantQuotaData> {
  constructor(data: TenantQuotaData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证租户配额数据的有效性
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validate(): void {
    if (this.value.maxUsers < 0) {
      throw new Error('最大用户数不能为负数');
    }

    if (this.value.maxStorage < 0) {
      throw new Error('最大存储空间不能为负数');
    }

    if (this.value.maxApiCalls < 0) {
      throw new Error('最大API调用数不能为负数');
    }

    if (this.value.maxBandwidth < 0) {
      throw new Error('最大带宽不能为负数');
    }

    if (this.value.maxConnections < 0) {
      throw new Error('最大连接数不能为负数');
    }

    // 验证自定义配额
    if (this.value.customQuotas) {
      for (const [key, value] of Object.entries(this.value.customQuotas)) {
        if (value < 0) {
          throw new Error(`自定义配额 ${key} 不能为负数`);
        }
      }
    }
  }

  /**
   * @method getMaxUsers
   * @description 获取最大用户数
   * @returns {number} 最大用户数
   */
  get maxUsers(): number {
    return this.value.maxUsers;
  }

  /**
   * @method getMaxStorage
   * @description 获取最大存储空间
   * @returns {number} 最大存储空间（字节）
   */
  get maxStorage(): number {
    return this.value.maxStorage;
  }

  /**
   * @method getMaxApiCalls
   * @description 获取最大API调用数
   * @returns {number} 最大API调用数
   */
  get maxApiCalls(): number {
    return this.value.maxApiCalls;
  }

  /**
   * @method getMaxBandwidth
   * @description 获取最大带宽
   * @returns {number} 最大带宽（字节/月）
   */
  get maxBandwidth(): number {
    return this.value.maxBandwidth;
  }

  /**
   * @method getMaxConnections
   * @description 获取最大连接数
   * @returns {number} 最大连接数
   */
  get maxConnections(): number {
    return this.value.maxConnections;
  }

  /**
   * @method getCustomQuotas
   * @description 获取自定义配额
   * @returns {Record<string, number>} 自定义配额
   */
  get customQuotas(): Record<string, number> {
    return this.value.customQuotas ? { ...this.value.customQuotas } : {};
  }

  /**
   * @method getQuota
   * @description 获取指定类型的配额
   * @param {QuotaType} type 配额类型
   * @returns {number} 配额值
   */
  getQuota(type: QuotaType): number {
    switch (type) {
      case QuotaType.USERS:
        return this.value.maxUsers;
      case QuotaType.STORAGE:
        return this.value.maxStorage;
      case QuotaType.API_CALLS:
        return this.value.maxApiCalls;
      case QuotaType.BANDWIDTH:
        return this.value.maxBandwidth;
      case QuotaType.CONNECTIONS:
        return this.value.maxConnections;
      default:
        throw new Error(`未知的配额类型: ${type}`);
    }
  }

  /**
   * @method getCustomQuota
   * @description 获取自定义配额
   * @param {string} key 配额键
   * @returns {number} 配额值，如果不存在返回0
   */
  getCustomQuota(key: string): number {
    return this.value.customQuotas?.[key] || 0;
  }

  /**
   * @method isUnlimited
   * @description 检查指定配额是否无限制
   * @param {QuotaType} type 配额类型
   * @returns {boolean} 是否无限制
   */
  isUnlimited(type: QuotaType): boolean {
    return this.getQuota(type) === Number.MAX_SAFE_INTEGER;
  }

  /**
   * @method hasQuota
   * @description 检查是否有指定配额
   * @param {QuotaType} type 配额类型
   * @returns {boolean} 是否有配额
   */
  hasQuota(type: QuotaType): boolean {
    return this.getQuota(type) > 0;
  }

  /**
   * @method checkQuotaExceeded
   * @description 检查配额是否超出限制
   * @param {QuotaType} type 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {boolean} 是否超出限制
   */
  checkQuotaExceeded(type: QuotaType, currentUsage: number): boolean {
    const quota = this.getQuota(type);
    return quota > 0 && currentUsage > quota;
  }

  /**
   * @method getQuotaUsagePercentage
   * @description 获取配额使用百分比
   * @param {QuotaType} type 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {number} 使用百分比（0-100）
   */
  getQuotaUsagePercentage(type: QuotaType, currentUsage: number): number {
    const quota = this.getQuota(type);
    if (quota === 0) return 0;
    if (quota === Number.MAX_SAFE_INTEGER) return 0;
    return Math.min(100, (currentUsage / quota) * 100);
  }

  /**
   * @method updateQuota
   * @description 更新配额
   * @param {QuotaType} type 配额类型
   * @param {number} value 新配额值
   * @returns {TenantQuota} 新的配额实例
   */
  updateQuota(type: QuotaType, value: number): TenantQuota {
    const newData = { ...this.value };

    switch (type) {
      case QuotaType.USERS:
        newData.maxUsers = value;
        break;
      case QuotaType.STORAGE:
        newData.maxStorage = value;
        break;
      case QuotaType.API_CALLS:
        newData.maxApiCalls = value;
        break;
      case QuotaType.BANDWIDTH:
        newData.maxBandwidth = value;
        break;
      case QuotaType.CONNECTIONS:
        newData.maxConnections = value;
        break;
      default:
        throw new Error(`无法更新配额类型: ${type}`);
    }

    return new TenantQuota(newData);
  }

  /**
   * @method updateCustomQuota
   * @description 更新自定义配额
   * @param {string} key 配额键
   * @param {number} value 配额值
   * @returns {TenantQuota} 新的配额实例
   */
  updateCustomQuota(key: string, value: number): TenantQuota {
    const newData = {
      ...this.value,
      customQuotas: {
        ...this.value.customQuotas,
        [key]: value,
      },
    };

    return new TenantQuota(newData);
  }
}
