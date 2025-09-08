// 领域服务不依赖任何框架
import {
  TenantQuota,
  type TenantQuotaData,
} from '../value-objects/tenant-quota.vo';
import { SystemConfiguration } from '../value-objects/system-configuration.vo';
import { SystemMetrics } from '../value-objects/system-metrics.vo';

/**
 * @interface CreateTenantData
 * @description 创建租户数据结构
 */
export interface CreateTenantData {
  readonly tenantName: string;
  readonly tenantType: 'ENTERPRISE' | 'COMMUNITY' | 'TEAM' | 'PERSONAL';
  readonly adminUserId: string;
  readonly requestedQuota?: Partial<TenantQuotaData>;
  readonly customDomain?: string;
  readonly description?: string;
}

/**
 * @interface TenantUpdates
 * @description 租户更新数据结构
 */
export interface TenantUpdates {
  readonly tenantName?: string;
  readonly description?: string;
  readonly quota?: TenantQuotaData;
  readonly customDomain?: string;
  readonly status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

/**
 * @interface SystemCapacity
 * @description 系统容量数据结构
 */
export interface SystemCapacity {
  readonly maxTenants: number;
  currentTenants: number;
  readonly maxUsers: number;
  currentUsers: number;
  readonly maxStorage: number; // MB
  readonly currentStorage: number; // MB
  readonly maxBandwidth: number; // MB/month
  readonly currentBandwidth: number; // MB/month
}

/**
 * @class PlatformManagementService
 * @description
 * 平台管理领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调租户创建和管理的复杂业务规则
 * 2. 处理系统容量和资源分配的计算逻辑
 * 3. 管理平台配置和功能开关的业务规则
 * 4. 协调系统监控和性能分析的逻辑
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
 * const platformService = new PlatformManagementService();
 * const canCreate = await platformService.validateTenantCreation(tenantData);
 * const quota = platformService.calculateResourceQuota('ENTERPRISE');
 * ```
 * @since 1.0.0
 */
export class PlatformManagementService {
  /**
   * @method validateTenantCreation
   * @description 验证租户创建请求的有效性
   * @param {CreateTenantData} tenantData 租户创建数据
   * @param {SystemCapacity} currentCapacity 当前系统容量
   * @returns {Promise<{ valid: boolean; reason?: string }>} 验证结果
   *
   * 业务逻辑：
   * 1. 检查租户名称唯一性
   * 2. 验证租户类型和配额的匹配性
   * 3. 检查系统容量是否充足
   * 4. 验证管理员用户资格
   * 5. 检查自定义域名可用性
   */
  async validateTenantCreation(
    tenantData: CreateTenantData,
    currentCapacity: SystemCapacity,
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. 验证租户名称
    if (!tenantData.tenantName || tenantData.tenantName.trim().length === 0) {
      return { valid: false, reason: '租户名称不能为空' };
    }

    if (tenantData.tenantName.length > 100) {
      return { valid: false, reason: '租户名称长度不能超过100个字符' };
    }

    // 2. 验证租户类型
    const validTypes = ['ENTERPRISE', 'COMMUNITY', 'TEAM', 'PERSONAL'];
    if (!validTypes.includes(tenantData.tenantType)) {
      return { valid: false, reason: '无效的租户类型' };
    }

    // 3. 检查系统容量
    if (currentCapacity.currentTenants >= currentCapacity.maxTenants) {
      return { valid: false, reason: '系统租户容量已满' };
    }

    // 4. 验证管理员用户
    if (!tenantData.adminUserId || tenantData.adminUserId.trim().length === 0) {
      return { valid: false, reason: '管理员用户ID不能为空' };
    }

    // 5. 验证自定义域名格式
    if (
      tenantData.customDomain &&
      !this.isValidDomain(tenantData.customDomain)
    ) {
      return { valid: false, reason: '自定义域名格式无效' };
    }

    return { valid: true };
  }

