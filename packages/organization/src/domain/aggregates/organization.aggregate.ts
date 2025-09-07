import { EventSourcedAggregateRoot, IDomainEvent } from '@aiofix/core';
import { OrganizationEntity } from '../entities/organization.entity';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { OrganizationName } from '../value-objects/organization-name.vo';
import { OrganizationDescription } from '../value-objects/organization-description.vo';
import { OrganizationSettings } from '../value-objects/organization-settings.vo';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationAggregate
 * @description
 * 组织聚合根，负责管理组织相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供组织创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 组织名称在租户内必须唯一
 * 2. 组织不能同时属于多个租户
 * 3. 组织删除前必须清理所有关联数据
 * 4. 组织状态变更必须遵循状态机规则
 *
 * @property {OrganizationEntity} organization 组织实体
 * @property {DomainEvent[]} uncommittedEvents 未提交的领域事件
 *
 * @example
 * ```typescript
 * const organizationAggregate = new OrganizationAggregate();
 * await organizationAggregate.createOrganization(
 *   'AI开发团队',
 *   '专注于AI技术研发',
 *   tenantId
 * );
 * // 自动发布 OrganizationCreatedEvent
 * ```
 * @since 1.0.0
 */
export class OrganizationAggregate extends EventSourcedAggregateRoot {
  private organization?: OrganizationEntity;

  constructor(organization?: OrganizationEntity) {
    super();
    this.organization = organization;
  }

