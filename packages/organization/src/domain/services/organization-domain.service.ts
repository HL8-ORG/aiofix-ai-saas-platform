import { OrganizationId } from '@aiofix/shared';
import { OrganizationName } from '@aiofix/shared';
import { OrganizationSettings } from '../value-objects/organization-settings.vo';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationDomainService
 * @description
 * 组织领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调组织和租户之间的业务规则
 * 2. 处理组织和用户之间的关联关系
 * 3. 管理组织权限的复杂计算逻辑
 * 4. 处理组织层级关系的业务规则
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的业务计算逻辑
 * 2. 提供可重用的业务规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 *
 * @example
 * ```typescript
 * const organizationService = new OrganizationDomainService();
 * const canCreate = organizationService.canCreateOrganization(tenantId, name);
 * const hierarchy = organizationService.calculateOrganizationHierarchy(orgId);
 * ```
 * @since 1.0.0
 */
export class OrganizationDomainService {
  /**
   * @method canCreateOrganization
   * @description 判断是否可以在指定租户下创建组织，跨聚合权限计算
   * @param {TenantId} tenantId 租户ID
   * @param {OrganizationName} name 组织名称
   * @param {string} requestedBy 请求创建的用户ID
   * @returns {Promise<boolean>} 是否可以创建
   *
   * 业务逻辑：
   * 1. 检查租户是否允许创建组织
   * 2. 验证组织名称在租户内是否唯一
   * 3. 检查用户是否有创建权限
   * 4. 考虑租户的组织数量限制
   */
  async canCreateOrganization(
    tenantId: TenantId,
    name: OrganizationName,
    requestedBy: string,
  ): Promise<boolean> {
    try {
      // 1. 验证租户状态
      if (!this.isTenantActive(tenantId)) {
        return false;
      }

      // 2. 验证组织名称唯一性
      if (await this.isOrganizationNameExists(tenantId, name)) {
        return false;
      }

      // 3. 验证用户权限
      if (
        !(await this.hasCreateOrganizationPermission(requestedBy, tenantId))
      ) {
        return false;
      }

      // 4. 检查租户组织数量限制
      if (!(await this.canCreateMoreOrganizations(tenantId))) {
        return false;
      }

      return true;
    } catch (error) {
      // 记录错误日志
      console.error('Error checking organization creation permission:', error);
      return false;
    }
  }

  /**
   * @method canUpdateOrganization
   * @description 判断是否可以更新指定组织，跨聚合权限计算
   * @param {OrganizationId} organizationId 组织ID
   * @param {string} requestedBy 请求更新的用户ID
   * @param {OrganizationName} [newName] 新组织名称，可选
   * @returns {Promise<boolean>} 是否可以更新
   *
   * 业务逻辑：
   * 1. 检查组织是否存在且可操作
   * 2. 验证用户是否有更新权限
   * 3. 如果更新名称，检查名称唯一性
   * 4. 考虑组织状态限制
   */
  async canUpdateOrganization(
    organizationId: OrganizationId,
    requestedBy: string,
    newName?: OrganizationName,
  ): Promise<boolean> {
    try {
      // 1. 验证组织状态
      const organization = await this.getOrganization(organizationId);
      if (!organization || !organization.isOperational()) {
        return false;
      }

      // 2. 验证用户权限
      if (
        !(await this.hasUpdateOrganizationPermission(
          requestedBy,
          organizationId,
        ))
      ) {
        return false;
      }

      // 3. 如果更新名称，检查唯一性
      if (
        newName &&
        !(await this.isOrganizationNameUnique(organizationId, newName))
      ) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking organization update permission:', error);
      return false;
    }
  }

