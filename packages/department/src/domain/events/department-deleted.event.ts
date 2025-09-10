import { DomainEvent } from '@aiofix/core';
import { DepartmentId } from '@aiofix/shared';
import { DepartmentStatus } from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/shared';

/**
 * @class DepartmentDeletedEvent
 * @description
 * 部门删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示部门已成功删除（软删除）
 * 2. 包含部门删除的关键信息
 * 3. 为其他聚合根提供部门删除通知
 *
 * 触发条件：
 * 1. 部门成功删除后自动触发
 * 2. 部门状态允许删除操作
 * 3. 删除操作权限验证通过
 * 4. 关联数据清理完成
 *
 * 影响范围：
 * 1. 通知权限管理模块清理部门权限
 * 2. 清理部门相关缓存
 * 3. 记录部门删除审计日志
 * 4. 通知相关用户部门已删除
 * 5. 触发数据归档流程
 * 6. 更新部门统计信息
 * 7. 处理子部门关系
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {DepartmentId} departmentId 删除的部门ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID
 * @property {DepartmentStatus} status 删除后的状态
 * @property {Date} deletedAt 部门删除时间
 * @property {string} reason 删除原因
 * @property {string} deletedBy 删除操作者
 *
 * @example
 * ```typescript
 * const event = new DepartmentDeletedEvent(
 *   'dept-123',
 *   'tenant-456',
 *   'org-789',
 *   '管理员删除',
 *   'user-001'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class DepartmentDeletedEvent extends DomainEvent {
  constructor(
    public readonly departmentId: DepartmentId,
    public readonly tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    public readonly reason: string = '',
    public readonly deletedBy: string = '',
    public readonly status: DepartmentStatus = DepartmentStatus.DELETED,
    public readonly deletedAt: Date = new Date(),
  ) {
    super(departmentId.value);
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的事件数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      departmentId: this.departmentId.value,
      tenantId: this.tenantId.value,
      organizationId: this.organizationId.value,
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
   * @returns {DepartmentDeletedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): DepartmentDeletedEvent {
    return new DepartmentDeletedEvent(
      new DepartmentId(data.departmentId as string),
      new TenantId(data.tenantId as string),
      new OrganizationId(data.organizationId as string),
      data.reason as string,
      data.deletedBy as string,
      data.status as DepartmentStatus,
      new Date(data.deletedAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `部门删除: ${this.departmentId.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const reasonText = this.reason ? `，原因：${this.reason}` : '';
    const deletedByText = this.deletedBy ? `，删除者：${this.deletedBy}` : '';
    return `部门已删除${reasonText}${deletedByText}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '部门缓存服务',
      '审计日志服务',
      '用户通知服务',
      '数据归档服务',
      '部门统计服务',
      '组织架构服务',
    ];
  }

  /**
   * @method isSoftDelete
   * @description 判断是否为软删除
   * @returns {boolean} 是否为软删除
   */
  isSoftDelete(): boolean {
    return this.status === DepartmentStatus.DELETED;
  }

  /**
   * @method getCleanupTasks
   * @description 获取清理任务列表
   * @returns {string[]} 清理任务列表
   */
  getCleanupTasks(): string[] {
    return [
      '清理部门权限',
      '清理部门缓存',
      '清理部门文件',
      '清理部门数据',
      '更新统计信息',
      '发送删除通知',
      '处理子部门关系',
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

  /**
   * @method getChildDepartmentHandling
   * @description 获取子部门处理策略
   * @returns {string} 处理策略
   */
  getChildDepartmentHandling(): string {
    // 这里可以根据业务规则返回不同的处理策略
    return 'MOVE_TO_PARENT'; // 移动到父部门
  }
}