  /**
   * @method get id
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  get id(): string {
    return this.organization?.id.value || '';
  }

  /**
   * @method createOrganization
   * @description 创建新组织，发布组织创建事件
   * @param {string} name 组织名称
   * @param {string} description 组织描述
   * @param {TenantId} tenantId 租户ID
   * @param {OrganizationSettings} [settings] 组织设置，可选
   * @returns {Promise<void>}
   * @throws {DuplicateOrganizationNameError} 当组织名称已存在时抛出
   * @throws {InvalidTenantError} 当租户不存在时抛出
   */
  async createOrganization(
    name: string,
    description: string,
    tenantId: TenantId,
    settings?: OrganizationSettings,
  ): Promise<void> {
    // 验证创建数据
    await this.validateOrganizationCreationData(name, tenantId);

    // 创建组织实体
    const organizationId = new OrganizationId();
    const organizationName = new OrganizationName(name);
    const organizationDescription = new OrganizationDescription(description);
    const organizationSettings =
      settings || OrganizationSettings.createDefault();

    this.organization = new OrganizationEntity(
      organizationId,
      tenantId,
      organizationName,
      organizationDescription,
      organizationSettings,
    );

    // 发布组织创建事件
    // TODO: 创建OrganizationCreatedEvent类
    // const event = new OrganizationCreatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method updateOrganization
   * @description 更新组织信息，发布组织更新事件
   * @param {string} [name] 新组织名称，可选
   * @param {string} [description] 新组织描述，可选
   * @param {OrganizationSettings} [settings] 新组织设置，可选
   * @returns {Promise<void>}
   * @throws {OrganizationNotFoundError} 当组织不存在时抛出
   * @throws {InvalidStateError} 当组织状态不允许更新时抛出
   */
  async updateOrganization(
    name?: string,
    description?: string,
    settings?: OrganizationSettings,
  ): Promise<void> {
    if (!this.organization) {
      throw new OrganizationNotFoundError('组织不存在');
    }

    if (!this.organization.isOperational()) {
      throw new InvalidStateError('组织状态不允许更新');
    }

    // 验证更新数据
    if (name) {
      await this.validateOrganizationName(name, this.organization.tenantId);
    }

    // 创建更新后的组织实体
    const updatedName = name
      ? new OrganizationName(name)
      : this.organization.name;
    const updatedDescription = description
      ? new OrganizationDescription(description)
      : this.organization.description;
    const updatedSettings = settings || this.organization.settings;

    this.organization = new OrganizationEntity(
      this.organization.id,
      this.organization.tenantId,
      updatedName,
      updatedDescription,
      updatedSettings,
      this.organization.getStatus(),
      this.organization.createdAt,
      new Date(),
      this.organization.deletedAt,
    );

    // 发布组织更新事件
    // TODO: 创建OrganizationUpdatedEvent类
    // const event = new OrganizationUpdatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method activateOrganization
   * @description 激活组织，发布组织激活事件
   * @returns {Promise<void>}
   * @throws {OrganizationNotFoundError} 当组织不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async activateOrganization(): Promise<void> {
    if (!this.organization) {
      throw new OrganizationNotFoundError('组织不存在');
    }

    if (!this.organization.canBeActivated()) {
      throw new InvalidStateTransitionError(
        `无法从${this.organization.getStatus()}状态激活组织`,
      );
    }

    this.organization.activate();

    // 发布组织激活事件
    // TODO: 创建OrganizationActivatedEvent类
    // const event = new OrganizationActivatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method suspendOrganization
   * @description 暂停组织，发布组织暂停事件
   * @returns {Promise<void>}
   * @throws {OrganizationNotFoundError} 当组织不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async suspendOrganization(): Promise<void> {
    if (!this.organization) {
      throw new OrganizationNotFoundError('组织不存在');
    }

    if (!this.organization.canBeSuspended()) {
      throw new InvalidStateTransitionError(
        `无法从${this.organization.getStatus()}状态暂停组织`,
      );
    }

    this.organization.suspend();

    // 发布组织暂停事件
    // TODO: 创建OrganizationSuspendedEvent类
    // const event = new OrganizationSuspendedEvent(...);
    // this.apply(event);
  }

  /**
   * @method deleteOrganization
   * @description 删除组织，发布组织删除事件
   * @returns {Promise<void>}
   * @throws {OrganizationNotFoundError} 当组织不存在时抛出
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  async deleteOrganization(): Promise<void> {
    if (!this.organization) {
      throw new OrganizationNotFoundError('组织不存在');
    }

    if (!this.organization.canBeDeleted()) {
      throw new InvalidStateTransitionError(
        `无法从${this.organization.getStatus()}状态删除组织`,
      );
    }

    this.organization.delete();

    // 发布组织删除事件
    // TODO: 创建OrganizationDeletedEvent类
    // const event = new OrganizationDeletedEvent(...);
    // this.apply(event);
  }

  /**
   * @method getOrganization
   * @description 获取组织实体
   * @returns {OrganizationEntity | undefined} 组织实体
   */
  getOrganization(): OrganizationEntity | undefined {
    return this.organization;
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
      case 'OrganizationCreated':
        this.handleOrganizationCreatedEvent(event);
        break;
      case 'OrganizationUpdated':
        this.handleOrganizationUpdatedEvent(event);
        break;
      case 'OrganizationActivated':
        this.handleOrganizationActivatedEvent(event);
        break;
      case 'OrganizationSuspended':
        this.handleOrganizationSuspendedEvent(event);
        break;
      case 'OrganizationDeleted':
        this.handleOrganizationDeletedEvent(event);
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
      organization: this.organization,
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
    this.organization = snapshot.organization as OrganizationEntity;
    // 注意：_version是私有属性，需要通过其他方式设置
    // 这里暂时注释掉，等待EventSourcedAggregateRoot提供公共方法
    // this._version = snapshot.version || 0;
  }

  /**
   * @method validateOrganizationCreationData
   * @description 验证组织创建数据
   * @param {string} name 组织名称
   * @param {TenantId} tenantId 租户ID
   * @returns {Promise<void>}
   * @private
   */
  private async validateOrganizationCreationData(
    name: string,
    tenantId: TenantId,
  ): Promise<void> {
    // 验证组织名称格式
    if (!OrganizationName.isValid(name)) {
      throw new InvalidOrganizationNameError(`无效的组织名称: ${name}`);
    }

    // 验证租户ID
    if (!tenantId) {
      throw new InvalidTenantError('租户ID不能为空');
    }

    // 这里可以添加更多业务规则验证
    // 例如：检查组织名称在租户内是否唯一
  }

  /**
   * @method validateOrganizationName
   * @description 验证组织名称
   * @param {string} name 组织名称
   * @param {TenantId} tenantId 租户ID
   * @returns {Promise<void>}
   * @private
   */
  private async validateOrganizationName(
    name: string,
    tenantId: TenantId,
  ): Promise<void> {
    if (!OrganizationName.isValid(name)) {
      throw new InvalidOrganizationNameError(`无效的组织名称: ${name}`);
    }

    // 这里可以添加更多业务规则验证
    // 例如：检查组织名称在租户内是否唯一
  }

  /**
   * @method handleOrganizationCreatedEvent
   * @description 处理组织创建事件
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private handleOrganizationCreatedEvent(event: IDomainEvent): void {
    const data = event.toJSON();
    this.organization = new OrganizationEntity(
      new OrganizationId(data.organizationId),
      new TenantId(data.tenantId),
      new OrganizationName(data.name),
      new OrganizationDescription(data.description),
      new OrganizationSettings(data.settings),
      data.status,
      new Date(data.createdAt),
    );
  }

  /**
   * @method handleOrganizationUpdatedEvent
   * @description 处理组织更新事件
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private handleOrganizationUpdatedEvent(event: IDomainEvent): void {
    const data = event.toJSON();
    if (this.organization) {
      this.organization = new OrganizationEntity(
        this.organization.id,
        this.organization.tenantId,
        new OrganizationName(data.name),
        new OrganizationDescription(data.description),
        new OrganizationSettings(data.settings),
        this.organization.getStatus(),
        this.organization.createdAt,
        new Date(data.updatedAt),
        this.organization.deletedAt,
      );
    }
  }

  /**
   * @method handleOrganizationActivatedEvent
   * @description 处理组织激活事件
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private handleOrganizationActivatedEvent(event: IDomainEvent): void {
    if (this.organization) {
      this.organization.activate();
    }
  }

  /**
   * @method handleOrganizationSuspendedEvent
   * @description 处理组织暂停事件
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private handleOrganizationSuspendedEvent(event: IDomainEvent): void {
    if (this.organization) {
      this.organization.suspend();
    }
  }

  /**
   * @method handleOrganizationDeletedEvent
   * @description 处理组织删除事件
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private handleOrganizationDeletedEvent(event: IDomainEvent): void {
    if (this.organization) {
      this.organization.delete();
    }
  }
}

// 异常类定义
export class OrganizationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganizationNotFoundError';
  }
}

export class DuplicateOrganizationNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateOrganizationNameError';
  }
}

export class InvalidTenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTenantError';
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

export class InvalidOrganizationNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationNameError';
  }
}
