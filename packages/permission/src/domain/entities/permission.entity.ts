import { BaseEntity } from '@aiofix/core';
import {
  PermissionId,
  Resource,
  Action,
  PermissionCondition,
  PermissionScope,
  PermissionSettings,
} from '../value-objects';
import { PermissionStatus, PermissionType } from '../enums';
import { TenantId } from '@aiofix/shared';

/**
 * @class PermissionEntity
 * @description
 * 权限领域实体，负责维护权限的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识权限身份
 * 2. 管理权限的基本状态（活跃、非活跃、暂停、删除、过期等）
 * 3. 维护权限的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 权限ID一旦创建不可变更
 * 2. 权限状态变更必须遵循预定义的状态机
 * 3. 删除权限时采用软删除策略
 * 4. 权限资源、操作和条件必须有效
 * 5. 权限作用域必须符合层级关系
 *
 * @property {PermissionId} id 权限唯一标识符，不可变更
 * @property {Resource} resource 权限资源
 * @property {Action} action 权限操作
 * @property {PermissionCondition[]} conditions 权限条件列表
 * @property {PermissionScope} scope 权限作用域
 * @property {PermissionType} type 权限类型
 * @property {PermissionStatus} status 权限状态
 * @property {PermissionSettings} settings 权限设置
 * @property {TenantId} tenantId 所属租户ID
 * @property {Date} createdAt 权限创建时间
 * @property {Date} updatedAt 权限最后更新时间
 * @property {Date} deletedAt 权限删除时间（软删除）
 *
 * @example
 * ```typescript
 * const permission = new PermissionEntity(
 *   new PermissionId(),
 *   new Resource('user'),
 *   new Action('read'),
 *   new PermissionScope({ level: 'tenant', tenantId: 'tenant-123' }),
 *   PermissionType.TENANT,
 *   new TenantId('tenant-123')
 * );
 * permission.activate(); // 激活权限
 * permission.suspend(); // 暂停权限
 * ```
 * @since 1.0.0
 */
export class PermissionEntity extends BaseEntity {
  constructor(
    public readonly id: PermissionId,
    public readonly resource: Resource,
    public readonly action: Action,
    public readonly conditions: PermissionCondition[],
    public readonly scope: PermissionScope,
    public readonly type: PermissionType,
    public readonly settings: PermissionSettings,
    public readonly tenantId: TenantId,
    private _status: PermissionStatus = PermissionStatus.ACTIVE,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validatePermission();
  }

  /**
   * @getter status
   * @description 获取权限状态
   * @returns {PermissionStatus} 权限状态
   */
  public get status(): PermissionStatus {
    return this._status;
  }

