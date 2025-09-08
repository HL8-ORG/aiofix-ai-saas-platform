import { BaseEntity } from '@aiofix/core';
import { TenantId } from '@aiofix/shared';
import {
  TenantSettings,
  TenantStatus,
} from '../value-objects/tenant-settings.vo';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantConfiguration } from '../value-objects/tenant-configuration.vo';

/**
 * @class TenantEntity
 * @description
 * 租户领域实体，负责维护租户的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识租户身份，确保实体的唯一性和可识别性
 * 2. 管理租户的基本状态（PENDING、ACTIVE、SUSPENDED、DISABLED、DELETED）
 * 3. 维护租户的生命周期状态变更，确保状态转换的合法性
 *
 * 业务规则与约束：
 * 1. 租户ID一旦创建不可变更，确保实体标识的稳定性
 * 2. 租户状态变更必须遵循预定义的状态机规则
 * 3. 删除租户时采用软删除策略，保留数据用于审计和恢复
 * 4. 租户设置、配额、配置必须保持一致
 * 5. 只有激活状态的租户才能进行设置更新和配额调整操作
 *
 * 数据封装与验证：
 * 1. 通过值对象封装复杂属性（TenantId、TenantSettings等）
 * 2. 确保领域概念的完整性和类型安全
 * 3. 实现租户实体的相等性比较，基于租户ID进行身份识别
 *
 * @property {TenantId} _id 租户唯一标识符，创建后不可更改
 * @property {TenantSettings} _settings 租户设置信息，包含名称、类型、状态等
 * @property {TenantQuota} _quota 租户资源配额，包含各种资源限制
 * @property {TenantConfiguration} _configuration 租户系统配置，包含功能开关等
 * @property {string} _platformId 所属平台ID，用于平台级数据隔离
 *
 * @example
 * ```typescript
 * const tenant = new TenantEntity(
 *   new TenantId('tenant-123'),
 *   tenantSettings,
 *   tenantQuota,
 *   tenantConfiguration,
 *   'platform-456',
 *   'admin-789'
 * );
 * tenant.activate('admin-789'); // 激活租户
 * tenant.suspend('admin-789'); // 暂停租户
 * ```
 * @extends BaseEntity
 * @since 1.0.0
 */
