import { ValueObject } from '@aiofix/core';

/**
 * @interface TenantQuotaData
 * @description 租户配额数据结构
 */
export interface TenantQuotaData {
  readonly maxUsers: number;
  readonly maxOrganizations: number;
  readonly maxDepartments: number;
  readonly maxRoles: number;
  readonly maxPermissions: number;
  readonly storageQuota: number; // MB
  readonly bandwidthQuota: number; // MB/month
  readonly apiCallQuota: number; // calls/month
  readonly customDomainQuota: number;
  readonly ssoEnabled: boolean;
  readonly auditLogRetentionDays: number;
}

/**
 * @class TenantQuota
 * @description
 * 租户配额值对象，封装租户资源配额的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 所有配额值必须为非负数
 * 2. 存储配额必须大于0
 * 3. 审计日志保留天数必须在合理范围内
 *
 * 相等性判断：
 * 1. 基于所有配额值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装配额验证逻辑
 * 2. 提供配额计算和比较方法
 * 3. 隐藏配额格式细节
 *
 * @property {TenantQuotaData} value 配额数据
 *
 * @example
 * ```typescript
 * const quota = new TenantQuota({
 *   maxUsers: 100,
 *   maxOrganizations: 10,
 *   maxDepartments: 50,
 *   maxRoles: 20,
 *   maxPermissions: 100,
 *   storageQuota: 1024,
 *   bandwidthQuota: 5120,
 *   apiCallQuota: 10000,
 *   customDomainQuota: 1,
 *   ssoEnabled: true,
 *   auditLogRetentionDays: 90
 * });
 * ```
 * @since 1.0.0
 */
