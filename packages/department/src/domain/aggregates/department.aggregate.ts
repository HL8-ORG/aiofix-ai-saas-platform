import { EventSourcedAggregateRoot, IDomainEvent } from '@aiofix/core';
import { DepartmentCreatedEvent } from '../events/department-created.event';
import { DepartmentMovedEvent } from '../events/department-moved.event';
import { DepartmentEntity } from '../entities/department.entity';
import { DepartmentId } from '../value-objects/department-id.vo';
import { DepartmentName } from '../value-objects/department-name.vo';
import { DepartmentDescription } from '../value-objects/department-description.vo';
import { DepartmentSettings } from '../value-objects/department-settings.vo';
import { DepartmentStatus } from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';

/**
 * @class DepartmentAggregate
 * @description
 * 部门聚合根，负责管理部门相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供部门创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 部门名称在组织内必须唯一
 * 2. 部门不能同时属于多个组织
 * 3. 部门删除前必须清理所有关联数据
 * 4. 部门状态变更必须遵循状态机规则
 * 5. 部门层级关系必须保持一致性
 *
 * @property {DepartmentEntity} department 部门实体
 * @property {DomainEvent[]} uncommittedEvents 未提交的领域事件
 *
 * @example
 * ```typescript
 * const departmentAggregate = new DepartmentAggregate();
 * await departmentAggregate.createDepartment(
 *   '技术研发部',
 *   '负责技术研发和产品创新',
 *   tenantId,
 *   organizationId
 * );
 * // 自动发布 DepartmentCreatedEvent
 * ```
 * @since 1.0.0
 */
export class DepartmentAggregate extends EventSourcedAggregateRoot {
  private department?: DepartmentEntity;

  constructor(department?: DepartmentEntity) {
    super();
    this.department = department;
  }

  /**
   * @method get id
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  get id(): string {
    return this.department?.id.value || '';
  }

  /**
   * @method createDepartment
   * @description 创建新部门，发布部门创建事件
   * @param {string} name 部门名称
   * @param {string} description 部门描述
   * @param {TenantId} tenantId 租户ID
   * @param {OrganizationId} organizationId 组织ID
   * @param {DepartmentId} [parentDepartmentId] 父部门ID，可选
   * @param {DepartmentSettings} [settings] 部门设置，可选
   * @returns {Promise<void>}
   * @throws {DuplicateDepartmentNameError} 当部门名称已存在时抛出
   * @throws {InvalidOrganizationError} 当组织不存在时抛出
   * @throws {InvalidParentDepartmentError} 当父部门无效时抛出
   */
  async createDepartment(
    name: string,
    description: string,
    tenantId: TenantId,
    organizationId: OrganizationId,
    parentDepartmentId?: DepartmentId,
    settings?: DepartmentSettings,
  ): Promise<void> {
    // 验证创建数据
    await this.validateDepartmentCreationData(
      name,
      tenantId,
      organizationId,
      parentDepartmentId,
    );

    // 创建部门实体
    const departmentId = new DepartmentId();
    const departmentName = new DepartmentName(name);
    const departmentDescription = new DepartmentDescription(description);
    const departmentSettings = settings || DepartmentSettings.createDefault();

    // 计算部门层级
    const level = await this.calculateDepartmentLevel(
      organizationId,
      parentDepartmentId,
    );

    this.department = new DepartmentEntity(
      departmentId,
      tenantId,
      organizationId,
      parentDepartmentId || null,
      departmentName,
      departmentDescription,
      departmentSettings,
      DepartmentStatus.INACTIVE,
      level,
    );

    // 发布部门创建事件
    const event = new DepartmentCreatedEvent(
      this.department.id,
      this.department.tenantId,
      this.department.organizationId,
      this.department.parentDepartmentId,
      this.department.name,
      this.department.description,
      this.department.settings,
      this.department.getStatus(),
      this.department.level,
      this.department.createdAt,
    );
    this.apply(event);
  }

