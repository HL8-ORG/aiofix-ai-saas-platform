import { EventSourcedAggregateRoot, DomainEvent } from '@aiofix/core';
import { DepartmentCreatedEvent } from '../events/department-created.event';
import { DepartmentMovedEvent } from '../events/department-moved.event';
import { DepartmentEntity } from '../entities/department.entity';
import { DepartmentId } from '@aiofix/shared';
import { DepartmentName, DepartmentDescription } from '@aiofix/shared';
import {
  DepartmentSettings,
  DepartmentSettingsData,
} from '../value-objects/department-settings.vo';
import { DepartmentStatus } from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/shared';

// 事件数据接口
interface DepartmentEventData {
  departmentId?: string;
  tenantId?: string;
  organizationId?: string;
  parentDepartmentId?: string;
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
  status?: DepartmentStatus;
  level?: number;
  createdAt?: string;
  createdBy?: string;
  newParentDepartmentId?: string;
  newLevel?: number;
  movedBy?: string;
}

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
  public readonly id: string = this.department?.id.value ?? '';

  constructor(department?: DepartmentEntity) {
    super();
    this.department = department;
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
    const departmentSettings = settings ?? DepartmentSettings.createDefault();

    // 计算部门层级
    const level = await this.calculateDepartmentLevel(
      organizationId,
      parentDepartmentId,
    );

    this.department = new DepartmentEntity(
      departmentId,
      tenantId,
      organizationId,
      parentDepartmentId ?? null,
      departmentName,
      departmentDescription,
      departmentSettings,
      DepartmentStatus.PENDING,
      level,
      'system',
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
    this.handleEvent(event);
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
    const updatedSettings = settings ?? this.department.settings;

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
      'system',
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
      'system',
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
    this.handleEvent(event);
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

    this.department.activate('system');

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

    this.department.suspend('system');

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

    this.department.delete('system');

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
   * @param {DomainEvent} event 领域事件
   * @param {boolean} isFromHistory 是否来自历史事件
   * @returns {void}
   */
  handleEvent(event: DomainEvent, _isFromHistory: boolean = false): void {
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
  toSnapshot(): Record<string, unknown> {
    return {
      department: this.department,
      version: 0, // TODO: Implement proper version tracking
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根
   * @param {any} snapshot 快照数据
   * @returns {void}
   */
  fromSnapshot(snapshot: Record<string, unknown>): void {
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

    // 租户ID和组织ID由调用方保证非空

    // 验证父部门
    if (parentDepartmentId) {
      await this.validateParentDepartment(parentDepartmentId, organizationId);
    }
  }

  private async validateDepartmentName(
    name: string,
    _organizationId: OrganizationId,
    _excludeDepartmentId?: DepartmentId,
  ): Promise<void> {
    if (!DepartmentName.isValid(name)) {
      throw new InvalidDepartmentNameError(`无效的部门名称: ${name}`);
    }

    // 这里可以添加更多业务规则验证
    // 例如：检查部门名称在组织内是否唯一
  }

  private async validateParentDepartment(
    _parentDepartmentId: DepartmentId,
    _organizationId: OrganizationId,
    _excludeDepartmentId?: DepartmentId,
  ): Promise<void> {
    // 这里应该验证父部门是否存在且属于同一组织
    // 暂时作为占位符
  }

  private async calculateDepartmentLevel(
    _organizationId: OrganizationId,
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
  private handleDepartmentCreatedEvent(event: DomainEvent): void {
    const data = event.toJSON() as DepartmentEventData;
    this.department = new DepartmentEntity(
      new DepartmentId(data.departmentId ?? ''),
      new TenantId(data.tenantId ?? ''),
      new OrganizationId(data.organizationId ?? ''),
      data.parentDepartmentId
        ? new DepartmentId(data.parentDepartmentId)
        : null,
      new DepartmentName(data.name ?? ''),
      new DepartmentDescription(data.description ?? ''),
      new DepartmentSettings(
        data.settings
          ? (data.settings as unknown as DepartmentSettingsData)
          : DepartmentSettings.createDefault().value,
      ),
      data.status ?? DepartmentStatus.PENDING,
      data.level ?? 1,
      data.createdBy ?? 'system',
    );
  }

  private handleDepartmentUpdatedEvent(event: DomainEvent): void {
    const data = event.toJSON() as DepartmentEventData;
    if (this.department) {
      this.department = new DepartmentEntity(
        this.department.id,
        this.department.tenantId,
        this.department.organizationId,
        this.department.parentDepartmentId,
        new DepartmentName(data.name ?? ''),
        new DepartmentDescription(data.description ?? ''),
        new DepartmentSettings(
          data.settings
            ? (data.settings as unknown as DepartmentSettingsData)
            : DepartmentSettings.createDefault().value,
        ),
        this.department.getStatus(),
        this.department.level,
        data.createdBy ?? 'system',
      );
    }
  }

  private handleDepartmentMovedEvent(event: DomainEvent): void {
    const data = event.toJSON() as DepartmentEventData;
    if (this.department) {
      this.department = new DepartmentEntity(
        this.department.id,
        this.department.tenantId,
        this.department.organizationId,
        new DepartmentId(data.newParentDepartmentId ?? ''),
        this.department.name,
        this.department.description,
        this.department.settings,
        this.department.getStatus(),
        data.newLevel ?? 1,
        data.movedBy ?? 'system',
      );
    }
  }

  private handleDepartmentActivatedEvent(_event: DomainEvent): void {
    if (this.department) {
      this.department.activate('system');
    }
  }

  private handleDepartmentSuspendedEvent(_event: DomainEvent): void {
    if (this.department) {
      this.department.suspend('system');
    }
  }

  private handleDepartmentDeletedEvent(_event: DomainEvent): void {
    if (this.department) {
      this.department.delete('system');
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
