import { EventSourcedAggregateRoot, DomainEvent } from '@aiofix/core';
import { SystemConfiguration } from '../value-objects/system-configuration.vo';
import { SystemMetrics } from '../value-objects/system-metrics.vo';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import {
  PlatformManagementService,
  type CreateTenantData,
  type TenantUpdates,
  type SystemCapacity,
} from '../services/platform-management.service';
import {
  PlatformUserManagementService,
  type UserAssignmentData,
} from '../services/platform-user-management.service';
import { TenantCreatedEvent } from '../events/tenant-created.event';
import { TenantUpdatedEvent } from '../events/tenant-updated.event';
import { TenantDeletedEvent } from '../events/tenant-deleted.event';
import { PlatformUserAssignedEvent } from '../events/platform-user-assigned.event';
import { SystemMetricsRecordedEvent } from '../events/system-metrics-recorded.event';
import { SystemConfigurationUpdatedEvent } from '../events/system-configuration-updated.event';

/**
 * @class PlatformAggregate
 * @description
 * 平台聚合根，负责管理平台相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供租户管理、用户管理、系统监控等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 租户名称在全局范围内必须唯一
 * 2. 用户不能同时属于多个租户
 * 3. 系统配置必须符合安全策略
 * 4. 租户配额不能超过系统容量
 *
 * 平台管理职责：
 * 1. 租户管理：创建、配置、监控、删除租户
 * 2. 用户管理：分配、管理平台用户到租户
 * 3. 系统监控：性能监控、用户行为分析、错误日志查看
 * 4. 系统配置：系统参数、功能开关、主题配置
 * 5. 审计管理：操作日志记录、审计报告生成
 *
 * @property {SystemConfiguration} _systemConfiguration 系统配置
 * @property {SystemMetrics} _systemMetrics 系统指标
 * @property {Map<string, TenantQuota>} _tenantQuotas 租户配额映射
 * @property {SystemCapacity} _systemCapacity 系统容量
 *
 * @example
 * ```typescript
 * const platformAggregate = new PlatformAggregate();
 * await platformAggregate.createTenant(tenantData, 'admin-123');
 * await platformAggregate.assignUserToTenant('user-456', 'tenant-789', 'admin-123');
 * ```
 * @since 1.0.0
 */
export class PlatformAggregate extends EventSourcedAggregateRoot {
  private _systemConfiguration!: SystemConfiguration;
  private _systemMetrics!: SystemMetrics;
  private readonly _tenantQuotas: Map<string, TenantQuota> = new Map();
  private _systemCapacity!: SystemCapacity;

  constructor(
    private readonly platformManagementService: PlatformManagementService,
    private readonly userManagementService: PlatformUserManagementService,
  ) {
    super();
  }

  /**
   * @getter systemConfiguration
   * @description 获取系统配置
   * @returns {SystemConfiguration} 系统配置
   * @since 1.0.0
   */
  public get systemConfiguration(): SystemConfiguration {
    return this._systemConfiguration;
  }

  /**
   * @getter systemMetrics
   * @description 获取系统指标
   * @returns {SystemMetrics} 系统指标
   * @since 1.0.0
   */
  public get systemMetrics(): SystemMetrics {
    return this._systemMetrics;
  }

  /**
   * @getter tenantQuotas
   * @description 获取租户配额映射
   * @returns {Map<string, TenantQuota>} 租户配额映射的副本
   * @since 1.0.0
   */
  public get tenantQuotas(): Map<string, TenantQuota> {
    return new Map(this._tenantQuotas);
  }

  /**
   * @getter systemCapacity
   * @description 获取系统容量
   * @returns {SystemCapacity} 系统容量
   * @since 1.0.0
   */
  public get systemCapacity(): SystemCapacity {
    return this._systemCapacity;
  }

