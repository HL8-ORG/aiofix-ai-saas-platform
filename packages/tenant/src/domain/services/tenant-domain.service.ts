import { TenantId } from '@aiofix/shared';
import {
  TenantSettings,
  TenantType,
  TenantStatus,
} from '../value-objects/tenant-settings.vo';
import { TenantQuota, QuotaType } from '../value-objects/tenant-quota.vo';
import { TenantConfiguration } from '../value-objects/tenant-configuration.vo';

/**
 * @class TenantDomainService
 * @description
 * 租户领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调租户和用户之间的业务规则
 * 2. 处理租户和组织架构的关联关系
 * 3. 管理租户配额的复杂计算逻辑
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
 * const tenantService = new TenantDomainService();
 * const canCreateUser = tenantService.canCreateUser(tenantId, currentUserCount);
 * const quotaUsage = tenantService.calculateQuotaUsage(tenantQuota, usageData);
 * ```
 * @since 1.0.0
 */
export class TenantDomainService {
  /**
   * @method canCreateUser
   * @description 判断租户是否可以创建新用户，跨聚合用户数量验证
   * @param {TenantId} tenantId 租户ID
   * @param {TenantQuota} quota 租户配额
   * @param {number} currentUserCount 当前用户数量
   * @returns {boolean} 是否可以创建用户
   *
   * 业务逻辑：
   * 1. 检查租户是否处于激活状态
   * 2. 验证用户数量配额限制
   * 3. 检查租户类型限制
   * 4. 考虑特殊业务规则
   */
  canCreateUser(
    tenantId: TenantId,
    quota: TenantQuota,
    currentUserCount: number,
  ): boolean {
    // 检查配额是否允许创建新用户
    if (quota.hasQuota(QuotaType.USERS)) {
      return currentUserCount < quota.getQuota(QuotaType.USERS);
    }

    // 如果没有用户配额限制，则允许创建
    return true;
  }

  /**
   * @method canUseStorage
   * @description 判断租户是否可以使用存储空间
   * @param {TenantId} tenantId 租户ID
   * @param {TenantQuota} quota 租户配额
   * @param {number} currentStorageUsage 当前存储使用量
   * @param {number} requestedStorage 请求的存储空间
   * @returns {boolean} 是否可以使用存储空间
   */
  canUseStorage(
    tenantId: TenantId,
    quota: TenantQuota,
    currentStorageUsage: number,
    requestedStorage: number,
  ): boolean {
    // 检查存储配额是否允许使用
    if (quota.hasQuota(QuotaType.STORAGE)) {
      const totalUsage = currentStorageUsage + requestedStorage;
      return totalUsage <= quota.getQuota(QuotaType.STORAGE);
    }

    // 如果没有存储配额限制，则允许使用
    return true;
  }

  /**
   * @method canMakeApiCall
   * @description 判断租户是否可以发起API调用
   * @param {TenantId} tenantId 租户ID
   * @param {TenantQuota} quota 租户配额
   * @param {number} currentApiCalls 当前API调用次数
   * @returns {boolean} 是否可以发起API调用
   */
  canMakeApiCall(
    tenantId: TenantId,
    quota: TenantQuota,
    currentApiCalls: number,
  ): boolean {
    // 检查API调用配额是否允许
    if (quota.hasQuota(QuotaType.API_CALLS)) {
      return currentApiCalls < quota.getQuota(QuotaType.API_CALLS);
    }

    // 如果没有API调用配额限制，则允许调用
    return true;
  }

  /**
   * @method calculateQuotaUsage
   * @description 计算租户配额使用情况，无状态配额计算
   * @param {TenantQuota} quota 租户配额
   * @param {Record<string, number>} usageData 使用数据
   * @returns {Record<string, { used: number; limit: number; percentage: number }>} 配额使用情况
   */
  calculateQuotaUsage(
    quota: TenantQuota,
    usageData: Record<string, number>,
  ): Record<string, { used: number; limit: number; percentage: number }> {
    const result: Record<
      string,
      { used: number; limit: number; percentage: number }
    > = {};

    // 计算各种配额的使用情况
    const quotaTypes = [
      { key: 'users', type: QuotaType.USERS },
      { key: 'storage', type: QuotaType.STORAGE },
      { key: 'apiCalls', type: QuotaType.API_CALLS },
      { key: 'bandwidth', type: QuotaType.BANDWIDTH },
      { key: 'connections', type: QuotaType.CONNECTIONS },
    ];

    for (const { key, type } of quotaTypes) {
      const used = usageData[key] || 0;
      const limit = quota.getQuota(type);
      const percentage = quota.getQuotaUsagePercentage(type, used);

      result[key] = {
        used,
        limit,
        percentage,
      };
    }

    // 计算自定义配额的使用情况
    const customQuotas = quota.customQuotas;
    for (const [key, limit] of Object.entries(customQuotas)) {
      const used = usageData[key] || 0;
      const percentage = limit > 0 ? (used / limit) * 100 : 0;

      result[key] = {
        used,
        limit,
        percentage,
      };
    }

    return result;
  }