export class TenantQuota extends ValueObject<TenantQuotaData> {
  constructor(data: TenantQuotaData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证配额数据的有效性
   * @returns {void}
   * @throws {Error} 当配额数据无效时抛出
   * @private
   */
  private validate(): void {
    const {
      maxUsers,
      maxOrganizations,
      maxDepartments,
      maxRoles,
      maxPermissions,
      storageQuota,
      auditLogRetentionDays,
    } = this.value;

    if (maxUsers < 0) {
      throw new Error('最大用户数不能为负数');
    }

    if (maxOrganizations < 0) {
      throw new Error('最大组织数不能为负数');
    }

    if (maxDepartments < 0) {
      throw new Error('最大部门数不能为负数');
    }

    if (maxRoles < 0) {
      throw new Error('最大角色数不能为负数');
    }

    if (maxPermissions < 0) {
      throw new Error('最大权限数不能为负数');
    }

    if (storageQuota <= 0) {
      throw new Error('存储配额必须大于0');
    }

    if (auditLogRetentionDays < 1 || auditLogRetentionDays > 3650) {
      throw new Error('审计日志保留天数必须在1-3650天之间');
    }
  }

  /**
   * @getter maxUsers
   * @description 获取最大用户数
   * @returns {number} 最大用户数
   */
  get maxUsers(): number {
    return this.value.maxUsers;
  }

  /**
   * @getter maxOrganizations
   * @description 获取最大组织数
   * @returns {number} 最大组织数
   */
  get maxOrganizations(): number {
    return this.value.maxOrganizations;
  }

  /**
   * @getter maxDepartments
   * @description 获取最大部门数
   * @returns {number} 最大部门数
   */
  get maxDepartments(): number {
    return this.value.maxDepartments;
  }

  /**
   * @getter maxRoles
   * @description 获取最大角色数
   * @returns {number} 最大角色数
   */
  get maxRoles(): number {
    return this.value.maxRoles;
  }

  /**
   * @getter maxPermissions
   * @description 获取最大权限数
   * @returns {number} 最大权限数
   */
  get maxPermissions(): number {
    return this.value.maxPermissions;
  }

  /**
   * @getter storageQuota
   * @description 获取存储配额（MB）
   * @returns {number} 存储配额
   */
  get storageQuota(): number {
    return this.value.storageQuota;
  }

  /**
   * @getter bandwidthQuota
   * @description 获取带宽配额（MB/month）
   * @returns {number} 带宽配额
   */
  get bandwidthQuota(): number {
    return this.value.bandwidthQuota;
  }

  /**
   * @getter apiCallQuota
   * @description 获取API调用配额（calls/month）
   * @returns {number} API调用配额
   */
  get apiCallQuota(): number {
    return this.value.apiCallQuota;
  }

  /**
   * @getter customDomainQuota
   * @description 获取自定义域名配额
   * @returns {number} 自定义域名配额
   */
  get customDomainQuota(): number {
    return this.value.customDomainQuota;
  }

  /**
   * @getter ssoEnabled
   * @description 获取SSO是否启用
   * @returns {boolean} SSO是否启用
   */
  get ssoEnabled(): boolean {
    return this.value.ssoEnabled;
  }

  /**
   * @getter auditLogRetentionDays
   * @description 获取审计日志保留天数
   * @returns {number} 审计日志保留天数
   */
  get auditLogRetentionDays(): number {
    return this.value.auditLogRetentionDays;
  }

  /**
   * @method canAccommodateUsers
   * @description 检查是否可以容纳指定数量的用户
   * @param {number} userCount 用户数量
   * @returns {boolean} 是否可以容纳
   */
  canAccommodateUsers(userCount: number): boolean {
    return userCount <= this.maxUsers;
  }

  /**
   * @method canAccommodateOrganizations
   * @description 检查是否可以容纳指定数量的组织
   * @param {number} orgCount 组织数量
   * @returns {boolean} 是否可以容纳
   */
  canAccommodateOrganizations(orgCount: number): boolean {
    return orgCount <= this.maxOrganizations;
  }

  /**
   * @method canAccommodateDepartments
   * @description 检查是否可以容纳指定数量的部门
   * @param {number} deptCount 部门数量
   * @returns {boolean} 是否可以容纳
   */
  canAccommodateDepartments(deptCount: number): boolean {
    return deptCount <= this.maxDepartments;
  }

  /**
   * @method isUnlimited
   * @description 检查是否为无限制配额
   * @returns {boolean} 是否为无限制配额
   */
  isUnlimited(): boolean {
    return (
      this.maxUsers === Number.MAX_SAFE_INTEGER &&
      this.maxOrganizations === Number.MAX_SAFE_INTEGER &&
      this.maxDepartments === Number.MAX_SAFE_INTEGER
    );
  }

  /**
   * @method getSummary
   * @description 获取配额摘要信息
   * @returns {string} 配额摘要
   */
  getSummary(): string {
    if (this.isUnlimited()) {
      return '无限制配额';
    }

    return `用户: ${this.maxUsers}, 组织: ${this.maxOrganizations}, 部门: ${this.maxDepartments}, 存储: ${this.storageQuota}MB`;
  }

  /**
   * @method equals
   * @description 比较两个配额对象是否相等
   * @param {TenantQuota} other 另一个配额对象
   * @returns {boolean} 是否相等
   */
  equals(other: TenantQuota): boolean {
    if (!(other instanceof TenantQuota)) {
      return false;
    }

    return (
      this.maxUsers === other.maxUsers &&
      this.maxOrganizations === other.maxOrganizations &&
      this.maxDepartments === other.maxDepartments &&
      this.maxRoles === other.maxRoles &&
      this.maxPermissions === other.maxPermissions &&
      this.storageQuota === other.storageQuota &&
      this.bandwidthQuota === other.bandwidthQuota &&
      this.apiCallQuota === other.apiCallQuota &&
      this.customDomainQuota === other.customDomainQuota &&
      this.ssoEnabled === other.ssoEnabled &&
      this.auditLogRetentionDays === other.auditLogRetentionDays
    );
  }
}