  /**
   * @method canDeleteOrganization
   * @description 判断是否可以删除指定组织，跨聚合权限计算
   * @param {OrganizationId} organizationId 组织ID
   * @param {string} requestedBy 请求删除的用户ID
   * @returns {Promise<boolean>} 是否可以删除
   *
   * 业务逻辑：
   * 1. 检查组织是否存在且可删除
   * 2. 验证用户是否有删除权限
   * 3. 检查组织是否有关联数据
   * 4. 考虑组织层级关系
   */
  async canDeleteOrganization(
    organizationId: OrganizationId,
    requestedBy: string,
  ): Promise<boolean> {
    try {
      // 1. 验证组织状态
      const organization = await this.getOrganization(organizationId);
      if (!organization || !organization.canBeDeleted()) {
        return false;
      }

      // 2. 验证用户权限
      if (
        !(await this.hasDeleteOrganizationPermission(
          requestedBy,
          organizationId,
        ))
      ) {
        return false;
      }

      // 3. 检查关联数据
      if (await this.hasAssociatedData(organizationId)) {
        return false;
      }

      // 4. 检查子组织
      if (await this.hasSubOrganizations(organizationId)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking organization delete permission:', error);
      return false;
    }
  }

  /**
   * @method calculateOrganizationHierarchy
   * @description 计算组织层级关系，无状态权限计算
   * @param {OrganizationId} organizationId 组织ID
   * @returns {Promise<OrganizationHierarchy>} 组织层级信息
   */
  async calculateOrganizationHierarchy(
    organizationId: OrganizationId,
  ): Promise<OrganizationHierarchy> {
    try {
      const organization = await this.getOrganization(organizationId);
      if (!organization) {
        throw new OrganizationNotFoundError(
          `组织不存在: ${organizationId.value}`,
        );
      }

      // 计算父组织
      const parentOrganization =
        await this.getParentOrganization(organizationId);

      // 计算子组织
      const subOrganizations = await this.getSubOrganizations(organizationId);

      // 计算层级深度
      const depth = await this.calculateOrganizationDepth(organizationId);

      return {
        organizationId,
        parentOrganization,
        subOrganizations,
        depth,
        isRoot: !parentOrganization,
        isLeaf: subOrganizations.length === 0,
      };
    } catch (error) {
      console.error('Error calculating organization hierarchy:', error);
      throw error;
    }
  }

  /**
   * @method validateOrganizationSettings
   * @description 验证组织设置的有效性
   * @param {OrganizationSettings} settings 组织设置
   * @param {TenantId} tenantId 租户ID
   * @returns {Promise<ValidationResult>} 验证结果
   */
  async validateOrganizationSettings(
    settings: OrganizationSettings,
    tenantId: TenantId,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // 验证最大成员数量
      if (settings.getMaxMembers() > 10000) {
        errors.push('最大成员数量不能超过10000');
      }

      // 验证租户限制
      const tenantLimits = await this.getTenantLimits(tenantId);
      if (settings.getMaxMembers() > tenantLimits.maxMembersPerOrganization) {
        errors.push(
          `最大成员数量超过租户限制: ${tenantLimits.maxMembersPerOrganization}`,
        );
      }

      // 验证功能启用限制
      if (
        settings.isFeatureEnabled('projectManagement') &&
        !tenantLimits.allowProjectManagement
      ) {
        errors.push('租户不允许启用项目管理功能');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Error validating organization settings:', error);
      return {
        isValid: false,
        errors: ['设置验证失败'],
      };
    }
  }

  // 私有辅助方法
  private async isTenantActive(tenantId: TenantId): Promise<boolean> {
    // 这里应该调用租户服务检查租户状态
    // 暂时返回true作为占位符
    return true;
  }

  private async isOrganizationNameExists(
    tenantId: TenantId,
    name: OrganizationName,
  ): Promise<boolean> {
    // 这里应该调用组织仓储检查名称唯一性
    // 暂时返回false作为占位符
    return false;
  }

  private async hasCreateOrganizationPermission(
    userId: string,
    tenantId: TenantId,
  ): Promise<boolean> {
    // 这里应该调用权限服务检查用户权限
    // 暂时返回true作为占位符
    return true;
  }

  private async canCreateMoreOrganizations(
    tenantId: TenantId,
  ): Promise<boolean> {
    // 这里应该检查租户的组织数量限制
    // 暂时返回true作为占位符
    return true;
  }

  private async getOrganization(organizationId: OrganizationId): Promise<any> {
    // 这里应该调用组织仓储获取组织信息
    // 暂时返回null作为占位符
    return null;
  }

  private async hasUpdateOrganizationPermission(
    userId: string,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    // 这里应该调用权限服务检查用户权限
    // 暂时返回true作为占位符
    return true;
  }

  private async isOrganizationNameUnique(
    organizationId: OrganizationId,
    name: OrganizationName,
  ): Promise<boolean> {
    // 这里应该检查组织名称唯一性
    // 暂时返回true作为占位符
    return true;
  }

  private async hasDeleteOrganizationPermission(
    userId: string,
    organizationId: OrganizationId,
  ): Promise<boolean> {
    // 这里应该调用权限服务检查用户权限
    // 暂时返回true作为占位符
    return true;
  }

  private async hasAssociatedData(
    organizationId: OrganizationId,
  ): Promise<boolean> {
    // 这里应该检查组织是否有关联数据
    // 暂时返回false作为占位符
    return false;
  }

  private async hasSubOrganizations(
    organizationId: OrganizationId,
  ): Promise<boolean> {
    // 这里应该检查组织是否有子组织
    // 暂时返回false作为占位符
    return false;
  }

  private async getParentOrganization(
    organizationId: OrganizationId,
  ): Promise<any> {
    // 这里应该获取父组织信息
    // 暂时返回null作为占位符
    return null;
  }

  private async getSubOrganizations(
    organizationId: OrganizationId,
  ): Promise<any[]> {
    // 这里应该获取子组织列表
    // 暂时返回空数组作为占位符
    return [];
  }

  private async calculateOrganizationDepth(
    organizationId: OrganizationId,
  ): Promise<number> {
    // 这里应该计算组织层级深度
    // 暂时返回0作为占位符
    return 0;
  }

  private async getTenantLimits(tenantId: TenantId): Promise<any> {
    // 这里应该获取租户限制信息
    // 暂时返回默认值作为占位符
    return {
      maxMembersPerOrganization: 1000,
      allowProjectManagement: true,
    };
  }
}

// 类型定义
export interface OrganizationHierarchy {
  organizationId: OrganizationId;
  parentOrganization: any | null;
  subOrganizations: any[];
  depth: number;
  isRoot: boolean;
  isLeaf: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 异常类
export class OrganizationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrganizationNotFoundError';
  }
}