  /**
   * @method validateTenantName
   * @description 验证租户名称的有效性
   * @param {string} name 租户名称
   * @param {TenantType} type 租户类型
   * @returns {boolean} 租户名称是否有效
   */
  validateTenantName(name: string, type: TenantType): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }

    // 检查名称长度
    if (name.length < 2 || name.length > 100) {
      return false;
    }

    // 检查名称格式
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s\-_\.]+$/.test(name)) {
      return false;
    }

    // 根据租户类型进行特殊验证
    switch (type) {
      case TenantType.ENTERPRISE:
        // 企业租户名称不能包含个人化词汇
        const personalWords = [
          '个人',
          '私人',
          '我的',
          'personal',
          'private',
          'my',
        ];
        return !personalWords.some(word =>
          name.toLowerCase().includes(word.toLowerCase()),
        );

      case TenantType.PERSONAL:
        // 个人租户名称不能包含企业化词汇
        const enterpriseWords = [
          '公司',
          '企业',
          '集团',
          'corporation',
          'company',
          'enterprise',
        ];
        return !enterpriseWords.some(word =>
          name.toLowerCase().includes(word.toLowerCase()),
        );

      default:
        return true;
    }
  }

  /**
   * @method generateTenantId
   * @description 生成租户ID
   * @param {TenantType} type 租户类型
   * @param {string} name 租户名称
   * @returns {TenantId} 生成的租户ID
   */
  generateTenantId(type: TenantType, name: string): TenantId {
    const typePrefix = this.getTypePrefix(type);
    const identifier = this.generateIdentifier(name);
    return TenantId.generate(typePrefix, identifier);
  }

  /**
   * @method getTypePrefix
   * @description 获取租户类型前缀
   * @param {TenantType} type 租户类型
   * @returns {string} 类型前缀
   * @private
   */
  private getTypePrefix(type: TenantType): string {
    const typePrefixes: Record<TenantType, string> = {
      [TenantType.ENTERPRISE]: 'enterprise',
      [TenantType.COMMUNITY]: 'community',
      [TenantType.TEAM]: 'team',
      [TenantType.PERSONAL]: 'personal',
    };
    return typePrefixes[type];
  }

  /**
   * @method generateIdentifier
   * @description 生成标识符
   * @param {string} name 租户名称
   * @returns {string} 标识符
   * @private
   */
  private generateIdentifier(name: string): string {
    // 将名称转换为小写，替换空格和特殊字符为连字符
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // 如果名称太短，添加随机后缀
    if (cleanName.length < 3) {
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      return `${cleanName}-${randomSuffix}`;
    }

    // 截取前20个字符
    return cleanName.substring(0, 20);
  }

  /**
   * @method calculateTenantScore
   * @description 计算租户评分
   * @param {TenantSettings} settings 租户设置
   * @param {TenantQuota} quota 租户配额
   * @param {Record<string, number>} usageData 使用数据
   * @returns {number} 租户评分（0-100）
   */
  calculateTenantScore(
    settings: TenantSettings,
    quota: TenantQuota,
    usageData: Record<string, number>,
  ): number {
    let score = 0;

    // 基础分数
    score += 20;

    // 根据租户类型加分
    switch (settings.type) {
      case TenantType.ENTERPRISE:
        score += 30;
        break;
      case TenantType.COMMUNITY:
        score += 20;
        break;
      case TenantType.TEAM:
        score += 15;
        break;
      case TenantType.PERSONAL:
        score += 10;
        break;
    }

    // 根据状态加分
    if (settings.isActive()) {
      score += 20;
    }

    // 根据配额使用情况加分
    const quotaUsage = this.calculateQuotaUsage(quota, usageData);
    const averageUsage =
      Object.values(quotaUsage).reduce(
        (sum, usage) => sum + usage.percentage,
        0,
      ) / Object.keys(quotaUsage).length;

    if (averageUsage < 50) {
      score += 20; // 使用率低，加分
    } else if (averageUsage < 80) {
      score += 10; // 使用率中等，少量加分
    } else if (averageUsage < 100) {
      score += 5; // 使用率高，少量加分
    }
    // 使用率超过100%不加分

    return Math.min(100, Math.max(0, score));
  }

  /**
   * @method getRecommendedQuota
   * @description 获取推荐配额
   * @param {TenantType} type 租户类型
   * @param {number} userCount 用户数量
   * @returns {TenantQuota} 推荐配额
   */
  getRecommendedQuota(type: TenantType, userCount: number): TenantQuota {
    const baseQuota = this.getBaseQuota(type);
    const multiplier = Math.ceil(userCount / 10); // 每10个用户增加配额

    return new TenantQuota({
      maxUsers: baseQuota.maxUsers * multiplier,
      maxStorage: baseQuota.maxStorage * multiplier,
      maxApiCalls: baseQuota.maxApiCalls * multiplier,
      maxBandwidth: baseQuota.maxBandwidth * multiplier,
      maxConnections: baseQuota.maxConnections * multiplier,
    });
  }

  /**
   * @method getBaseQuota
   * @description 获取基础配额
   * @param {TenantType} type 租户类型
   * @returns {TenantQuotaData} 基础配额数据
   * @private
   */
  private getBaseQuota(type: TenantType): any {
    const baseQuotas: Record<TenantType, any> = {
      [TenantType.ENTERPRISE]: {
        maxUsers: 100,
        maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
        maxApiCalls: 100000,
        maxBandwidth: 1000 * 1024 * 1024 * 1024, // 1TB
        maxConnections: 100,
      },
      [TenantType.COMMUNITY]: {
        maxUsers: 50,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
        maxApiCalls: 10000,
        maxBandwidth: 100 * 1024 * 1024 * 1024, // 100GB
        maxConnections: 50,
      },
      [TenantType.TEAM]: {
        maxUsers: 20,
        maxStorage: 5 * 1024 * 1024 * 1024, // 5GB
        maxApiCalls: 5000,
        maxBandwidth: 50 * 1024 * 1024 * 1024, // 50GB
        maxConnections: 20,
      },
      [TenantType.PERSONAL]: {
        maxUsers: 5,
        maxStorage: 1 * 1024 * 1024 * 1024, // 1GB
        maxApiCalls: 1000,
        maxBandwidth: 10 * 1024 * 1024 * 1024, // 10GB
        maxConnections: 5,
      },
    };

    return baseQuotas[type];
  }

  /**
   * @method validateQuotaConsistency
   * @description 验证配额一致性
   * @param {TenantQuota} quota 租户配额
   * @param {TenantType} type 租户类型
   * @returns {boolean} 配额是否一致
   */
  validateQuotaConsistency(quota: TenantQuota, type: TenantType): boolean {
    const baseQuota = this.getBaseQuota(type);

    // 检查配额是否合理
    if (quota.maxUsers > baseQuota.maxUsers * 10) {
      return false; // 用户数量不能超过基础配额的10倍
    }

    if (quota.maxStorage > baseQuota.maxStorage * 100) {
      return false; // 存储空间不能超过基础配额的100倍
    }

    if (quota.maxApiCalls > baseQuota.maxApiCalls * 50) {
      return false; // API调用不能超过基础配额的50倍
    }

    return true;
  }

  /**
   * @method getTenantHealthStatus
   * @description 获取租户健康状态
   * @param {TenantSettings} settings 租户设置
   * @param {TenantQuota} quota 租户配额
   * @param {Record<string, number>} usageData 使用数据
   * @returns {string} 健康状态（healthy、warning、critical）
   */
  getTenantHealthStatus(
    settings: TenantSettings,
    quota: TenantQuota,
    usageData: Record<string, number>,
  ): 'healthy' | 'warning' | 'critical' {
    // 如果租户未激活，返回critical
    if (!settings.isActive()) {
      return 'critical';
    }

    // 计算配额使用情况
    const quotaUsage = this.calculateQuotaUsage(quota, usageData);
    const maxUsage = Math.max(
      ...Object.values(quotaUsage).map(usage => usage.percentage),
    );

    if (maxUsage >= 100) {
      return 'critical'; // 有配额超出限制
    } else if (maxUsage >= 80) {
      return 'warning'; // 有配额接近限制
    } else {
      return 'healthy'; // 所有配额都在安全范围内
    }
  }
}