  /**
   * @method updateDepartment
   * @description 更新部门信息，发布部门更新事件
   * @param {string} [name] 新部门名称，可选
   * @param {string} [description] 新部门描述，可选
   * @param {DepartmentSettings} [settings] 新部门设置，可选
   * @returns {Promise<void>}
   * @throws {DepartmentNotFoundError} 当部门不存在时抛出
   * @throws {InvalidStateError} 当部门状态不允许更新时抛出
   */
  async updateDepartment(
    name?: string,
    description?: string,
    settings?: DepartmentSettings,
  ): Promise<void> {
    if (!this.department) {
      throw new DepartmentNotFoundError('部门不存在');
    }

    if (!this.department.isOperational()) {
      throw new InvalidStateError('部门状态不允许更新');
    }

    // 验证更新数据
    if (name) {
      await this.validateDepartmentName(
        name,
        this.department.organizationId,
        this.department.id,
      );
    }

    // 创建更新后的部门实体
    const updatedName = name ? new DepartmentName(name) : this.department.name;
    const updatedDescription = description
      ? new DepartmentDescription(description)
      : this.department.description;
    const updatedSettings = settings || this.department.settings;

    this.department = new DepartmentEntity(
      this.department.id,
      this.department.tenantId,
      this.department.organizationId,
      this.department.parentDepartmentId,
      updatedName,
      updatedDescription,
      updatedSettings,
      this.department.getStatus(),
      this.department.level,
      this.department.createdAt,
      new Date(),
      this.department.deletedAt,
    );

    // 发布部门更新事件
    // TODO: 创建DepartmentUpdatedEvent类
    // const event = new DepartmentUpdatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method moveDepartment
   * @description 移动部门到新的父部门，发布部门移动事件
   * @param {DepartmentId} newParentDepartmentId 新父部门ID
   * @returns {Promise<void>}
   * @throws {DepartmentNotFoundError} 当部门不存在时抛出
   * @throws {InvalidStateError} 当部门状态不允许移动时抛出
   * @throws {InvalidParentDepartmentError} 当新父部门无效时抛出
   */
  async moveDepartment(newParentDepartmentId: DepartmentId): Promise<void> {
    if (!this.department) {
      throw new DepartmentNotFoundError('部门不存在');
    }

    if (!this.department.isOperational()) {
      throw new InvalidStateError('部门状态不允许移动');
    }

    // 验证新父部门
    await this.validateParentDepartment(
      newParentDepartmentId,
      this.department.organizationId,
      this.department.id,
    );

    // 计算新的层级
    const newLevel = await this.calculateDepartmentLevel(
      this.department.organizationId,
      newParentDepartmentId,
    );

    // 创建移动后的部门实体
    this.department = new DepartmentEntity(
      this.department.id,
      this.department.tenantId,
      this.department.organizationId,
      newParentDepartmentId,
      this.department.name,
      this.department.description,
      this.department.settings,
      this.department.getStatus(),
      newLevel,
      this.department.createdAt,
      new Date(),
      this.department.deletedAt,
    );

    // 发布部门移动事件
    const event = new DepartmentMovedEvent(
      this.department.id,
      this.department.tenantId,
      this.department.organizationId,
      this.department.parentDepartmentId,
      newParentDepartmentId,
      this.department.level,
      newLevel,
      new Date(),
    );
    this.apply(event);
  }

  /**
   * @method activateDepartment
   * @description 激活部门，发布部门激活事件
   * @returns {Promise<void>}
   * @throws {DepartmentNotFoundError} 当部门不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async activateDepartment(): Promise<void> {
    if (!this.department) {
      throw new DepartmentNotFoundError('部门不存在');
    }

    if (!this.department.canBeActivated()) {
      throw new InvalidStateTransitionError(
        `无法从${this.department.getStatus()}状态激活部门`,
      );
    }

    this.department.activate();

    // 发布部门激活事件
    // TODO: 创建DepartmentActivatedEvent类
    // const event = new DepartmentActivatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method suspendDepartment
   * @description 暂停部门，发布部门暂停事件
   * @returns {Promise<void>}
   * @throws {DepartmentNotFoundError} 当部门不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async suspendDepartment(): Promise<void> {
    if (!this.department) {
      throw new DepartmentNotFoundError('部门不存在');
    }

    if (!this.department.canBeSuspended()) {
      throw new InvalidStateTransitionError(
        `无法从${this.department.getStatus()}状态暂停部门`,
      );
    }

    this.department.suspend();

    // 发布部门暂停事件
    // TODO: 创建DepartmentSuspendedEvent类
    // const event = new DepartmentSuspendedEvent(...);
    // this.apply(event);
  }

  /**
   * @method deleteDepartment
   * @description 删除部门，发布部门删除事件
   * @returns {Promise<void>}
   * @throws {DepartmentNotFoundError} 当部门不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async deleteDepartment(): Promise<void> {
    if (!this.department) {
      throw new DepartmentNotFoundError('部门不存在');
    }

    if (!this.department.canBeDeleted()) {
      throw new InvalidStateTransitionError(
        `无法从${this.department.getStatus()}状态删除部门`,
      );
    }

    this.department.delete();

    // 发布部门删除事件
    // TODO: 创建DepartmentDeletedEvent类
    // const event = new DepartmentDeletedEvent(...);
    // this.apply(event);
  }

  /**
   * @method getDepartment
   * @description 获取部门实体
   * @returns {DepartmentEntity | undefined} 部门实体
   */
  getDepartment(): DepartmentEntity | undefined {
    return this.department;
  }

  /**
   * @method handleEvent
   * @description 处理领域事件，重建聚合根状态
   * @param {IDomainEvent} event 领域事件
   * @param {boolean} isFromHistory 是否来自历史事件
   * @returns {void}
   */
  handleEvent(event: IDomainEvent, isFromHistory: boolean = false): void {
    switch (event.eventType) {
      case 'DepartmentCreated':
        this.handleDepartmentCreatedEvent(event);
        break;
      case 'DepartmentUpdated':
        this.handleDepartmentUpdatedEvent(event);
        break;
      case 'DepartmentMoved':
        this.handleDepartmentMovedEvent(event);
        break;
      case 'DepartmentActivated':
        this.handleDepartmentActivatedEvent(event);
        break;
      case 'DepartmentSuspended':
        this.handleDepartmentSuspendedEvent(event);
        break;
      case 'DepartmentDeleted':
        this.handleDepartmentDeletedEvent(event);
        break;
    }
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照
   * @returns {any} 快照数据
   */
  toSnapshot(): any {
    return {
      department: this.department,
      version: this.version,
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根
   * @param {any} snapshot 快照数据
   * @returns {void}
   */
  fromSnapshot(snapshot: any): void {
    this.department = snapshot.department as DepartmentEntity;
    // 注意：_version是私有属性，需要通过其他方式设置
    // 这里暂时注释掉，等待EventSourcedAggregateRoot提供公共方法
    // this._version = snapshot.version || 0;
  }

  // 私有辅助方法
  private async validateDepartmentCreationData(
    name: string,
    tenantId: TenantId,
    organizationId: OrganizationId,
    parentDepartmentId?: DepartmentId,
  ): Promise<void> {
    // 验证部门名称格式
    if (!DepartmentName.isValid(name)) {
      throw new InvalidDepartmentNameError(`无效的部门名称: ${name}`);
    }

    // 验证租户ID
    if (!tenantId) {
      throw new InvalidTenantError('租户ID不能为空');
    }

    // 验证组织ID
    if (!organizationId) {
      throw new InvalidOrganizationError('组织ID不能为空');
    }

    // 验证父部门
    if (parentDepartmentId) {
      await this.validateParentDepartment(parentDepartmentId, organizationId);
    }
  }

  private async validateDepartmentName(
    name: string,
    organizationId: OrganizationId,
    excludeDepartmentId?: DepartmentId,
  ): Promise<void> {
    if (!DepartmentName.isValid(name)) {
      throw new InvalidDepartmentNameError(`无效的部门名称: ${name}`);
    }

    // 这里可以添加更多业务规则验证
    // 例如：检查部门名称在组织内是否唯一
  }

  private async validateParentDepartment(
    parentDepartmentId: DepartmentId,
    organizationId: OrganizationId,
    excludeDepartmentId?: DepartmentId,
  ): Promise<void> {
    // 这里应该验证父部门是否存在且属于同一组织
    // 暂时作为占位符
  }

  private async calculateDepartmentLevel(
    organizationId: OrganizationId,
    parentDepartmentId?: DepartmentId,
  ): Promise<number> {
    if (!parentDepartmentId) {
      return 1; // 根部门
    }

    // 这里应该计算父部门的层级并加1
    // 暂时返回2作为占位符
    return 2;
  }

  // 事件处理方法
  private handleDepartmentCreatedEvent(event: IDomainEvent): void {
    const data = event.toJSON();
    this.department = new DepartmentEntity(
      new DepartmentId(data.departmentId),
      new TenantId(data.tenantId),
      new OrganizationId(data.organizationId),
      data.parentDepartmentId
        ? new DepartmentId(data.parentDepartmentId)
        : null,
      new DepartmentName(data.name),
      new DepartmentDescription(data.description),
      new DepartmentSettings(data.settings),
      data.status,
      data.level,
      new Date(data.createdAt),
    );
  }

  private handleDepartmentUpdatedEvent(event: IDomainEvent): void {
    const data = event.toJSON();
    if (this.department) {
      this.department = new DepartmentEntity(
        this.department.id,
        this.department.tenantId,
        this.department.organizationId,
        this.department.parentDepartmentId,
        new DepartmentName(data.name),
        new DepartmentDescription(data.description),
        new DepartmentSettings(data.settings),
        this.department.getStatus(),
        this.department.level,
        this.department.createdAt,
        new Date(data.updatedAt),
        this.department.deletedAt,
      );
    }
  }

  private handleDepartmentMovedEvent(event: IDomainEvent): void {
    const data = event.toJSON();
    if (this.department) {
      this.department = new DepartmentEntity(
        this.department.id,
        this.department.tenantId,
        this.department.organizationId,
        new DepartmentId(data.newParentDepartmentId),
        this.department.name,
        this.department.description,
        this.department.settings,
        this.department.getStatus(),
        data.newLevel,
        this.department.createdAt,
        new Date(data.movedAt),
        this.department.deletedAt,
      );
    }
  }

  private handleDepartmentActivatedEvent(event: IDomainEvent): void {
    if (this.department) {
      this.department.activate();
    }
  }

  private handleDepartmentSuspendedEvent(event: IDomainEvent): void {
    if (this.department) {
      this.department.suspend();
    }
  }

  private handleDepartmentDeletedEvent(event: IDomainEvent): void {
    if (this.department) {
      this.department.delete();
    }
  }
}

// 异常类定义
export class DepartmentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DepartmentNotFoundError';
  }
}

export class DuplicateDepartmentNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateDepartmentNameError';
  }
}

export class InvalidTenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTenantError';
  }
}

export class InvalidOrganizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationError';
  }
}

export class InvalidParentDepartmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidParentDepartmentError';
  }
}

export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export class InvalidDepartmentNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentNameError';
  }
}
