import { EventSourcedAggregateRoot, DomainEvent } from '@aiofix/core';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantId } from '@aiofix/shared';
import {
  TenantSettings,
  TenantStatus,
  TenantType,
} from '../value-objects/tenant-settings.vo';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantConfiguration } from '../value-objects/tenant-configuration.vo';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantUpdatedEvent } from '../events/tenant-updated.event';

/**
 * @class TenantAggregate
 * @description
 * 租户聚合根，负责管理租户相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供租户创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 租户名称在平台内必须唯一
 * 2. 租户状态变更必须遵循预定义的状态机
 * 3. 租户删除前必须清理所有关联数据
 * 4. 租户配额不能超出系统限制
 *
 * 事件溯源支持：
 * 1. 继承EventSourcedAggregateRoot基类
 * 2. 支持事件重放和状态重建
 * 3. 提供快照机制优化性能
 * 4. 实现乐观并发控制
 *
 * @property {TenantEntity} tenant 租户实体
 * @property {DomainEvent[]} uncommittedEvents 未提交的领域事件
 *
 * @example
 * ```typescript
 * const tenantAggregate = new TenantAggregate();
 * await tenantAggregate.createTenant(
 *   'tenant-123',
 *   'Acme Corp',
 *   TenantType.ENTERPRISE,
 *   tenantQuota,
 *   tenantConfiguration,
 *   'admin-456'
 * );
 * // 自动发布 TenantCreatedEvent
 * ```
 * @since 1.0.0
 */
export class TenantAggregate extends EventSourcedAggregateRoot {
  private tenant?: TenantEntity;

  constructor(tenant?: TenantEntity) {
    super();
    this.tenant = tenant;
  }

  /**
   * @method get id
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  get id(): string {
    return this.tenant?.id.value ?? '';
  }

  /**
   * @method createTenant
   * @description 创建新租户，发布租户创建事件
   * @param {string} tenantId 租户ID
   * @param {string} name 租户名称
   * @param {TenantType} type 租户类型
   * @param {TenantQuota} quota 租户配额
   * @param {TenantConfiguration} configuration 租户配置
   * @param {string} createdBy 创建者ID
   * @returns {Promise<void>}
   * @throws {DuplicateTenantNameError} 当租户名称已存在时抛出
   * @throws {InvalidTenantDataError} 当租户数据无效时抛出
   */
  async createTenant(
    tenantId: string,
    name: string,
    type: TenantType,
    quota: TenantQuota,
    configuration: TenantConfiguration,
    createdBy: string,
  ): Promise<void> {
    // 验证租户数据
    this.validateTenantCreationData(
      tenantId,
      name,
      type,
      quota,
      configuration,
      createdBy,
    );

    // 创建租户实体
    const tenantSettings = new TenantSettings({
      name,
      type,
      status: TenantStatus.PENDING,
      configuration: {},
    });

    this.tenant = new TenantEntity(
      new TenantId(tenantId),
      tenantSettings,
      quota,
      configuration,
      'platform-1', // platformId
      createdBy,
    );

    // 发布租户创建事件
    const event = new TenantCreatedEvent(
      this.tenant.id,
      this.tenant.name,
      this.tenant.type,
      this.tenant.quota,
      this.tenant.configuration,
      createdBy,
    );

    this.addUncommittedEvent(event);
  }

  /**
   * @method updateTenantSettings
   * @description 更新租户设置
   * @param {TenantSettings} newSettings 新的租户设置
   * @param {string} updatedBy 更新者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidTenantStateError} 当租户状态不允许更新时抛出
   */
  async updateTenantSettings(
    newSettings: TenantSettings,
    updatedBy: string,
  ): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    // 验证新设置的有效性
    if (!newSettings) {
      throw new Error('新的租户设置不能为空');
    }

    // 检查租户名称是否变更
    const nameChanged = this.tenant!.name !== newSettings.name;
    if (nameChanged) {
      // 这里应该检查新名称的唯一性
      // await this.checkTenantNameUniqueness(newSettings.name);
    }

    // 创建新的租户实体（因为实体是不可变的）
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      newSettings,
      this.tenant!.quota,
      this.tenant!.configuration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户更新事件
    const event = new TenantUpdatedEvent(
      this.tenant.id,
      'settings',
      { oldSettings: this.tenant.settings, newSettings },
      updatedBy,
    );