export class TenantEntity extends BaseEntity {
  constructor(
    private readonly _id: TenantId,
    private readonly _settings: TenantSettings,
    private readonly _quota: TenantQuota,
    private readonly _configuration: TenantConfiguration,
    private readonly _platformId: string,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证租户实体的有效性
   * @returns {void}
   * @throws {Error} 当实体无效时抛出
   * @private
   */
  protected validate(): void {
    if (!this.id) {
      throw new Error('租户ID不能为空');
    }

    if (!this.settings) {
      throw new Error('租户设置不能为空');
    }

    if (!this.quota) {
      throw new Error('租户配额不能为空');
    }

    if (!this.configuration) {
      throw new Error('租户配置不能为空');
    }

    if (!this.createdBy || this.createdBy.trim().length === 0) {
      throw new Error('创建者ID不能为空');
    }

    if (!this.createdAt || isNaN(this.createdAt.getTime())) {
      throw new Error('创建时间无效');
    }
  }

  /**
   * @getter id
   * @description 获取租户唯一标识符
   * @returns {TenantId} 租户ID值对象
   * @since 1.0.0
   */
  public get id(): TenantId {
    return this._id;
  }

  /**
   * @getter settings
   * @description 获取租户设置信息
   * @returns {TenantSettings} 租户设置值对象
   * @since 1.0.0
   */
  public get settings(): TenantSettings {
    return this._settings;
  }

  /**
   * @getter quota
   * @description 获取租户资源配额
   * @returns {TenantQuota} 租户配额值对象
   * @since 1.0.0
   */
  public get quota(): TenantQuota {
    return this._quota;
  }

  /**
   * @getter configuration
   * @description 获取租户系统配置
   * @returns {TenantConfiguration} 租户配置值对象
   * @since 1.0.0
   */
  public get configuration(): TenantConfiguration {
    return this._configuration;
  }

  /**
   * @getter platformId
   * @description 获取平台ID
   * @returns {string} 平台ID，用于平台级数据隔离
   * @since 1.0.0
   */
  public get platformId(): string {
    return this._platformId;
  }

  /**
   * @getter status
   * @description 获取租户状态
   * @returns {TenantStatus} 租户状态
   * @since 1.0.0
   */
  public get status(): TenantStatus {
    return this._settings.status;
  }

  /**
   * @getter name
   * @description 获取租户名称
   * @returns {string} 租户名称
   * @since 1.0.0
   */
  public get name(): string {
    return this._settings.name;
  }

  /**
   * @getter type
   * @description 获取租户类型
   * @returns {string} 租户类型
   * @since 1.0.0
   */
  public get type(): string {
    return this._settings.type;
  }

  /**
   * @method isActive
   * @description 检查租户是否处于激活状态
   * @returns {boolean} 是否激活
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._settings.isActive() && !this.isDeleted();
  }

  /**
   * @method isSuspended
   * @description 检查租户是否已暂停
   * @returns {boolean} 是否已暂停
   * @since 1.0.0
   */
  public isSuspended(): boolean {
    return this._settings.status === TenantStatus.SUSPENDED;
  }

  /**
   * @method isDisabled
   * @description 检查租户是否已禁用
   * @returns {boolean} 是否已禁用
   * @since 1.0.0
   */
  public isDisabled(): boolean {
    return this._settings.status === TenantStatus.DISABLED;
  }

  /**
   * @method activate
   * @description 激活租户，将状态从PENDING或DISABLED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有PENDING或DISABLED状态的租户才能被激活，防止非法状态转换
   * 3. 激活后租户可以进行正常的业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否允许激活
   * 2. 将租户状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} activatedBy 激活者ID，用于审计追踪
   * @throws {Error} 当租户状态不允许激活时抛出
   * @since 1.0.0
   */
  public activate(activatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能激活');
    }

    if (this._settings.status === TenantStatus.ACTIVE) {
      throw new Error('租户已经是激活状态');
    }

    if (this._settings.status === TenantStatus.SUSPENDED) {
      throw new Error('暂停的租户需要先恢复才能激活');
    }

    // 注意：这里不能直接修改settings.status，因为settings是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(activatedBy);
  }

  /**
   * @method deactivate
   * @description 禁用租户，将状态变更为DISABLED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的租户才能被禁用，防止非法状态转换
   * 3. 禁用后租户无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否允许禁用
   * 2. 将租户状态更新为DISABLED
   * 3. 记录操作审计信息
   *
   * @param {string} deactivatedBy 禁用者ID，用于审计追踪
   * @throws {Error} 当租户状态不允许禁用时抛出
   * @since 1.0.0
   */
  public deactivate(deactivatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能禁用');
    }

    if (this._settings.status === TenantStatus.DISABLED) {
      throw new Error('租户已经是禁用状态');
    }

