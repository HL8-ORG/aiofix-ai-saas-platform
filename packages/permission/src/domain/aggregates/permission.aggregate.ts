import { EventSourcedAggregateRoot } from '@aiofix/core';
import { PermissionEntity } from '../entities/permission.entity';
import { PermissionId } from '../value-objects/permission-id.vo';
import {
  Resource,
  Action,
  PermissionCondition,
  PermissionScope,
  PermissionSettings,
} from '../value-objects';
import { PermissionStatus, PermissionType } from '../enums';
import { TenantId } from '@aiofix/shared';

/**
 * @class PermissionAggregate
 * @description
 * 权限聚合根，负责管理权限相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供权限创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 权限资源、操作和条件必须有效
 * 2. 权限作用域必须符合层级关系
 * 3. 权限状态变更必须遵循预定义的状态机
 * 4. 权限删除前必须清理所有关联数据
 *
 * @property {PermissionEntity} permission 权限实体
 * @property {TenantId} tenantId 所属租户ID
 *
 * @example
 * ```typescript
 * const permissionAggregate = new PermissionAggregate();
 * await permissionAggregate.createPermission(
 *   new Resource('user'),
 *   new Action('read'),
 *   new PermissionScope({ level: 'tenant', tenantId: 'tenant-123' }),
 *   PermissionType.TENANT,
 *   'tenant-123',
 *   'admin-456'
 * );
 * // 自动发布 PermissionCreatedEvent
 * ```
 * @since 1.0.0
 */
export class PermissionAggregate extends EventSourcedAggregateRoot {
  private permission: PermissionEntity | null = null;

  /**
   * @method createPermission
   * @description 创建新权限，发布权限创建事件
   * @param {Resource} resource 权限资源
   * @param {Action} action 权限操作
   * @param {PermissionCondition[]} conditions 权限条件列表
   * @param {PermissionScope} scope 权限作用域
   * @param {PermissionType} type 权限类型
   * @param {PermissionSettings} settings 权限设置
   * @param {TenantId} tenantId 所属租户ID
   * @param {string} createdBy 创建者ID
   * @returns {Promise<void>}
   * @throws {InvalidResourceError} 当资源无效时抛出
   * @throws {InvalidActionError} 当操作无效时抛出
   * @throws {InvalidScopeError} 当作用域无效时抛出
   *
   * 业务逻辑：
   * 1. 验证权限资源、操作和条件的有效性
   * 2. 检查权限作用域的层级关系
   * 3. 创建权限实体
   * 4. 发布权限创建事件
   */
  async createPermission(
    resource: Resource,
    action: Action,
    conditions: PermissionCondition[],
    scope: PermissionScope,
    type: PermissionType,
    settings: PermissionSettings,
    tenantId: TenantId,
    createdBy: string,
  ): Promise<void> {
    // 验证权限资源、操作和条件的有效性
    this.validatePermissionData(resource, action, conditions, scope);

    // 创建权限实体
    this.permission = new PermissionEntity(
      new PermissionId(),
      resource,
      action,
      conditions,
      scope,
      type,
      settings,
      tenantId,
      PermissionStatus.ACTIVE,
      createdBy,
    );

    // 发布权限创建事件
    const event = new PermissionCreatedEvent(
      this.permission.id,
      resource,
      action,
      conditions,
      scope,
      type,
      settings,
      tenantId,
      createdBy,
    );
    this.addDomainEvent(event);
  }

  /**
   * @method updatePermission
   * @description 更新权限信息，发布权限更新事件
   * @param {Resource} newResource 新的权限资源
   * @param {Action} newAction 新的权限操作
   * @param {PermissionCondition[]} newConditions 新的权限条件列表
   * @param {PermissionScope} newScope 新的权限作用域
   * @param {PermissionSettings} newSettings 新的权限设置
   * @param {string} updatedBy 更新者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidResourceError} 当资源无效时抛出
   * @throws {InvalidActionError} 当操作无效时抛出
   * @throws {InvalidScopeError} 当作用域无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证新的权限数据
   * 3. 更新权限实体
   * 4. 发布权限更新事件
   */
  async updatePermission(
    newResource: Resource,
    newAction: Action,
    newConditions: PermissionCondition[],
    newScope: PermissionScope,
    newSettings: PermissionSettings,
    updatedBy: string,
  ): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    // 验证新的权限数据
    this.validatePermissionData(
      newResource,
      newAction,
      newConditions,
      newScope,
    );

    // 保存旧值用于事件
    const oldResource = this.permission.resource;
    const oldAction = this.permission.action;
    const oldConditions = this.permission.conditions;
    const oldScope = this.permission.scope;
    const oldSettings = this.permission.settings;

    // 更新权限实体
    this.permission.updatePermission(
      newResource,
      newAction,
      newConditions,
      newScope,
      newSettings,
      updatedBy,
    );