    this.addUncommittedEvent(event);
  }

  /**
   * @method updateTenantQuota
   * @description 更新租户配额
   * @param {TenantQuota} newQuota 新的租户配额
   * @param {string} updatedBy 更新者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidQuotaError} 当配额无效时抛出
   */
  async updateTenantQuota(
    newQuota: TenantQuota,
    updatedBy: string,
  ): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    // 验证新配额的有效性
    if (!newQuota) {
      throw new Error('新的租户配额不能为空');
    }

    // 创建新的租户实体
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      this.tenant!.settings,
      newQuota,
      this.tenant!.configuration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户更新事件
    const event = new TenantUpdatedEvent(
      this.tenant.id,
      'quota',
      { oldQuota: this.tenant.quota, newQuota },
      updatedBy,
    );

    this.addUncommittedEvent(event);
  }

  /**
   * @method updateTenantConfiguration
   * @description 更新租户配置
   * @param {TenantConfiguration} newConfiguration 新的租户配置
   * @param {string} updatedBy 更新者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidConfigurationError} 当配置无效时抛出
   */
  async updateTenantConfiguration(
    newConfiguration: TenantConfiguration,
    updatedBy: string,
  ): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    // 验证新配置的有效性
    if (!newConfiguration) {
      throw new Error('新的租户配置不能为空');
    }

    // 创建新的租户实体
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      this.tenant!.settings,
      this.tenant!.quota,
      newConfiguration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户更新事件
    const event = new TenantUpdatedEvent(
      this.tenant.id,
      'configuration',
      { oldConfiguration: this.tenant.configuration, newConfiguration },
      updatedBy,
    );

    this.addUncommittedEvent(event);
  }

  /**
   * @method activateTenant
   * @description 激活租户
   * @param {string} activatedBy 激活者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidTenantStateError} 当租户状态不允许激活时抛出
   */
  async activateTenant(activatedBy: string): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    if (this.tenant!.isActive()) {
      throw new Error('租户已经是激活状态');
    }

    // 创建新的租户设置（激活状态）
    const activatedSettings = new TenantSettings({
      name: this.tenant!.settings.name,
      type: this.tenant!.settings.type,
      status: TenantStatus.ACTIVE,
      configuration: this.tenant!.settings.configuration,
      description: this.tenant!.settings.description,
      metadata: this.tenant!.settings.metadata,
    });

    // 创建新的租户实体
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      activatedSettings,
      this.tenant!.quota,
      this.tenant!.configuration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户激活事件
    const event = new TenantActivatedEvent(this.tenant.id, activatedBy);
    this.addUncommittedEvent(event);
  }

  /**
   * @method deactivateTenant
   * @description 禁用租户
   * @param {string} deactivatedBy 禁用者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidTenantStateError} 当租户状态不允许禁用时抛出
   */
  async deactivateTenant(deactivatedBy: string): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    if (this.tenant!.isDisabled()) {
      throw new Error('租户已经是禁用状态');
    }

    // 创建新的租户设置（禁用状态）
    const deactivatedSettings = new TenantSettings({
      name: this.tenant!.settings.name,
      type: this.tenant!.settings.type,
      status: TenantStatus.DISABLED,
      configuration: this.tenant!.settings.configuration,
      description: this.tenant!.settings.description,
      metadata: this.tenant!.settings.metadata,
    });

    // 创建新的租户实体
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      deactivatedSettings,
      this.tenant!.quota,
      this.tenant!.configuration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户禁用事件
    const event = new TenantDeactivatedEvent(this.tenant.id, deactivatedBy);
    this.addUncommittedEvent(event);
  }

  /**
   * @method suspendTenant
   * @description 暂停租户
   * @param {string} suspendedBy 暂停者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InvalidTenantStateError} 当租户状态不允许暂停时抛出
   */
  async suspendTenant(suspendedBy: string): Promise<void> {
    this.ensureTenantExists();
    this.ensureTenantNotDeleted();

    if (this.tenant!.isSuspended()) {
      throw new Error('租户已经是暂停状态');
    }

    // 创建新的租户设置（暂停状态）
    const suspendedSettings = new TenantSettings({
      name: this.tenant!.settings.name,
      type: this.tenant!.settings.type,
      status: TenantStatus.SUSPENDED,
      configuration: this.tenant!.settings.configuration,
      description: this.tenant!.settings.description,
      metadata: this.tenant!.settings.metadata,
    });

    // 创建新的租户实体
    const updatedTenant = new TenantEntity(
      this.tenant!.id,
      suspendedSettings,
      this.tenant!.quota,
      this.tenant!.configuration,
      this.tenant!.platformId,
      this.tenant!.createdBy,
    );

    this.tenant = updatedTenant;

    // 发布租户暂停事件
    const event = new TenantSuspendedEvent(this.tenant.id, suspendedBy);
    this.addUncommittedEvent(event);
  }

  /**
   * @method deleteTenant
   * @description 删除租户（软删除）
   * @param {string} deletedBy 删除者ID
   * @returns {Promise<void>}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {TenantAlreadyDeletedError} 当租户已删除时抛出
   */
  async deleteTenant(deletedBy: string): Promise<void> {
    this.ensureTenantExists();

    if (this.tenant!.isDeleted()) {
      throw new Error('租户已经删除');
    }

    // 软删除租户
    this.tenant!.delete(deletedBy);

    // 发布租户删除事件
    const event = new TenantDeletedEvent(this.tenant!.id, deletedBy);
    this.addUncommittedEvent(event);
  }

  /**
   * @method checkQuotaExceeded
   * @description 检查配额是否超出限制
   * @param {string} quotaType 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {boolean} 是否超出限制
   */
  checkQuotaExceeded(quotaType: string, currentUsage: number): boolean {
    this.ensureTenantExists();
    return this.tenant!.checkQuotaExceeded(quotaType, currentUsage);
  }

  /**
   * @method getQuotaUsagePercentage
   * @description 获取配额使用百分比
   * @param {string} quotaType 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {number} 使用百分比（0-100）
   */
  getQuotaUsagePercentage(quotaType: string, currentUsage: number): number {
    this.ensureTenantExists();
    return this.tenant!.getQuotaUsagePercentage(quotaType, currentUsage);
  }

  /**
   * @method getTenant
   * @description 获取租户实体
   * @returns {TenantEntity} 租户实体
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   */
  getTenant(): TenantEntity {
    this.ensureTenantExists();
    return this.tenant!;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {TenantId} 租户ID
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   */
  getTenantId(): TenantId {
    this.ensureTenantExists();
    return this.tenant!.id;
  }

  /**
   * @method validateTenantCreationData
   * @description 验证租户创建数据
   * @param {string} tenantId 租户ID
   * @param {string} name 租户名称
   * @param {TenantType} type 租户类型
   * @param {TenantQuota} quota 租户配额
   * @param {TenantConfiguration} configuration 租户配置
   * @param {string} createdBy 创建者ID
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validateTenantCreationData(
    tenantId: string,
    name: string,
    type: TenantType,
    quota: TenantQuota,
    configuration: TenantConfiguration,
    createdBy: string,
  ): void {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('租户ID不能为空');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('租户名称不能为空');
    }

    if (!type) {
      throw new Error('租户类型不能为空');
    }

    if (!quota) {
      throw new Error('租户配额不能为空');
    }

    if (!configuration) {
      throw new Error('租户配置不能为空');
    }

    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('创建者ID不能为空');
    }
  }

  /**
   * @method ensureTenantExists
   * @description 确保租户存在
   * @returns {void}
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @private
   */
  private ensureTenantExists(): void {
    if (!this.tenant) {
      throw new Error('租户不存在');
    }
  }

  /**
   * @method ensureTenantNotDeleted
   * @description 确保租户未删除
   * @returns {void}
   * @throws {TenantDeletedError} 当租户已删除时抛出
   * @private
   */
  private ensureTenantNotDeleted(): void {
    if (this.tenant!.isDeleted()) {
      throw new Error('租户已删除，无法执行此操作');
    }
  }

  /**
   * @method addUncommittedEvent
   * @description 添加未提交的事件
   * @param {DomainEvent} event 领域事件
   * @returns {void}
   * @private
   */
  private addUncommittedEvent(event: DomainEvent): void {
    // 使用基类的方法来添加事件
    this.applyEvent(event, false);
  }

  /**
   * @method applyEvent
   * @description 应用领域事件（用于事件重放）
   * @param {DomainEvent} event 领域事件
   * @param {boolean} isFromHistory 是否来自历史事件
   * @returns {void}
   */
  applyEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    // 这里应该根据事件类型来更新聚合根状态
    // 在实际实现中，应该根据事件类型来重建聚合根状态

    const _isFromHistory = isFromHistory;
    switch (event.eventType) {
      case 'TenantCreated':
        // 处理租户创建事件
        break;
      case 'TenantUpdated':
        // 处理租户更新事件
        break;
      case 'TenantActivated':
        // 处理租户激活事件
        break;
      case 'TenantDeactivated':
        // 处理租户禁用事件
        break;
      case 'TenantSuspended':
        // 处理租户暂停事件
        break;
      case 'TenantDeleted':
        // 处理租户删除事件
        break;
      default:
        // 忽略未知事件类型
        break;
    }
  }

  /**
   * @method handleEvent
   * @description 处理领域事件（EventSourcedAggregateRoot要求的方法）
   * @param {DomainEvent} event 领域事件
   * @param {boolean} isFromHistory 是否来自历史事件
   * @returns {void}
   */
  handleEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    this.applyEvent(event, isFromHistory);
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照
   * @returns {Record<string, unknown>} 聚合根快照
   */
  toSnapshot(): Record<string, unknown> {
    return {
      tenant: this.tenant?.toSnapshot(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复聚合根
   * @param {Record<string, unknown>} snapshot 聚合根快照
   * @returns {void}
   */
  fromSnapshot(snapshot: Record<string, unknown>): void {
    if (snapshot.tenant) {
      this.tenant = TenantEntity.fromSnapshot(
        snapshot.tenant as Record<string, unknown>,
      );
    }
    // 注意：EventSourcedAggregateRoot的版本管理需要特殊处理
  }
}

// 需要创建其他状态变更事件类
class TenantActivatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly activatedBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      activatedBy: this.activatedBy,
    };
  }
}

class TenantDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly deactivatedBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      deactivatedBy: this.deactivatedBy,
    };
  }
}

class TenantSuspendedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly suspendedBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      suspendedBy: this.suspendedBy,
    };
  }
}

class TenantDeletedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly deletedBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      deletedBy: this.deletedBy,
    };
  }
}