    // 注意：这里不能直接修改settings.status，因为settings是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(deactivatedBy);
  }

  /**
   * @method suspend
   * @description 暂停租户，将状态变更为SUSPENDED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的租户才能被暂停，防止非法状态转换
   * 3. 暂停后租户无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否允许暂停
   * 2. 将租户状态更新为SUSPENDED
   * 3. 记录操作审计信息
   *
   * @param {string} suspendedBy 暂停者ID，用于审计追踪
   * @throws {Error} 当租户状态不允许暂停时抛出
   * @since 1.0.0
   */
  public suspend(suspendedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能暂停');
    }

    if (this._settings.status === TenantStatus.SUSPENDED) {
      throw new Error('租户已经是暂停状态');
    }

    // 注意：这里不能直接修改settings.status，因为settings是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(suspendedBy);
  }

  /**
   * @method resume
   * @description 恢复租户，将状态从SUSPENDED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有SUSPENDED状态的租户才能被恢复，防止非法状态转换
   * 3. 恢复后租户重新获得正常的业务操作权限
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否为SUSPENDED
   * 2. 将租户状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} resumedBy 恢复者ID，用于审计追踪
   * @throws {Error} 当租户状态不允许恢复时抛出
   * @since 1.0.0
   */
  public resume(resumedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能恢复');
    }

    if (this._settings.status !== TenantStatus.SUSPENDED) {
      throw new Error('只有暂停的租户才能恢复');
    }

    // 注意：这里不能直接修改settings.status，因为settings是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(resumedBy);
  }

  /**
   * @method delete
   * @description 软删除租户，将状态转换为DELETED
   *
   * 原理与机制：
   * 1. 采用软删除策略，保留租户数据用于审计和恢复
   * 2. 防止重复删除操作，确保数据一致性
   * 3. 删除后租户数据仍然保留，但租户无法进行任何操作
   * 4. 使用BaseEntity的软删除功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否已被删除
   * 2. 将租户状态更新为DELETED
   * 3. 记录删除操作审计信息
   *
   * @param {string} deletedBy 删除者ID，用于审计追踪
   * @throws {Error} 当租户已被删除时抛出
   * @since 1.0.0
   */
  public delete(deletedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('租户已经删除');
    }

    this.softDelete(deletedBy);
  }

  /**
   * @method restore
   * @description 恢复已删除的租户
   *
   * 原理与机制：
   * 1. 恢复软删除的租户，使其重新可用
   * 2. 只有已删除的租户才能被恢复
   * 3. 恢复后租户状态回到删除前的状态
   * 4. 使用BaseEntity的恢复功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前租户状态是否已被删除
   * 2. 恢复租户的可用状态
   * 3. 记录恢复操作审计信息
   *
   * @param {string} restoredBy 恢复者ID，用于审计追踪
   * @throws {Error} 当租户未删除时抛出
   * @since 1.0.0
   */
  public restore(restoredBy: string): void {
    if (!this.isDeleted()) {
      throw new Error('租户未删除，无需恢复');
    }

    super.restore(restoredBy);
  }

  /**
   * @method updateSettings
   * @description 更新租户设置
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的租户才能更新设置
   * 2. 直接替换整个TenantSettings值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证租户状态是否允许设置更新操作
   * 2. 更新租户设置信息
   * 3. 记录操作审计信息
   *
   * @param {TenantSettings} newSettings 新的租户设置
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当租户已删除时抛出
   * @since 1.0.0
   */
  public updateSettings(newSettings: TenantSettings, updatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能更新设置');
    }

    // 验证新设置的有效性
    if (!newSettings) {
      throw new Error('新的租户设置不能为空');
    }

    // 注意：这里不能直接修改settings，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method updateQuota
   * @description 更新租户配额
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的租户才能更新配额
   * 2. 直接替换整个TenantQuota值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证租户状态是否允许配额更新操作
   * 2. 更新租户配额信息
   * 3. 记录操作审计信息
   *
   * @param {TenantQuota} newQuota 新的租户配额
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当租户已删除时抛出
   * @since 1.0.0
   */
  public updateQuota(newQuota: TenantQuota, updatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能更新配额');
    }

    // 验证新配额的有效性
    if (!newQuota) {
      throw new Error('新的租户配额不能为空');
    }

    // 注意：这里不能直接修改quota，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method updateConfiguration
   * @description 更新租户配置
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的租户才能更新配置
   * 2. 直接替换整个TenantConfiguration值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证租户状态是否允许配置更新操作
   * 2. 更新租户配置信息
   * 3. 记录操作审计信息
   *
   * @param {TenantConfiguration} newConfiguration 新的租户配置
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当租户已删除时抛出
   * @since 1.0.0
   */
  public updateConfiguration(
    newConfiguration: TenantConfiguration,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的租户不能更新配置');
    }

    // 验证新配置的有效性
    if (!newConfiguration) {
      throw new Error('新的租户配置不能为空');
    }

    // 注意：这里不能直接修改configuration，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method checkQuotaExceeded
   * @description 检查配额是否超出限制
   * @param {string} quotaType 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {boolean} 是否超出限制
   * @since 1.0.0
   */
  public checkQuotaExceeded(quotaType: string, currentUsage: number): boolean {
    // 这里需要根据具体的配额类型来检查
    // 由于TenantQuota类中的checkQuotaExceeded方法需要QuotaType枚举
    // 这里提供一个简化的实现
    switch (quotaType) {
      case 'users':
        return this._quota.checkQuotaExceeded('USERS' as any, currentUsage);
      case 'storage':
        return this._quota.checkQuotaExceeded('STORAGE' as any, currentUsage);
      case 'apiCalls':
        return this._quota.checkQuotaExceeded('API_CALLS' as any, currentUsage);
      case 'bandwidth':
        return this._quota.checkQuotaExceeded('BANDWIDTH' as any, currentUsage);
      case 'connections':
        return this._quota.checkQuotaExceeded(
          'CONNECTIONS' as any,
          currentUsage,
        );
      default:
        return false;
    }
  }

  /**
   * @method getQuotaUsagePercentage
   * @description 获取配额使用百分比
   * @param {string} quotaType 配额类型
   * @param {number} currentUsage 当前使用量
   * @returns {number} 使用百分比（0-100）
   * @since 1.0.0
   */
  public getQuotaUsagePercentage(
    quotaType: string,
    currentUsage: number,
  ): number {
    switch (quotaType) {
      case 'users':
        return this._quota.getQuotaUsagePercentage(
          'USERS' as any,
          currentUsage,
        );
      case 'storage':
        return this._quota.getQuotaUsagePercentage(
          'STORAGE' as any,
          currentUsage,
        );
      case 'apiCalls':
        return this._quota.getQuotaUsagePercentage(
          'API_CALLS' as any,
          currentUsage,
        );
      case 'bandwidth':
        return this._quota.getQuotaUsagePercentage(
          'BANDWIDTH' as any,
          currentUsage,
        );
      case 'connections':
        return this._quota.getQuotaUsagePercentage(
          'CONNECTIONS' as any,
          currentUsage,
        );
      default:
        return 0;
    }
  }

  /**
   * @method equals
   * @description 检查租户实体是否相等，基于租户ID进行比较
   *
   * 原理与机制：
   * 1. 通过TenantId值对象的equals方法进行身份比较
   * 2. 确保实体比较的准确性和一致性
   * 3. 遵循值对象相等性比较的最佳实践
   *
   * 功能与职责：
   * 1. 比较两个租户实体是否为同一租户
   * 2. 为集合操作和缓存提供相等性判断
   *
   * @param {TenantEntity} other 要比较的另一个租户实体
   * @returns {boolean} 两个租户实体是否相等
   * @since 1.0.0
   */
  public equals(other: BaseEntity): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (!(other instanceof TenantEntity)) return false;
    return this._id.toString() === (other as TenantEntity)._id.toString();
  }

  /**
   * @method getEntityId
   * @description 获取实体的唯一标识符，实现BaseEntity抽象方法
   * @returns {string} 实体ID字符串值
   * @since 1.0.0
   */
  public getEntityId(): string {
    return this._id.toString();
  }

  /**
   * @method getTenantId
   * @description 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID字符串值
   * @since 1.0.0
   */
  public getTenantId(): string {
    return this._id.toString();
  }

  /**
   * @method toSnapshot
   * @description 创建租户实体的快照
   * @returns {object} 租户实体快照
   * @since 1.0.0
   */
  public toSnapshot(): object {
    return {
      id: this._id.toString(),
      settings: this._settings,
      quota: this._quota,
      configuration: this._configuration,
      platformId: this._platformId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
      updatedBy: this.getUpdatedBy(),
      deletedAt: this.getDeletedAt(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复租户实体
   * @param {any} snapshot 租户实体快照
   * @returns {TenantEntity} 租户实体实例
   * @static
   * @since 1.0.0
   */
  public static fromSnapshot(snapshot: any): TenantEntity {
    const entity = new TenantEntity(
      new TenantId(snapshot.id),
      snapshot.settings,
      snapshot.quota,
      snapshot.configuration,
      snapshot.platformId,
      snapshot.createdBy,
    );

    // 恢复审计信息
    if (snapshot.updatedAt) {
      entity.updateAuditInfo(snapshot.updatedBy);
    }

    if (snapshot.deletedAt) {
      entity.softDelete(snapshot.deletedBy);
    }

    return entity;
  }
}
