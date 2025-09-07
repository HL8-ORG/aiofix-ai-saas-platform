import { EventSourcedAggregateRoot, IDomainEvent } from '@aiofix/core';
import { PlatformId } from '../value-objects/platform-id.vo';
import { PlatformSettings } from '../value-objects/platform-settings.vo';
import { PlatformConfig } from '../value-objects/platform-config.vo';
import { PlatformStatus } from '../enums/platform-status.enum';
import { PlatformCreatedEvent } from '../events/platform-created.event';
import { PlatformUpdatedEvent } from '../events/platform-updated.event';
import { PlatformStatusChangedEvent } from '../events/platform-status-changed.event';
import { PlatformConfigUpdatedEvent } from '../events/platform-config-updated.event';

/**
 * @interface PlatformData
 * @description 平台数据结构
 */
export interface PlatformData {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly status: PlatformStatus;
  readonly settings: PlatformSettings;
  readonly configs: Map<string, PlatformConfig>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
  readonly updatedBy?: string;
}

/**
 * @class PlatformAggregate
 * @description
 * 平台聚合根，负责管理平台相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供平台创建、更新、状态变更等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 平台名称在全局范围内必须唯一
 * 2. 平台状态变更必须遵循预定义的状态机
 * 3. 平台配置必须符合类型约束
 * 4. 平台设置必须通过验证规则
 *
 * @property {PlatformId} id 平台ID
 * @property {string} name 平台名称
 * @property {string} description 平台描述
 * @property {PlatformStatus} status 平台状态
 * @property {PlatformSettings} settings 平台设置
 * @property {Map<string, PlatformConfig>} configs 平台配置
 * @property {Date} createdAt 创建时间
 * @property {Date} updatedAt 更新时间
 * @property {string} createdBy 创建者
 * @property {string} updatedBy 更新者
 *
 * @example
 * ```typescript
 * const platform = new PlatformAggregate();
 * await platform.createPlatform('AIOFIX Platform', 'AI-powered SAAS platform', 'admin-123');
 * // 自动发布 PlatformCreatedEvent
 * ```
 * @since 1.0.0
 */
export class PlatformAggregate extends EventSourcedAggregateRoot {
  private _id!: PlatformId;
  private _name!: string;
  private _description?: string;
  private _status!: PlatformStatus;
  private _settings!: PlatformSettings;
  private _configs!: Map<string, PlatformConfig>;
  private _createdAt!: Date;
  private _updatedAt!: Date;
  private _createdBy!: string;
  private _updatedBy?: string;

  /**
   * 获取平台ID
   *
   * @returns {string} 平台ID
   */
  public get id(): string {
    return this._id.value;
  }

  /**
   * 获取平台名称
   *
   * @returns {string} 平台名称
   */
  public get name(): string {
    return this._name;
  }

  /**
   * 获取平台描述
   *
   * @returns {string | undefined} 平台描述
   */
  public get description(): string | undefined {
    return this._description;
  }

  /**
   * 获取平台状态
   *
   * @returns {PlatformStatus} 平台状态
   */
  public get status(): PlatformStatus {
    return this._status;
  }

  /**
   * 获取平台设置
   *
   * @returns {PlatformSettings} 平台设置
   */
  public get settings(): PlatformSettings {
    return this._settings;
  }

  /**
   * 获取平台配置
   *
   * @returns {Map<string, PlatformConfig>} 平台配置
   */
  public get configs(): Map<string, PlatformConfig> {
    return new Map(this._configs);
  }

  /**
   * 获取创建时间
   *
   * @returns {Date} 创建时间
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取更新时间
   *
   * @returns {Date} 更新时间
   */
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 获取创建者
   *
   * @returns {string} 创建者
   */
  public get createdBy(): string {
    return this._createdBy;
  }

  /**
   * 获取更新者
   *
   * @returns {string | undefined} 更新者
   */
  public get updatedBy(): string | undefined {
    return this._updatedBy;
  }

