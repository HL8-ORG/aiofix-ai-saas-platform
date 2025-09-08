import { DomainEvent } from '@aiofix/core';
import { PermissionId } from '../value-objects/permission-id.vo';
import {
  Resource,
  Action,
  PermissionCondition,
  PermissionScope,
  PermissionSettings,
} from '../value-objects';

/**
 * @class PermissionUpdatedEvent
 * @description
 * 权限更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限聚合根已成功更新
 * 2. 包含权限更新时的关键信息
 * 3. 为其他聚合根提供权限更新通知
 *
 * 触发条件：
 * 1. 权限聚合根成功更新后自动触发
 * 2. 权限资源、操作和条件验证通过
 * 3. 权限作用域验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新权限记录
 * 2. 触发权限缓存更新
 * 3. 更新权限统计信息
 * 4. 记录权限更新审计日志
 *
 * @property {PermissionId} permissionId 更新的权限ID
 * @property {Resource} oldResource 旧的权限资源
 * @property {Action} oldAction 旧的权限操作
 * @property {PermissionCondition[]} oldConditions 旧的权限条件列表
 * @property {PermissionScope} oldScope 旧的权限作用域
 * @property {PermissionSettings} oldSettings 旧的权限设置
 * @property {Resource} newResource 新的权限资源
 * @property {Action} newAction 新的权限操作
 * @property {PermissionCondition[]} newConditions 新的权限条件列表
 * @property {PermissionScope} newScope 新的权限作用域
 * @property {PermissionSettings} newSettings 新的权限设置
 * @property {string} updatedBy 更新者ID
 *
 * @example
 * ```typescript
 * const event = new PermissionUpdatedEvent(
 *   permissionId,
 *   oldResource,
 *   oldAction,
 *   oldConditions,
 *   oldScope,
 *   oldSettings,
 *   newResource,
 *   newAction,
 *   newConditions,
 *   newScope,
 *   newSettings,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionUpdatedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: PermissionId,
    public readonly oldResource: Resource,
    public readonly oldAction: Action,
    public readonly oldConditions: PermissionCondition[],
    public readonly oldScope: PermissionScope,
    public readonly oldSettings: PermissionSettings,
    public readonly newResource: Resource,
    public readonly newAction: Action,
    public readonly newConditions: PermissionCondition[],
    public readonly newScope: PermissionScope,
    public readonly newSettings: PermissionSettings,
    public readonly updatedBy: string,
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
      oldResource: this.oldResource.toJSON(),
      oldAction: this.oldAction.toJSON(),
      oldConditions: this.oldConditions.map(condition => condition.toJSON()),
      oldScope: this.oldScope.toJSON(),
      oldSettings: this.oldSettings.toJSON(),
      newResource: this.newResource.toJSON(),
      newAction: this.newAction.toJSON(),
      newConditions: this.newConditions.map(condition => condition.toJSON()),
      newScope: this.newScope.toJSON(),
      newSettings: this.newSettings.toJSON(),
      updatedBy: this.updatedBy,
    };
  }
}