  /**
   * @method validatePermission
   * @description 验证权限实体的有效性
   * @returns {void}
   * @throws {InvalidPermissionError} 当权限无效时抛出
   * @private
   */
  private validatePermission(): void {
    if (!this.id) {
      throw new InvalidPermissionError('权限ID不能为空');
    }

    if (!this.resource) {
      throw new InvalidPermissionError('权限资源不能为空');
    }

    if (!this.action) {
      throw new InvalidPermissionError('权限操作不能为空');
    }

    if (!this.scope) {
      throw new InvalidPermissionError('权限作用域不能为空');
    }

    if (!this.type) {
      throw new InvalidPermissionError('权限类型不能为空');
    }

    if (!this.settings) {
      throw new InvalidPermissionError('权限设置不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidPermissionError('租户ID不能为空');
    }

    // 验证权限类型与作用域的一致性
    this.validateTypeScopeConsistency();

    // 验证权限条件
    this.validateConditions();
  }

  /**
   * @method validateTypeScopeConsistency
   * @description 验证权限类型与作用域的一致性
   * @returns {void}
   * @throws {InvalidPermissionError} 当类型与作用域不一致时抛出
   * @private
   */
  private validateTypeScopeConsistency(): void {
    const requiredScopeLevel = this.getRequiredScopeLevel();
    const actualScopeLevel = this.scope.getLevel();

    if (requiredScopeLevel !== actualScopeLevel) {
      throw new InvalidPermissionError(
        `权限类型 ${this.type} 需要 ${requiredScopeLevel} 级作用域，但实际为 ${actualScopeLevel} 级`,
      );
    }
  }

  /**
   * @method validateConditions
   * @description 验证权限条件
   * @returns {void}
   * @throws {InvalidPermissionError} 当权限条件无效时抛出
   * @private
   */
  private validateConditions(): void {
    if (!Array.isArray(this.conditions)) {
      throw new InvalidPermissionError('权限条件必须是数组');
    }

    // 检查条件数量限制
    if (this.conditions.length > 10) {
      throw new InvalidPermissionError('权限条件数量不能超过10个');
    }

    // 验证每个条件
    for (const condition of this.conditions) {
      if (!(condition instanceof PermissionCondition)) {
        throw new InvalidPermissionError(
          '权限条件必须是 PermissionCondition 实例',
        );
      }
    }
  }

  /**
   * @method getRequiredScopeLevel
   * @description 获取权限类型所需的作用域级别
   * @returns {string} 作用域级别
   * @private
   */
  private getRequiredScopeLevel(): string {
    const scopeLevels: Record<PermissionType, string> = {
      [PermissionType.PLATFORM]: 'platform',
      [PermissionType.TENANT]: 'tenant',
      [PermissionType.ORGANIZATION]: 'organization',
      [PermissionType.DEPARTMENT]: 'department',
      [PermissionType.USER]: 'user',
      [PermissionType.SYSTEM]: 'platform',
      [PermissionType.CUSTOM]: 'tenant',
    };
    return scopeLevels[this.type] || 'tenant';
  }

  /**
   * @method getStatus
   * @description 获取权限状态
   * @returns {PermissionStatus} 权限状态
   */
  getStatus(): PermissionStatus {
    return this._status;
  }

  /**
   * @method activate
   * @description 激活权限
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  activate(): void {
    if (!this.canBeActivated()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 转换为 ${PermissionStatus.ACTIVE}`,
      );
    }
    this._status = PermissionStatus.ACTIVE;
  }

  /**
   * @method deactivate
   * @description 停用权限
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  deactivate(): void {
    if (!this.canBeDeactivated()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 转换为 ${PermissionStatus.INACTIVE}`,
      );
    }
    this._status = PermissionStatus.INACTIVE;
  }

  /**
   * @method suspend
   * @description 暂停权限
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  suspend(): void {
    if (!this.canBeSuspended()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 转换为 ${PermissionStatus.SUSPENDED}`,
      );
    }
    this._status = PermissionStatus.SUSPENDED;
  }

  /**
   * @method restore
   * @description 恢复权限
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  restore(): void {
    if (!this.canBeRestored()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 恢复`,
      );
    }
    this._status = PermissionStatus.ACTIVE;
  }

  /**
   * @method updatePermission
   * @description 更新权限信息
   * @param {Resource} newResource 新的权限资源
   * @param {Action} newAction 新的权限操作
   * @param {PermissionCondition[]} newConditions 新的权限条件列表
   * @param {PermissionScope} newScope 新的权限作用域
   * @param {PermissionSettings} newSettings 新的权限设置
   * @param {string} updatedBy 更新者ID
   * @returns {void}
   * @throws {InvalidResourceError} 当资源无效时抛出
   * @throws {InvalidActionError} 当操作无效时抛出
   * @throws {InvalidScopeError} 当作用域无效时抛出
   *
   * 业务逻辑：
   * 1. 验证新的权限数据
   * 2. 更新权限属性
   * 3. 更新审计信息
   */
  updatePermission(
    newResource: Resource,
    newAction: Action,
    newConditions: PermissionCondition[],
    newScope: PermissionScope,
    newSettings: PermissionSettings,
    updatedBy: string,
  ): void {
    // 验证新的权限数据
    this.validatePermissionData(
      newResource,
      newAction,
      newConditions,
      newScope,
    );

    // 更新权限属性（注意：由于实体是不可变的，这里应该创建新实例）
    // 但为了简化，我们直接更新属性
    (this as any).resource = newResource;
    (this as any).action = newAction;
    (this as any).conditions = newConditions;
    (this as any).scope = newScope;
    (this as any).settings = newSettings;

    // 更新审计信息
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method expire
   * @description 使权限过期
   * @returns {void}
   */
  expire(): void {
    this._status = PermissionStatus.EXPIRED;
  }

  /**
   * @method approve
   * @description 审批通过权限
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  approve(): void {
    if (!this.canBeApproved()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 审批通过`,
      );
    }
    this._status = PermissionStatus.ACTIVE;
  }

  /**
   * @method reject
   * @description 拒绝权限申请
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  reject(): void {
    if (!this.canBeRejected()) {
      throw new InvalidStateTransitionError(
        `权限状态不能从 ${this._status} 拒绝`,
      );
    }
    this._status = PermissionStatus.REJECTED;
  }

  /**
   * @method canBeActivated
   * @description 检查权限是否可以激活
   * @returns {boolean} 是否可以激活
   */
  canBeActivated(): boolean {
    return [
      PermissionStatus.INACTIVE,
      PermissionStatus.SUSPENDED,
      PermissionStatus.PENDING_APPROVAL,
    ].includes(this._status);
  }

  /**
   * @method canBeDeactivated
   * @description 检查权限是否可以停用
   * @returns {boolean} 是否可以停用
   */
  canBeDeactivated(): boolean {
    return this._status === PermissionStatus.ACTIVE;
  }

  /**
   * @method canBeSuspended
   * @description 检查权限是否可以暂停
   * @returns {boolean} 是否可以暂停
   */
  canBeSuspended(): boolean {
    return this._status === PermissionStatus.ACTIVE;
  }

  /**
   * @method canBeRestored
   * @description 检查权限是否可以恢复
   * @returns {boolean} 是否可以恢复
   */
  canBeRestored(): boolean {
    return [PermissionStatus.SUSPENDED, PermissionStatus.INACTIVE].includes(
      this._status,
    );
  }

  /**
   * @method canBeApproved
   * @description 检查权限是否可以审批
   * @returns {boolean} 是否可以审批
   */
  canBeApproved(): boolean {
    return this._status === PermissionStatus.PENDING_APPROVAL;
  }

  /**
   * @method canBeRejected
   * @description 检查权限是否可以拒绝
   * @returns {boolean} 是否可以拒绝
   */
  canBeRejected(): boolean {
    return this._status === PermissionStatus.PENDING_APPROVAL;
  }

  /**
   * @method canBeDeleted
   * @description 检查权限是否可以删除
   * @returns {boolean} 是否可以删除
   */
  canBeDeleted(): boolean {
    return (
      [
        PermissionStatus.ACTIVE,
        PermissionStatus.INACTIVE,
        PermissionStatus.SUSPENDED,
        PermissionStatus.PENDING_APPROVAL,
        PermissionStatus.REJECTED,
      ].includes(this._status) && this.settings.canBeDeleted()
    );
  }

  /**
   * @method canBeModified
   * @description 检查权限是否可以修改
   * @returns {boolean} 是否可以修改
   */
  canBeModified(): boolean {
    return (
      [
        PermissionStatus.ACTIVE,
        PermissionStatus.INACTIVE,
        PermissionStatus.SUSPENDED,
        PermissionStatus.PENDING_APPROVAL,
      ].includes(this._status) && this.settings.canBeModified()
    );
  }

  /**
   * @method isActive
   * @description 检查权限是否处于活跃状态
   * @returns {boolean} 是否处于活跃状态
   */
  isActive(): boolean {
    return this._status === PermissionStatus.ACTIVE;
  }

  /**
   * @method isExpired
   * @description 检查权限是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    return (
      this._status === PermissionStatus.EXPIRED || this.settings.isExpired()
    );
  }

  /**
   * @method isEffective
   * @description 检查权限是否在有效期内
   * @returns {boolean} 是否在有效期内
   */
  isEffective(): boolean {
    return this.isActive() && this.settings.isEffective() && !this.isExpired();
  }

  /**
   * @method hasCondition
   * @description 检查权限是否有指定条件
   * @param {PermissionCondition} condition 权限条件
   * @returns {boolean} 是否有指定条件
   */
  hasCondition(condition: PermissionCondition): boolean {
    return this.conditions.some(c => c.equals(condition));
  }

  /**
   * @method addCondition
   * @description 添加权限条件
   * @param {PermissionCondition} condition 权限条件
   * @returns {void}
   * @throws {InvalidPermissionError} 当条件已存在或数量超限时抛出
   */
  addCondition(condition: PermissionCondition): void {
    if (this.hasCondition(condition)) {
      throw new InvalidPermissionError('权限条件已存在');
    }

    if (this.conditions.length >= 10) {
      throw new InvalidPermissionError('权限条件数量不能超过10个');
    }

    this.conditions.push(condition);
  }

  /**
   * @method removeCondition
   * @description 移除权限条件
   * @param {PermissionCondition} condition 权限条件
   * @returns {void}
   * @throws {InvalidPermissionError} 当条件不存在时抛出
   */
  removeCondition(condition: PermissionCondition): void {
    const index = this.conditions.findIndex(c => c.equals(condition));
    if (index === -1) {
      throw new InvalidPermissionError('权限条件不存在');
    }
    this.conditions.splice(index, 1);
  }

  /**
   * @method evaluateConditions
   * @description 评估权限条件
   * @param {Record<string, unknown>} context 评估上下文
   * @returns {boolean} 所有条件是否满足
   */
  evaluateConditions(context: Record<string, unknown>): boolean {
    return this.conditions.every(condition => condition.evaluate(context));
  }

  /**
   * @method matches
   * @description 检查权限是否匹配指定的资源、操作和作用域
   * @param {Resource} resource 资源
   * @param {Action} action 操作
   * @param {PermissionScope} scope 作用域
   * @returns {boolean} 是否匹配
   */
  matches(resource: Resource, action: Action, scope: PermissionScope): boolean {
    return (
      this.resource.equals(resource) &&
      this.action.equals(action) &&
      this.scope.includes(scope)
    );
  }

  /**
   * @method getPermissionString
   * @description 获取权限字符串表示
   * @returns {string} 权限字符串
   */
  getPermissionString(): string {
    const conditionsStr =
      this.conditions.length > 0
        ? `[${this.conditions.map(c => c.toString()).join(', ')}]`
        : '';
    return `${this.resource.toString()}:${this.action.toString()}:${this.scope.toString()}${conditionsStr}`;
  }

  /**
   * @method getEntityId
   * @description 获取实体ID，实现BaseEntity抽象方法
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.id.toString();
  }

  /**
   * @method getTenantId
   * @description 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId.toString();
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
   * @method toJSON
   * @description 将权限实体转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的权限数据
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id.value,
      resource: this.resource.value,
      action: this.action.value,
      conditions: this.conditions.map(c => c.toJSON()),
      scope: this.scope.toJSON(),
      type: this.type,
      status: this._status,
      settings: this.settings.toJSON(),
      tenantId: this.tenantId.value,
      createdAt: this.getCreatedAt().toISOString(),
      updatedAt: this.getUpdatedAt().toISOString(),
      deletedAt: this.getDeletedAt()?.toISOString(),
    };
  }

  /**
   * @method toSnapshot
   * @description 创建权限实体快照
   * @returns {Record<string, unknown>} 权限实体快照
   */
  toSnapshot(): Record<string, unknown> {
    return {
      id: this.id.toString(),
      resource: this.resource.toJSON(),
      action: this.action.toJSON(),
      conditions: this.conditions.map(condition => condition.toJSON()),
      scope: this.scope.toJSON(),
      type: this.type,
      status: this._status,
      settings: this.settings.toJSON(),
      tenantId: this.tenantId.toString(),
      createdBy: this.getCreatedBy(),
      createdAt: this.getCreatedAt(),
      updatedAt: this.getUpdatedAt(),
      updatedBy: this.getUpdatedBy(),
      deletedAt: this.getDeletedAt(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复权限实体
   * @param {Record<string, unknown>} snapshot 权限实体快照
   * @returns {PermissionEntity} 权限实体实例
   * @static
   */
  static fromSnapshot(snapshot: Record<string, unknown>): PermissionEntity {
    const entity = new PermissionEntity(
      new PermissionId(snapshot.id as string),
      snapshot.resource as Resource,
      snapshot.action as Action,
      snapshot.conditions as PermissionCondition[],
      snapshot.scope as PermissionScope,
      snapshot.type as PermissionType,
      snapshot.settings as PermissionSettings,
      new TenantId(snapshot.tenantId as string),
      snapshot.status as PermissionStatus,
      snapshot.createdBy as string,
    );

    // 恢复审计信息
    if (snapshot.updatedAt) {
      entity.updateAuditInfo(snapshot.updatedBy as string);
    }

    if (snapshot.deletedAt) {
      entity.softDelete(snapshot.deletedBy as string);
    }

    return entity;
  }
}

/**
 * @class InvalidPermissionError
 * @description 无效权限错误
 * @extends Error
 */
export class InvalidPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionError';
  }
}

/**
 * @class InvalidStateTransitionError
 * @description 无效状态转换错误
 * @extends Error
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}
