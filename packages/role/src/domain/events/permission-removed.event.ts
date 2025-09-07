import { DomainEvent } from '@aiofix/core';
import { RoleId } from '../value-objects/role-id.vo';
import { Permission } from '../value-objects/permission.vo';
import { TenantId } from '@aiofix/shared';

/**
 * @class PermissionRemovedEvent
 * @description
 * 权限移除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限已成功从角色中移除
 * 2. 包含权限移除时的关键信息
 * 3. 为其他聚合根提供权限移除通知
 *
 * 触发条件：
 * 1. 权限成功从角色中移除后自动触发
 * 2. 权限存在于角色中
 * 3. 角色状态允许修改权限
 * 4. 权限移除操作有效
 *
 * 影响范围：
 * 1. 通知权限管理模块更新权限缓存
 * 2. 触发用户权限重新计算
 * 3. 更新权限统计信息
 * 4. 记录权限移除审计日志
 *
 * @property {RoleId} roleId 角色ID
 * @property {Permission} permission 移除的权限
 * @property {TenantId} tenantId 所属租户ID
 * @property {Date} removedAt 权限移除时间
 *
 * @example
 * ```typescript
 * const event = new PermissionRemovedEvent(
 *   roleId,
 *   new Permission('user', 'read'),
 *   tenantId
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionRemovedEvent extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly permission: Permission,
    public readonly tenantId: TenantId,
    public readonly removedAt: Date = new Date(),
  ) {
    super(roleId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'PermissionRemoved';
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
      roleId: this.roleId.value,
      permission: this.permission.toJSON(),
      tenantId: this.tenantId.value,
      removedAt: this.removedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {PermissionRemovedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): PermissionRemovedEvent {
    return new PermissionRemovedEvent(
      new RoleId(data.roleId as string),
      new Permission(data.permission as any),
      new TenantId(data.tenantId as string),
      new Date(data.removedAt as string),
    );
  }

  /**
   * @method getResource
   * @description 获取权限资源
   * @returns {string} 权限资源
   */
  getResource(): string {
    return this.permission.getResource();
  }

  /**
   * @method getAction
   * @description 获取权限操作
   * @returns {string} 权限操作
   */
  getAction(): string {
    return this.permission.getAction();
  }

  /**
   * @method getConditions
   * @description 获取权限条件
   * @returns {Record<string, any>} 权限条件
   */
  getConditions(): Record<string, any> {
    return this.permission.getConditions();
  }

  /**
   * @method matches
   * @description 检查权限是否匹配指定的资源和操作
   * @param {string} resource 资源名称
   * @param {string} action 操作名称
   * @returns {boolean} 是否匹配
   */
  matches(resource: string, action: string): boolean {
    return this.permission.matches(resource, action);
  }

  /**
   * @method hasCondition
   * @description 检查权限是否包含指定条件
   * @param {string} key 条件键
   * @param {any} value 条件值
   * @returns {boolean} 是否包含条件
   */
  hasCondition(key: string, value: any): boolean {
    return this.permission.hasCondition(key, value);
  }

  /**
   * @method getPermissionString
   * @description 获取权限字符串表示
   * @returns {string} 权限字符串
   */
  getPermissionString(): string {
    return this.permission.toString();
  }
}