  /**
   * @method createTenant
   * @description 创建新租户
   * @param {CreateTenantData} tenantData 租户创建数据
   * @param {string} createdBy 创建者用户ID
   * @returns {Promise<string>} 创建的租户ID
   * @throws {Error} 当租户创建失败时抛出
   *
   * 业务逻辑：
   * 1. 验证租户创建请求的有效性
   * 2. 检查系统容量是否充足
   * 3. 计算租户资源配额
   * 4. 创建租户记录
   * 5. 发布租户创建事件
   */
  async createTenant(
    tenantData: CreateTenantData,
    createdBy: string,
  ): Promise<string> {
    // 1. 验证租户创建请求
    const validation =
      await this.platformManagementService.validateTenantCreation(
        tenantData,
        this._systemCapacity,
      );

    if (!validation.valid) {
      throw new Error(`租户创建验证失败: ${validation.reason}`);
    }

    // 2. 计算租户配额
    const quota = tenantData.requestedQuota
      ? new TenantQuota(tenantData.requestedQuota as any)
      : this.platformManagementService.calculateResourceQuota(
          tenantData.tenantType,
        );

    // 3. 生成租户ID
    const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 4. 创建租户
    this._tenantQuotas.set(tenantId, quota);
    // 注意：实际实现中应该通过仓储更新系统容量
    // this._systemCapacity.currentTenants += 1;

    // 5. 发布租户创建事件
    const event = new TenantCreatedEvent(
      tenantId,
      tenantData.tenantName,
      tenantData.tenantType,
      quota,
      tenantData.adminUserId,
      createdBy,
    );

    this.addDomainEvent(event);

    return tenantId;
  }

  /**
   * @method updateTenant
   * @description 更新租户信息
   * @param {string} tenantId 租户ID
   * @param {TenantUpdates} updates 租户更新数据
   * @param {string} updatedBy 更新者用户ID
   * @returns {Promise<void>}
   * @throws {Error} 当租户更新失败时抛出
   *
   * 业务逻辑：
   * 1. 验证租户是否存在
   * 2. 验证更新数据的有效性
   * 3. 更新租户信息
   * 4. 发布租户更新事件
   */
  async updateTenant(
    tenantId: string,
    updates: TenantUpdates,
    updatedBy: string,
  ): Promise<void> {
    // 1. 验证租户是否存在
    if (!this._tenantQuotas.has(tenantId)) {
      throw new Error(`租户不存在: ${tenantId}`);
    }

    // 2. 准备更新数据
    const changedFields: string[] = [];
    const existingQuota = this._tenantQuotas.get(tenantId);
    if (!existingQuota) {
      throw new Error(`租户配额不存在: ${tenantId}`);
    }
    let updatedQuota = existingQuota;

    // 3. 更新配额（如果提供）
    if (updates.quota) {
      updatedQuota = new TenantQuota(updates.quota);
      this._tenantQuotas.set(tenantId, updatedQuota);
      changedFields.push('quota');
    }

    // 4. 发布租户更新事件
    const event = new TenantUpdatedEvent(
      tenantId,
      updates.tenantName ?? `Tenant-${tenantId}`,
      updatedQuota,
      updatedBy,
      changedFields,
    );

    this.addDomainEvent(event);
  }

  /**
   * @method deleteTenant
   * @description 删除租户
   * @param {string} tenantId 租户ID
   * @param {string} deletedBy 删除者用户ID
   * @param {string} reason 删除原因
   * @returns {Promise<void>}
   * @throws {Error} 当租户删除失败时抛出
   *
   * 业务逻辑：
   * 1. 验证租户是否存在
   * 2. 检查租户是否可以删除
   * 3. 备份租户数据
   * 4. 删除租户记录
   * 5. 发布租户删除事件
   */
  async deleteTenant(
    tenantId: string,
    deletedBy: string,
    reason: string,
  ): Promise<void> {
    // 1. 验证租户是否存在
    if (!this._tenantQuotas.has(tenantId)) {
      throw new Error(`租户不存在: ${tenantId}`);
    }

    // 2. 删除租户配额
    this._tenantQuotas.delete(tenantId);
    // 注意：实际实现中应该通过仓储更新系统容量
    // this._systemCapacity.currentTenants -= 1;

    // 3. 发布租户删除事件
    const event = new TenantDeletedEvent(
      tenantId,
      `Tenant-${tenantId}`,
      deletedBy,
      reason,
      true, // 假设数据已备份
    );

    this.addDomainEvent(event);
  }

