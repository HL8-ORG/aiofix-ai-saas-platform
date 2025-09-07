import { ValueObject } from '@aiofix/core';

/**
 * 租户设置数据接口
 */
export interface TenantSettingsData {
  /** 租户名称 */
  name: string;
  /** 租户描述 */
  description?: string;
  /** 租户类型 */
  type: TenantType;
  /** 租户状态 */
  status: TenantStatus;
  /** 租户配置 */
  configuration: Record<string, unknown>;
  /** 租户元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 租户类型枚举
 */
export enum TenantType {
  /** 企业租户 */
  ENTERPRISE = 'ENTERPRISE',
  /** 社群租户 */
  COMMUNITY = 'COMMUNITY',
  /** 团队租户 */
  TEAM = 'TEAM',
  /** 个人租户 */
  PERSONAL = 'PERSONAL',
}

/**
 * 租户状态枚举
 */
export enum TenantStatus {
  /** 待激活 */
  PENDING = 'PENDING',
  /** 激活 */
  ACTIVE = 'ACTIVE',
  /** 禁用 */
  DISABLED = 'DISABLED',
  /** 暂停 */
  SUSPENDED = 'SUSPENDED',
  /** 已删除 */
  DELETED = 'DELETED',
}

/**
 * @class TenantSettings
 * @description
 * 租户设置值对象，封装租户配置信息的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 租户设置一旦创建不可变更
 * 2. 租户名称不能为空且长度限制
 * 3. 租户类型必须是预定义的有效值
 * 4. 租户状态必须符合状态机规则
 *
 * 相等性判断：
 * 1. 基于租户设置的标准化值进行相等性比较
 * 2. 忽略配置和元数据的顺序差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装租户类型和状态验证逻辑
 * 2. 提供租户设置标准化方法
 * 3. 隐藏租户配置细节
 *
 * @property {string} name 租户名称
 * @property {string} description 租户描述
 * @property {TenantType} type 租户类型
 * @property {TenantStatus} status 租户状态
 * @property {Record<string, unknown>} configuration 租户配置
 * @property {Record<string, unknown>} metadata 租户元数据
 *
 * @example
 * ```typescript
 * const settings = new TenantSettings({
 *   name: 'Acme Corp',
 *   type: TenantType.ENTERPRISE,
 *   status: TenantStatus.ACTIVE,
 *   configuration: { theme: 'dark' }
 * });
 * ```
 * @since 1.0.0
 */
export class TenantSettings extends ValueObject<TenantSettingsData> {
  constructor(data: TenantSettingsData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证租户设置数据的有效性
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.value.name || this.value.name.trim().length === 0) {
      throw new Error('租户名称不能为空');
    }

    if (this.value.name.length > 100) {
      throw new Error('租户名称长度不能超过100个字符');
    }

    if (!Object.values(TenantType).includes(this.value.type)) {
      throw new Error('无效的租户类型');
    }

    if (!Object.values(TenantStatus).includes(this.value.status)) {
      throw new Error('无效的租户状态');
    }

    if (this.value.description && this.value.description.length > 500) {
      throw new Error('租户描述长度不能超过500个字符');
    }
  }

  /**
   * @method getName
   * @description 获取租户名称
   * @returns {string} 租户名称
   */
  get name(): string {
    return this.value.name;
  }

  /**
   * @method getDescription
   * @description 获取租户描述
   * @returns {string | undefined} 租户描述
   */
  get description(): string | undefined {
    return this.value.description;
  }

  /**
   * @method getType
   * @description 获取租户类型
   * @returns {TenantType} 租户类型
   */
  get type(): TenantType {
    return this.value.type;
  }

  /**
   * @method getStatus
   * @description 获取租户状态
   * @returns {TenantStatus} 租户状态
   */
  get status(): TenantStatus {
    return this.value.status;
  }

  /**
   * @method getConfiguration
   * @description 获取租户配置
   * @returns {Record<string, unknown>} 租户配置
   */
  get configuration(): Record<string, unknown> {
    return { ...this.value.configuration };
  }

  /**
   * @method getMetadata
   * @description 获取租户元数据
   * @returns {Record<string, unknown> | undefined} 租户元数据
   */
  get metadata(): Record<string, unknown> | undefined {
    return this.value.metadata ? { ...this.value.metadata } : undefined;
  }

  /**
   * @method isActive
   * @description 检查租户是否处于激活状态
   * @returns {boolean} 是否激活
   */
  isActive(): boolean {
    return this.value.status === TenantStatus.ACTIVE;
  }

  /**
   * @method isEnterprise
   * @description 检查是否为企业租户
   * @returns {boolean} 是否为企业租户
   */
  isEnterprise(): boolean {
    return this.value.type === TenantType.ENTERPRISE;
  }

  /**
   * @method updateConfiguration
   * @description 更新租户配置
   * @param {Record<string, unknown>} newConfiguration 新配置
   * @returns {TenantSettings} 新的租户设置实例
   */
  updateConfiguration(
    newConfiguration: Record<string, unknown>,
  ): TenantSettings {
    return new TenantSettings({
      ...this.value,
      configuration: { ...this.value.configuration, ...newConfiguration },
    });
  }

  /**
   * @method updateMetadata
   * @description 更新租户元数据
   * @param {Record<string, unknown>} newMetadata 新元数据
   * @returns {TenantSettings} 新的租户设置实例
   */
  updateMetadata(newMetadata: Record<string, unknown>): TenantSettings {
    return new TenantSettings({
      ...this.value,
      metadata: { ...this.value.metadata, ...newMetadata },
    });
  }
}