  /**
   * @method calculateResourceQuota
   * @description 根据租户类型计算资源配额
   * @param {string} tenantType 租户类型
   * @returns {TenantQuota} 计算出的配额
   *
   * 配额策略：
   * 1. 企业租户：高配额，支持SSO
   * 2. 社群租户：中等配额，基础功能
   * 3. 团队租户：低配额，协作功能
   * 4. 个人租户：最小配额，基础功能
   */
  calculateResourceQuota(tenantType: string): TenantQuota {
    const quotaTemplates = {
      ENTERPRISE: {
        maxUsers: 10000,
        maxOrganizations: 100,
        maxDepartments: 1000,
        maxRoles: 100,
        maxPermissions: 500,
        storageQuota: 102400, // 100GB
        bandwidthQuota: 1024000, // 1TB
        apiCallQuota: 1000000,
        customDomainQuota: 10,
        ssoEnabled: true,
        auditLogRetentionDays: 365,
      },
      COMMUNITY: {
        maxUsers: 1000,
        maxOrganizations: 20,
        maxDepartments: 100,
        maxRoles: 50,
        maxPermissions: 200,
        storageQuota: 10240, // 10GB
        bandwidthQuota: 102400, // 100GB
        apiCallQuota: 100000,
        customDomainQuota: 1,
        ssoEnabled: false,
        auditLogRetentionDays: 90,
      },
      TEAM: {
        maxUsers: 100,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxRoles: 20,
        maxPermissions: 100,
        storageQuota: 1024, // 1GB
        bandwidthQuota: 10240, // 10GB
        apiCallQuota: 10000,
        customDomainQuota: 0,
        ssoEnabled: false,
        auditLogRetentionDays: 30,
      },
      PERSONAL: {
        maxUsers: 10,
        maxOrganizations: 1,
        maxDepartments: 5,
        maxRoles: 5,
        maxPermissions: 20,
        storageQuota: 100, // 100MB
        bandwidthQuota: 1024, // 1GB
        apiCallQuota: 1000,
        customDomainQuota: 0,
        ssoEnabled: false,
        auditLogRetentionDays: 7,
      },
    };

    const template = quotaTemplates[tenantType as keyof typeof quotaTemplates];
    if (!template) {
      throw new Error(`不支持的租户类型: ${tenantType}`);
    }

    return new TenantQuota(template);
  }

  /**
   * @method checkSystemCapacity
   * @description 检查系统容量状态
   * @param {SystemCapacity} capacity 系统容量
   * @returns {Promise<{ adequate: boolean; warnings: string[] }>} 容量检查结果
   *
   * 容量检查规则：
   * 1. 租户数量不超过80%容量
   * 2. 用户数量不超过90%容量
   * 3. 存储使用不超过85%容量
   * 4. 带宽使用不超过80%容量
   */
  async checkSystemCapacity(
    capacity: SystemCapacity,
  ): Promise<{ adequate: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    let adequate = true;

    // 检查租户容量
    const tenantUsageRate =
      (capacity.currentTenants / capacity.maxTenants) * 100;
    if (tenantUsageRate > 80) {
      warnings.push(`租户容量使用率过高: ${tenantUsageRate.toFixed(1)}%`);
      if (tenantUsageRate > 90) {
        adequate = false;
      }
    }

    // 检查用户容量
    const userUsageRate = (capacity.currentUsers / capacity.maxUsers) * 100;
    if (userUsageRate > 90) {
      warnings.push(`用户容量使用率过高: ${userUsageRate.toFixed(1)}%`);
      adequate = false;
    }

    // 检查存储容量
    const storageUsageRate =
      (capacity.currentStorage / capacity.maxStorage) * 100;
    if (storageUsageRate > 85) {
      warnings.push(`存储容量使用率过高: ${storageUsageRate.toFixed(1)}%`);
      if (storageUsageRate > 95) {
        adequate = false;
      }
    }

    // 检查带宽容量
    const bandwidthUsageRate =
      (capacity.currentBandwidth / capacity.maxBandwidth) * 100;
    if (bandwidthUsageRate > 80) {
      warnings.push(`带宽容量使用率过高: ${bandwidthUsageRate.toFixed(1)}%`);
      if (bandwidthUsageRate > 90) {
        adequate = false;
      }
    }

    return { adequate, warnings };
  }