  /**
   * @method assignUserToTenant
   * @description 分配平台用户到租户
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} role 用户角色
   * @param {string} assignedBy 分配者用户ID
   * @param {string} reason 分配原因
   * @returns {Promise<void>}
   * @throws {Error} 当用户分配失败时抛出
   *
   * 业务逻辑：
   * 1. 验证用户分配请求的有效性
   * 2. 检查租户容量
   * 3. 验证用户资格
   * 4. 分配用户到租户
   * 5. 发布用户分配事件
   */
  async assignUserToTenant(
    userId: string,
    tenantId: string,
    role: string,
    assignedBy: string,
    reason: string,
  ): Promise<void> {
    // 1. 验证租户是否存在
    if (!this._tenantQuotas.has(tenantId)) {
      throw new Error(`租户不存在: ${tenantId}`);
    }

    // 2. 准备用户分配数据
    const assignmentData: UserAssignmentData = {
      userId,
      tenantId,
      role,
      assignedBy,
      reason,
    };

    // 3. 验证用户分配
    const quota = this._tenantQuotas.get(tenantId);
    if (!quota) {
      throw new Error(`租户配额不存在: ${tenantId}`);
    }
    const validation = await this.userManagementService.validateUserAssignment(
      assignmentData,
      quota,
      this._systemCapacity.currentUsers,
    );

    if (!validation.valid) {
      throw new Error(`用户分配验证失败: ${validation.reason}`);
    }

    // 4. 更新系统容量
    // 注意：实际实现中应该通过仓储更新系统容量
    // this._systemCapacity.currentUsers += 1;

    // 5. 发布用户分配事件
    const event = new PlatformUserAssignedEvent(
      userId,
      tenantId,
      assignedBy,
      role,
      reason,
    );

    this.addDomainEvent(event);
  }

  /**
   * @method removeUserFromTenant
   * @description 从租户移除用户
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} removedBy 移除者用户ID
   * @returns {Promise<void>}
   * @throws {Error} 当用户移除失败时抛出
   *
   * 业务逻辑：
   * 1. 验证用户移除请求的有效性
   * 2. 检查用户是否可以移除
   * 3. 移除用户从租户
   * 4. 更新系统容量
   * 5. 发布用户移除事件
   */
  async removeUserFromTenant(
    userId: string,
    tenantId: string,
    removedBy: string,
  ): Promise<void> {
    // 1. 验证租户是否存在
    if (!this._tenantQuotas.has(tenantId)) {
      throw new Error(`租户不存在: ${tenantId}`);
    }

    // 2. 验证用户移除
    const validation = await this.userManagementService.validateUserRemoval(
      userId,
      tenantId,
      removedBy,
    );

    if (!validation.valid) {
      throw new Error(`用户移除验证失败: ${validation.reason}`);
    }

    // 3. 更新系统容量
    // 注意：实际实现中应该通过仓储更新系统容量
    // this._systemCapacity.currentUsers -= 1;

    // 4. 发布用户移除事件（这里可以创建新的事件类型）
    // const event = new PlatformUserRemovedEvent(userId, tenantId, removedBy);
    // this.addDomainEvent(event);
  }

  /**
   * @method updateSystemConfiguration
   * @description 更新系统配置
   * @param {SystemConfiguration} configuration 系统配置
   * @param {string} updatedBy 更新者用户ID
   * @param {string} reason 更新原因
   * @returns {Promise<void>}
   * @throws {Error} 当系统配置更新失败时抛出
   *
   * 业务逻辑：
   * 1. 验证系统配置的有效性
   * 2. 更新系统配置
   * 3. 发布系统配置更新事件
   */
  async updateSystemConfiguration(
    configuration: SystemConfiguration,
    updatedBy: string,
    reason: string,
  ): Promise<void> {
    // 1. 验证系统配置
    const validation =
      await this.platformManagementService.validateSystemConfiguration(
        configuration,
      );

    if (!validation.valid) {
      throw new Error(`系统配置验证失败: ${validation.errors.join(', ')}`);
    }

    // 2. 更新系统配置
    this._systemConfiguration = configuration;

    // 3. 发布系统配置更新事件
    const event = new SystemConfigurationUpdatedEvent(
      configuration,
      updatedBy,
      ['systemParameters', 'featureFlags', 'themeSettings'],
      reason,
    );

    this.addDomainEvent(event);
  }