    // 发布权限更新事件
    const event = new PermissionUpdatedEvent(
      this.permission.id,
      oldResource,
      oldAction,
      oldConditions,
      oldScope,
      oldSettings,
      newResource,
      newAction,
      newConditions,
      newScope,
      newSettings,
      updatedBy,
    );
    this.addDomainEvent(event);
  }

  /**
   * @method activatePermission
   * @description 激活权限，发布权限激活事件
   * @param {string} activatedBy 激活者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证状态转换的有效性
   * 3. 更新权限状态
   * 4. 发布权限激活事件
   */
  async activatePermission(activatedBy: string): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    const oldStatus = this.permission.status;
    this.permission.activate();

    // 发布权限激活事件
    const event = new PermissionStatusChangedEvent(
      this.permission.id,
      oldStatus,
      PermissionStatus.ACTIVE,
      activatedBy,
    );
    this.addDomainEvent(event);
  }

  /**
   * @method deactivatePermission
   * @description 停用权限，发布权限停用事件
   * @param {string} deactivatedBy 停用者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证状态转换的有效性
   * 3. 更新权限状态
   * 4. 发布权限停用事件
   */
  async deactivatePermission(deactivatedBy: string): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    const oldStatus = this.permission.status;
    this.permission.deactivate();

    // 发布权限停用事件
    const event = new PermissionStatusChangedEvent(
      this.permission.id,
      oldStatus,
      PermissionStatus.INACTIVE,
      deactivatedBy,
    );
    this.addDomainEvent(event);
  }

  /**
   * @method suspendPermission
   * @description 暂停权限，发布权限暂停事件
   * @param {string} suspendedBy 暂停者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证状态转换的有效性
   * 3. 更新权限状态
   * 4. 发布权限暂停事件
   */
  async suspendPermission(suspendedBy: string): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    const oldStatus = this.permission.status;
    this.permission.suspend();

    // 发布权限暂停事件
    const event = new PermissionStatusChangedEvent(
      this.permission.id,
      oldStatus,
      PermissionStatus.SUSPENDED,
      suspendedBy,
    );
    this.addDomainEvent(event);
  }

  /**
   * @method deletePermission
   * @description 删除权限，发布权限删除事件
   * @param {string} deletedBy 删除者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证删除操作的有效性
   * 3. 软删除权限
   * 4. 发布权限删除事件
   */
  async deletePermission(deletedBy: string): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    this.permission.softDelete(deletedBy);

    // 发布权限删除事件
    const event = new PermissionDeletedEvent(this.permission.id, deletedBy);
    this.addDomainEvent(event);
  }

  /**
   * @method restorePermission
   * @description 恢复权限，发布权限恢复事件
   * @param {string} restoredBy 恢复者ID
   * @returns {Promise<void>}
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   *
   * 业务逻辑：
   * 1. 检查权限是否存在
   * 2. 验证恢复操作的有效性
   * 3. 恢复权限
   * 4. 发布权限恢复事件
   */
  async restorePermission(restoredBy: string): Promise<void> {
    if (!this.permission) {
      throw new Error('权限不存在');
    }

    this.permission.restore();

    // 发布权限恢复事件
    const event = new PermissionRestoredEvent(this.permission.id, restoredBy);
    this.addDomainEvent(event);
  }

  /**
   * @method getPermission
   * @description 获取权限实体
   * @returns {PermissionEntity | null} 权限实体或null
   */
  getPermission(): PermissionEntity | null {
    return this.permission;
  }

  /**
   * @method validatePermissionData
   * @description 验证权限数据的有效性
   * @param {Resource} resource 权限资源
   * @param {Action} action 权限操作
   * @param {PermissionCondition[]} conditions 权限条件列表
   * @param {PermissionScope} scope 权限作用域
   * @returns {void}
   * @throws {InvalidResourceError} 当资源无效时抛出
   * @throws {InvalidActionError} 当操作无效时抛出
   * @throws {InvalidScopeError} 当作用域无效时抛出
   * @private
   */
  private validatePermissionData(
    resource: Resource,
    action: Action,
    conditions: PermissionCondition[],
    scope: PermissionScope,
  ): void {
    if (!resource) {
      throw new Error('权限资源无效');
    }

    if (!action) {
      throw new Error('权限操作无效');
    }

    if (!scope) {
      throw new Error('权限作用域无效');
    }

    // 验证权限条件
    for (const condition of conditions) {
      if (!condition) {
        throw new Error('权限条件无效');
      }
    }
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照
   * @returns {Record<string, unknown>} 聚合根快照
   */
  toSnapshot(): Record<string, unknown> {
    return {
      permission: this.permission?.toSnapshot(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复聚合根
   * @param {Record<string, unknown>} snapshot 聚合根快照
   * @returns {PermissionAggregate} 权限聚合根实例
   * @static
   */
  static fromSnapshot(snapshot: Record<string, unknown>): PermissionAggregate {
    const aggregate = new PermissionAggregate();

    if (snapshot.permission) {
      aggregate.permission = PermissionEntity.fromSnapshot(
        snapshot.permission as Record<string, unknown>,
      );
    }

    return aggregate;
  }
}

// 导入权限领域事件
import { PermissionCreatedEvent } from '../events/permission-created.event';
import { PermissionUpdatedEvent } from '../events/permission-updated.event';
import { PermissionStatusChangedEvent } from '../events/permission-status-changed.event';
import { PermissionDeletedEvent } from '../events/permission-deleted.event';
import { PermissionRestoredEvent } from '../events/permission-restored.event';