  /**
   * @method validateSystemConfiguration
   * @description 验证系统配置的有效性
   * @param {SystemConfiguration} configuration 系统配置
   * @returns {Promise<{ valid: boolean; errors: string[] }>} 验证结果
   *
   * 配置验证规则：
   * 1. 系统参数必须在合理范围内
   * 2. 功能开关组合必须兼容
   * 3. 主题设置必须符合设计规范
   * 4. 安全策略必须满足最低要求
   */
  async validateSystemConfiguration(
    configuration: SystemConfiguration,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const params = configuration.systemParameters;

    // 验证安全策略
    if (params.passwordMinLength < 8) {
      errors.push('密码最小长度不能少于8位');
    }

    if (
      !params.passwordRequireUppercase ||
      !params.passwordRequireLowercase ||
      !params.passwordRequireNumbers
    ) {
      errors.push('密码必须包含大小写字母和数字');
    }

    if (params.sessionTimeout < 15) {
      errors.push('会话超时时间不能少于15分钟');
    }

    if (params.maxLoginAttempts < 3) {
      errors.push('最大登录尝试次数不能少于3次');
    }

    // 验证功能开关兼容性
    if (
      configuration.featureFlags.ssoEnabled &&
      !configuration.featureFlags.multiTenantEnabled
    ) {
      errors.push('启用SSO必须同时启用多租户功能');
    }

    if (
      configuration.featureFlags.advancedAnalytics &&
      !configuration.featureFlags.auditLogEnabled
    ) {
      errors.push('启用高级分析必须同时启用审计日志');
    }

    // 验证主题设置
    if (!this.isValidColor(configuration.themeSettings.primaryColor)) {
      errors.push('主色调必须是有效的十六进制颜色值');
    }

    if (!this.isValidColor(configuration.themeSettings.secondaryColor)) {
      errors.push('辅助色必须是有效的十六进制颜色值');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * @method analyzeSystemMetrics
   * @description 分析系统指标并提供建议
   * @param {SystemMetrics} metrics 系统指标
   * @returns {Promise<{ healthy: boolean; recommendations: string[] }>} 分析结果
   *
   * 分析规则：
   * 1. 性能指标是否在正常范围内
   * 2. 用户活动是否异常
   * 3. 系统容量是否充足
   * 4. 提供优化建议
   */
  async analyzeSystemMetrics(
    metrics: SystemMetrics,
  ): Promise<{ healthy: boolean; recommendations: string[] }> {
    const recommendations: string[] = [];
    let healthy = true;

    const perf = metrics.performanceMetrics;
    const activity = metrics.userActivity;
    const capacity = metrics.systemCapacity;

    // 性能分析
    if (perf.cpuUsage > 80) {
      recommendations.push('CPU使用率过高，建议增加服务器资源或优化代码');
      healthy = false;
    }

    if (perf.memoryUsage > 85) {
      recommendations.push('内存使用率过高，建议增加内存或优化内存使用');
      healthy = false;
    }

    if (perf.responseTime > 1000) {
      recommendations.push('响应时间过长，建议优化数据库查询或增加缓存');
      healthy = false;
    }

    if (perf.errorRate > 5) {
      recommendations.push('错误率过高，建议检查系统日志并修复问题');
      healthy = false;
    }

    // 用户活动分析
    if (activity.bounceRate > 70) {
      recommendations.push('跳出率过高，建议优化用户体验');
    }

    if (activity.sessionDuration < 2) {
      recommendations.push('会话时长过短，建议分析用户行为并优化功能');
    }

    // 容量分析
    const tenantUtilization =
      (capacity.activeTenants / capacity.totalTenants) * 100;
    if (tenantUtilization > 90) {
      recommendations.push('租户利用率过高，建议考虑扩容');
    }

    const userGrowthRate = metrics.getUserGrowthRate();
    if (userGrowthRate > 20) {
      recommendations.push('用户增长率较高，建议提前规划扩容');
    }

    return { healthy, recommendations };
  }

  /**
   * @method isValidDomain
   * @description 验证域名格式
   * @param {string} domain 域名
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    return domainRegex.test(domain);
  }

  /**
   * @method isValidColor
   * @description 验证颜色值格式
   * @param {string} color 颜色值
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidColor(color: string): boolean {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }
}