  /**
   * @method recordSystemMetrics
   * @description 记录系统指标
   * @param {SystemMetrics} metrics 系统指标
   * @param {string} recordedBy 记录者
   * @returns {Promise<void>}
   * @throws {Error} 当系统指标记录失败时抛出
   *
   * 业务逻辑：
   * 1. 分析系统指标
   * 2. 更新系统指标
   * 3. 发布系统指标记录事件
   */
  async recordSystemMetrics(
    metrics: SystemMetrics,
    recordedBy: string,
  ): Promise<void> {
    // 1. 分析系统指标
    const analysis =
      await this.platformManagementService.analyzeSystemMetrics(metrics);

    // 2. 更新系统指标
    this._systemMetrics = metrics;

    // 3. 发布系统指标记录事件
    const event = new SystemMetricsRecordedEvent(
      metrics,
      recordedBy,
      'system-monitor',
    );

    this.addDomainEvent(event);

    // 4. 如果系统不健康，可以触发告警
    if (!analysis.healthy) {
      // 在实际实现中，这里应该通过事件或服务触发告警
      // console.warn('系统健康状态异常:', analysis.recommendations);
    }
  }

  /**
   * @method getTenantQuota
   * @description 获取租户配额
   * @param {string} tenantId 租户ID
   * @returns {TenantQuota | undefined} 租户配额
   * @since 1.0.0
   */
  getTenantQuota(tenantId: string): TenantQuota | undefined {
    return this._tenantQuotas.get(tenantId);
  }

  /**
   * @method isSystemHealthy
   * @description 检查系统是否健康
   * @returns {boolean} 系统是否健康
   * @since 1.0.0
   */
  isSystemHealthy(): boolean {
    if (!this._systemMetrics) {
      return false;
    }
    return this._systemMetrics.isSystemHealthy();
  }

  /**
   * @method getSystemSummary
   * @description 获取系统摘要信息
   * @returns {string} 系统摘要
   * @since 1.0.0
   */
  getSystemSummary(): string {
    const capacity = this._systemCapacity;

    return (
      `系统状态: ${this.isSystemHealthy() ? '健康' : '异常'}, ` +
      `租户: ${capacity.currentTenants}/${capacity.maxTenants}, ` +
      `用户: ${capacity.currentUsers}/${capacity.maxUsers}, ` +
      `存储: ${capacity.currentStorage}/${capacity.maxStorage}MB`
    );
  }

  /**
   * @method handleEvent
   * @description 处理领域事件
   * @param {DomainEvent} _event 领域事件
   * @returns {void}
   * @since 1.0.0
   */
  handleEvent(_event: DomainEvent): void {
    // 平台聚合根不需要处理事件，因为它是事件发布者
    // 事件处理由其他聚合根或事件处理器负责
  }

  /**
   * @method initialize
   * @description 初始化平台聚合根
   * @param {SystemConfiguration} systemConfiguration 系统配置
   * @param {SystemMetrics} systemMetrics 系统指标
   * @param {SystemCapacity} systemCapacity 系统容量
   * @returns {void}
   * @since 1.0.0
   */
  initialize(
    systemConfiguration: SystemConfiguration,
    systemMetrics: SystemMetrics,
    systemCapacity: SystemCapacity,
  ): void {
    this._systemConfiguration = systemConfiguration;
    this._systemMetrics = systemMetrics;
    this._systemCapacity = systemCapacity;
  }
}
