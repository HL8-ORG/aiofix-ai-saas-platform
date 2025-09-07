import { IDomainEvent } from '@aiofix/core';
import { TenantId } from '../value-objects/tenant-id.vo';

/**
 * @class TenantQuotaExceededEvent
 * @description
 * 租户配额超出领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户的某个配额已超出限制
 * 2. 包含配额超出的详细信息
 * 3. 为其他聚合根提供配额超出通知
 *
 * 触发条件：
 * 1. 租户使用量超过配额限制时自动触发
 * 2. 配额检查验证通过
 * 3. 超出阈值达到告警条件
 *
 * 影响范围：
 * 1. 通知管理员配额超出情况
 * 2. 触发配额告警流程
 * 3. 更新租户使用统计
 * 4. 记录配额超出审计日志
 *
 * @property {TenantId} tenantId 租户ID
 * @property {string} quotaType 配额类型
 * @property {number} quotaLimit 配额限制
 * @property {number} currentUsage 当前使用量
 * @property {number} usagePercentage 使用百分比
 * @property {string} severity 严重程度（warning、critical）
 * @property {string} eventId 事件唯一标识符
 * @property {Date} occurredOn 事件发生时间
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {number} eventVersion 事件版本号
 *
 * @example
 * ```typescript
 * const event = new TenantQuotaExceededEvent(
 *   new TenantId('tenant-123'),
 *   'users',
 *   100,
 *   105,
 *   105,
 *   'critical'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantQuotaExceededEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'TenantQuotaExceeded';
  public readonly aggregateId: string;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly tenantId: TenantId,
    public readonly quotaType: string,
    public readonly quotaLimit: number,
    public readonly currentUsage: number,
    public readonly usagePercentage: number,
    public readonly severity: 'warning' | 'critical' = 'warning',
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = this.tenantId.value;
    this.validate();
  }

  /**
   * @method validate
   * @description 验证事件数据的有效性
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.quotaType || this.quotaType.trim().length === 0) {
      throw new Error('配额类型不能为空');
    }

    if (this.quotaLimit < 0) {
      throw new Error('配额限制不能为负数');
    }

    if (this.currentUsage < 0) {
      throw new Error('当前使用量不能为负数');
    }

    if (this.usagePercentage < 0 || this.usagePercentage > 1000) {
      throw new Error('使用百分比必须在0-1000之间');
    }

    if (!['warning', 'critical'].includes(this.severity)) {
      throw new Error('严重程度必须是warning或critical');
    }

    if (this.currentUsage <= this.quotaLimit) {
      throw new Error('当前使用量必须大于配额限制');
    }
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns {Record<string, unknown>} 事件数据
   */
  public getEventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantId.value,
      quotaType: this.quotaType,
      quotaLimit: this.quotaLimit,
      currentUsage: this.currentUsage,
      usagePercentage: this.usagePercentage,
      severity: this.severity,
      exceededAmount: this.getExceededAmount(),
      exceededPercentage: this.getExceededPercentage(),
    };
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      ...this.getEventData(),
    };
  }

  /**
   * @method getExceededAmount
   * @description 获取超出数量
   * @returns {number} 超出数量
   */
  public getExceededAmount(): number {
    return this.currentUsage - this.quotaLimit;
  }

  /**
   * @method getExceededPercentage
   * @description 获取超出百分比
   * @returns {number} 超出百分比
   */
  public getExceededPercentage(): number {
    if (this.quotaLimit === 0) {
      return 0;
    }
    return ((this.currentUsage - this.quotaLimit) / this.quotaLimit) * 100;
  }

  /**
   * @method isCritical
   * @description 检查是否为严重告警
   * @returns {boolean} 是否为严重告警
   */
  public isCritical(): boolean {
    return this.severity === 'critical';
  }

  /**
   * @method isWarning
   * @description 检查是否为警告告警
   * @returns {boolean} 是否为警告告警
   */
  public isWarning(): boolean {
    return this.severity === 'warning';
  }

  /**
   * @method isUsersQuota
   * @description 检查是否为用户配额
   * @returns {boolean} 是否为用户配额
   */
  public isUsersQuota(): boolean {
    return this.quotaType === 'users';
  }

  /**
   * @method isStorageQuota
   * @description 检查是否为存储配额
   * @returns {boolean} 是否为存储配额
   */
  public isStorageQuota(): boolean {
    return this.quotaType === 'storage';
  }

  /**
   * @method isApiCallsQuota
   * @description 检查是否为API调用配额
   * @returns {boolean} 是否为API调用配额
   */
  public isApiCallsQuota(): boolean {
    return this.quotaType === 'apiCalls';
  }

  /**
   * @method isBandwidthQuota
   * @description 检查是否为带宽配额
   * @returns {boolean} 是否为带宽配额
   */
  public isBandwidthQuota(): boolean {
    return this.quotaType === 'bandwidth';
  }

  /**
   * @method isConnectionsQuota
   * @description 检查是否为连接数配额
   * @returns {boolean} 是否为连接数配额
   */
  public isConnectionsQuota(): boolean {
    return this.quotaType === 'connections';
  }

  /**
   * @method getFormattedQuotaLimit
   * @description 获取格式化的配额限制
   * @returns {string} 格式化的配额限制
   */
  public getFormattedQuotaLimit(): string {
    switch (this.quotaType) {
      case 'storage':
        return this.formatBytes(this.quotaLimit);
      case 'bandwidth':
        return this.formatBytes(this.quotaLimit);
      case 'users':
        return `${this.quotaLimit} 用户`;
      case 'apiCalls':
        return `${this.quotaLimit} 次调用`;
      case 'connections':
        return `${this.quotaLimit} 个连接`;
      default:
        return `${this.quotaLimit}`;
    }
  }

  /**
   * @method getFormattedCurrentUsage
   * @description 获取格式化的当前使用量
   * @returns {string} 格式化的当前使用量
   */
  public getFormattedCurrentUsage(): string {
    switch (this.quotaType) {
      case 'storage':
        return this.formatBytes(this.currentUsage);
      case 'bandwidth':
        return this.formatBytes(this.currentUsage);
      case 'users':
        return `${this.currentUsage} 用户`;
      case 'apiCalls':
        return `${this.currentUsage} 次调用`;
      case 'connections':
        return `${this.currentUsage} 个连接`;
      default:
        return `${this.currentUsage}`;
    }
  }

  /**
   * @method formatBytes
   * @description 格式化字节数
   * @param {number} bytes 字节数
   * @returns {string} 格式化的字节数
   * @private
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * @method getMessage
   * @description 获取事件消息
   * @returns {string} 事件消息
   */
  public getMessage(): string {
    const quotaTypeName = this.getQuotaTypeName();
    const limit = this.getFormattedQuotaLimit();
    const usage = this.getFormattedCurrentUsage();
    const exceeded = this.getExceededAmount();

    return `租户 ${this.tenantId.value} 的${quotaTypeName}配额已超出限制。限制：${limit}，当前使用：${usage}，超出：${exceeded}`;
  }

  /**
   * @method getQuotaTypeName
   * @description 获取配额类型名称
   * @returns {string} 配额类型名称
   * @private
   */
  private getQuotaTypeName(): string {
    switch (this.quotaType) {
      case 'users':
        return '用户数量';
      case 'storage':
        return '存储空间';
      case 'apiCalls':
        return 'API调用';
      case 'bandwidth':
        return '带宽';
      case 'connections':
        return '连接数';
      default:
        return this.quotaType;
    }
  }
}
