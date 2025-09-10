import { DomainEvent } from '@aiofix/core';
import { PermissionId } from '@aiofix/shared';
import {
  Resource,
  Action,
  PermissionCondition,
  PermissionScope,
  PermissionSettings,
} from '../value-objects';
import { PermissionType } from '../enums';
import { TenantId } from '@aiofix/shared';

/**
 * @class PermissionCreatedEvent
 * @description
 * 权限创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限聚合根已成功创建
 * 2. 包含权限创建时的关键信息
 * 3. 为其他聚合根提供权限创建通知
 *
 * 触发条件：
 * 1. 权限聚合根成功创建后自动触发
 * 2. 权限资源、操作和条件验证通过
 * 3. 权限作用域验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块创建权限记录
 * 2. 触发权限缓存更新
 * 3. 更新权限统计信息
 * 4. 记录权限创建审计日志
 *
 * @property {PermissionId} permissionId 创建的权限ID
 * @property {Resource} resource 权限资源
 * @property {Action} action 权限操作
 * @property {PermissionCondition[]} conditions 权限条件列表
 * @property {PermissionScope} scope 权限作用域
 * @property {PermissionType} type 权限类型
 * @property {PermissionSettings} settings 权限设置
 * @property {TenantId} tenantId 所属租户ID
 * @property {string} createdBy 创建者ID
 *
 * @example
 * ```typescript
 * const event = new PermissionCreatedEvent(
 *   permissionId,
 *   resource,
 *   action,
 *   conditions,
 *   scope,
 *   PermissionType.TENANT,
 *   settings,
 *   tenantId,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionCreatedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: PermissionId,
    public readonly resource: Resource,
    public readonly action: Action,
    public readonly conditions: PermissionCondition[],
    public readonly scope: PermissionScope,
    public readonly type: PermissionType,
    public readonly settings: PermissionSettings,
    public readonly tenantId: TenantId,
    public readonly createdBy: string,
  ) {
    super(permissionId.toString(), 1);
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
      occurredOn: this.occurredOn,
      permissionId: this.permissionId.toString(),
      resource: this.resource.toJSON(),
      action: this.action.toJSON(),
      conditions: this.conditions.map(condition => condition.toJSON()),
      scope: this.scope.toJSON(),
      type: this.type,
      settings: this.settings.toJSON(),
      tenantId: this.tenantId.toString(),
      createdBy: this.createdBy,
    };
  }
}
