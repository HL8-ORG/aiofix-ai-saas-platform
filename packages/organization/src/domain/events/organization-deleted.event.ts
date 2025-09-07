import { DomainEvent } from '@aiofix/core';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationDeletedEvent
 * @description
 * 组织删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示组织已成功删除（软删除）
 * 2. 包含组织删除的关键信息
 * 3. 为其他聚合根提供组织删除通知
 *
 * 触发条件：
 * 1. 组织成功删除后自动触发
 * 2. 组织状态允许删除操作
 * 3. 删除操作权限验证通过
 * 4. 关联数据清理完成
 *
 * 影响范围：
 * 1. 通知权限管理模块清理组织权限
 * 2. 清理组织相关缓存
 * 3. 记录组织删除审计日志
 * 4. 通知相关用户组织已删除
 * 5. 触发数据归档流程
 * 6. 更新组织统计信息
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {OrganizationId} organizationId 删除的组织ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationStatus} status 删除后的状态
 * @property {Date} deletedAt 组织删除时间
 * @property {string} reason 删除原因
 * @property {string} deletedBy 删除操作者
 *
 * @example
 * ```typescript
 * const event = new OrganizationDeletedEvent(
 *   'org-123',
 *   'tenant-456',
 *   '管理员删除',
 *   'user-789'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class OrganizationDeletedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly tenantId: TenantId,
    public readonly reason: string = '',
    public readonly deletedBy: string = '',
    public readonly status: OrganizationStatus = OrganizationStatus.DELETED,
    public readonly deletedAt: Date = new Date(),
  ) {
    super(organizationId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.aggregateId;
  }

  /**
   * @method getOccurredOn
   * @description 获取事件发生时间
   * @returns {Date} 事件发生时间
   */
  getOccurredOn(): Date {
    return this.occurredOn;
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本号
   * @returns {number} 事件版本号
   */
  getEventVersion(): number {
    return this.eventVersion;
  }

  /**
   * @method getEventId
   * @description 获取事件唯一标识
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `${this.eventType}-${this.aggregateId}-${this.occurredOn.getTime()}`;
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的事件数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      organizationId: this.organizationId.value,
      tenantId: this.tenantId.value,
      status: this.status,
      deletedAt: this.deletedAt.toISOString(),
      reason: this.reason,
      deletedBy: this.deletedBy,
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {OrganizationDeletedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): OrganizationDeletedEvent {
    return new OrganizationDeletedEvent(
      new OrganizationId(data.organizationId as string),
      new TenantId(data.tenantId as string),
      data.reason as string,
      data.deletedBy as string,
      data.status as OrganizationStatus,
      new Date(data.deletedAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `组织删除: ${this.organizationId.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const reasonText = this.reason ? `，原因：${this.reason}` : '';
    const deletedByText = this.deletedBy ? `，删除者：${this.deletedBy}` : '';
    return `组织已删除${reasonText}${deletedByText}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '组织缓存服务',
      '审计日志服务',
      '用户通知服务',
      '数据归档服务',
      '组织统计服务',
    ];
  }

  /**
   * @method isSoftDelete
   * @description 判断是否为软删除
   * @returns {boolean} 是否为软删除
   */
  isSoftDelete(): boolean {
    return this.status === OrganizationStatus.DELETED;
  }

  /**
   * @method getCleanupTasks
   * @description 获取清理任务列表
   * @returns {string[]} 清理任务列表
   */
  getCleanupTasks(): string[] {
    return [
      '清理组织权限',
      '清理组织缓存',
      '清理组织文件',
      '清理组织数据',
      '更新统计信息',
      '发送删除通知',
    ];
  }

  /**
   * @method getRetentionPeriod
   * @description 获取数据保留期限（天）
   * @returns {number} 保留期限
   */
  getRetentionPeriod(): number {
    // 默认保留30天
    return 30;
  }

  /**
   * @method getArchiveDate
   * @description 获取归档日期
   * @returns {Date} 归档日期
   */
  getArchiveDate(): Date {
    const archiveDate = new Date(this.deletedAt);
    archiveDate.setDate(archiveDate.getDate() + this.getRetentionPeriod());
    return archiveDate;
  }
}