  /**
   * 创建平台
   *
   * @param {string} name - 平台名称
   * @param {string} description - 平台描述
   * @param {string} createdBy - 创建者ID
   * @param {PlatformSettings} settings - 平台设置
   * @returns {void}
   * @throws {Error} 当平台名称为空或创建者ID无效时抛出
   */
  public createPlatform(
    name: string,
    description: string | undefined,
    createdBy: string,
    settings: PlatformSettings,
  ): void {
    if (!name || name.trim().length === 0) {
      throw new Error('平台名称不能为空');
    }

    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('创建者ID不能为空');
    }

    const now = new Date();
    const platformId = new PlatformId();

    this.apply(
      new PlatformCreatedEvent(
        platformId.value,
        name.trim(),
        description?.trim(),
        PlatformStatus.ACTIVE,
        settings,
        now,
        createdBy,
      ),
    );
  }

  /**
   * 更新平台信息
   *
   * @param {string} name - 新平台名称
   * @param {string} description - 新平台描述
   * @param {string} updatedBy - 更新者ID
   * @returns {void}
   * @throws {Error} 当平台名称为空或更新者ID无效时抛出
   */
  public updatePlatform(
    name: string,
    description: string | undefined,
    updatedBy: string,
  ): void {
    if (!name || name.trim().length === 0) {
      throw new Error('平台名称不能为空');
    }

    if (!updatedBy || updatedBy.trim().length === 0) {
      throw new Error('更新者ID不能为空');
    }

    if (
      name.trim() === this._name &&
      description?.trim() === this._description
    ) {
      return; // 没有变化，不需要更新
    }

    this.apply(
      new PlatformUpdatedEvent(
        this._id.value,
        name.trim(),
        description?.trim(),
        new Date(),
        updatedBy,
      ),
    );
  }

  /**
   * 更新平台状态
   *
   * @param {PlatformStatus} newStatus - 新状态
   * @param {string} updatedBy - 更新者ID
   * @returns {void}
   * @throws {Error} 当状态无效或更新者ID无效时抛出
   */
  public updateStatus(newStatus: PlatformStatus, updatedBy: string): void {
    if (!Object.values(PlatformStatus).includes(newStatus)) {
      throw new Error('无效的平台状态');
    }

    if (!updatedBy || updatedBy.trim().length === 0) {
      throw new Error('更新者ID不能为空');
    }

    if (newStatus === this._status) {
      return; // 状态没有变化
    }

    this.apply(
      new PlatformStatusChangedEvent(
        this._id.value,
        this._status,
        newStatus,
        new Date(),
        updatedBy,
      ),
    );
  }

  /**
   * 更新平台设置
   *
   * @param {PlatformSettings} newSettings - 新设置
   * @param {string} updatedBy - 更新者ID
   * @returns {void}
   * @throws {Error} 当设置无效或更新者ID无效时抛出
   */
  public updateSettings(
    newSettings: PlatformSettings,
    updatedBy: string,
  ): void {
    if (!updatedBy || updatedBy.trim().length === 0) {
      throw new Error('更新者ID不能为空');
    }

    this.apply(
      new PlatformUpdatedEvent(
        this._id.value,
        this._name,
        this._description,
        new Date(),
        updatedBy,
        newSettings,
      ),
    );
  }

  /**
   * 更新平台配置
   *
   * @param {PlatformConfig} config - 配置
   * @param {string} updatedBy - 更新者ID
   * @returns {void}
   * @throws {Error} 当配置无效或更新者ID无效时抛出
   */
  public updateConfig(config: PlatformConfig, updatedBy: string): void {
    if (!updatedBy || updatedBy.trim().length === 0) {
      throw new Error('更新者ID不能为空');
    }

    this.apply(
      new PlatformConfigUpdatedEvent(
        this._id.value,
        config.key,
        config.configValue,
        config.type,
        new Date(),
        updatedBy,
      ),
    );
  }

  /**
   * 获取配置值
   *
   * @param {string} key - 配置键
   * @returns {unknown} 配置值
   */
  public getConfigValue(key: string): unknown {
    return this._configs.get(key)?.configValue;
  }

  /**
   * 检查配置是否存在
   *
   * @param {string} key - 配置键
   * @returns {boolean} 是否存在
   */
  public hasConfig(key: string): boolean {
    return this._configs.has(key);
  }

  /**
   * 处理领域事件
   *
   * @param {IDomainEvent} event - 领域事件
   * @param {boolean} _isFromHistory - 是否来自历史
   * @returns {void}
   * @protected
   */
  protected handleEvent(event: IDomainEvent, _isFromHistory: boolean): void {
    switch (event.eventType) {
      case 'PlatformCreated':
        this.handlePlatformCreated(event as PlatformCreatedEvent);
        break;
      case 'PlatformUpdated':
        this.handlePlatformUpdated(event as PlatformUpdatedEvent);
        break;
      case 'PlatformStatusChanged':
        this.handlePlatformStatusChanged(event as PlatformStatusChangedEvent);
        break;
      case 'PlatformConfigUpdated':
        this.handlePlatformConfigUpdated(event as PlatformConfigUpdatedEvent);
        break;
    }
  }

  /**
   * 处理平台创建事件
   *
   * @param {PlatformCreatedEvent} event - 平台创建事件
   * @private
   */
  private handlePlatformCreated(event: PlatformCreatedEvent): void {
    this._id = new PlatformId(event.platformId);
    this._name = event.name;
    this._description = event.description;
    this._status = event.status;
    this._settings = event.settings;
    this._configs = new Map();
    this._createdAt = event.occurredOn;
    this._updatedAt = event.occurredOn;
    this._createdBy = event.createdBy;
  }

  /**
   * 处理平台更新事件
   *
   * @param {PlatformUpdatedEvent} event - 平台更新事件
   * @private
   */
  private handlePlatformUpdated(event: PlatformUpdatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._updatedAt = event.occurredOn;
    this._updatedBy = event.updatedBy;

    if (event.settings) {
      this._settings = event.settings;
    }
  }

  /**
   * 处理平台状态变更事件
   *
   * @param {PlatformStatusChangedEvent} event - 平台状态变更事件
   * @private
   */
  private handlePlatformStatusChanged(event: PlatformStatusChangedEvent): void {
    this._status = event.newStatus;
    this._updatedAt = event.occurredOn;
    this._updatedBy = event.updatedBy;
  }

  /**
   * 处理平台配置更新事件
   *
   * @param {PlatformConfigUpdatedEvent} event - 平台配置更新事件
   * @private
   */
  private handlePlatformConfigUpdated(event: PlatformConfigUpdatedEvent): void {
    const config = new PlatformConfig({
      key: event.configKey,
      value: event.configValue,
      type: event.configType,
    });

    this._configs.set(event.configKey, config);
    this._updatedAt = event.occurredOn;
    this._updatedBy = event.updatedBy;
  }

  /**
   * 转换为快照
   *
   * @returns {Record<string, unknown>} 快照数据
   * @protected
   */
  protected toSnapshot(): Record<string, unknown> {
    return {
      id: this._id.value,
      name: this._name,
      description: this._description,
      status: this._status,
      settings: this._settings,
      configs: Array.from(this._configs.entries()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      createdBy: this._createdBy,
      updatedBy: this._updatedBy,
    };
  }

  /**
   * 从快照恢复
   *
   * @param {Record<string, unknown>} data - 快照数据
   * @protected
   */
  protected fromSnapshot(data: Record<string, unknown>): void {
    this._id = new PlatformId(data.id as string);
    this._name = data.name as string;
    this._description = data.description as string | undefined;
    this._status = data.status as PlatformStatus;
    this._settings = data.settings as PlatformSettings;
    this._configs = new Map(data.configs as [string, PlatformConfig][]);
    this._createdAt = data.createdAt as Date;
    this._updatedAt = data.updatedAt as Date;
    this._createdBy = data.createdBy as string;
    this._updatedBy = data.updatedBy as string | undefined;
  }
}
