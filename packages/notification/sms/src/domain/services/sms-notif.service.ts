import { PhoneNumber, PhoneRegion } from '../value-objects/phone-number.vo';
import { SmsContent, SmsEncoding } from '../value-objects/sms-content.vo';
import { SmsProvider, SmsProviderType } from '../value-objects/sms-provider.vo';
import { SmsNotifEntity } from '../entities/sms-notif.entity';

/**
 * 短信通知领域服务
 *
 * 负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 领域服务职责：
 * - 协调短信通知和用户设备之间的业务规则
 * - 处理短信通知和短信提供商之间的关联关系
 * - 管理短信通知的复杂业务逻辑
 * - 提供短信通知的业务规则验证
 *
 * 无状态操作：
 * - 不维护任何内部状态
 * - 所有方法都是纯函数
 * - 可以安全地在多个聚合根之间共享
 * - 支持并发调用
 *
 * 业务规则封装：
 * - 封装复杂的短信通知计算逻辑
 * - 提供可重用的业务规则验证
 * - 隔离跨聚合的复杂业务逻辑
 *
 * @class SmsNotifService
 */
export class SmsNotifService {
  /**
   * 选择最适合的短信提供商
   *
   * @param {PhoneNumber} phoneNumber 手机号
   * @param {SmsContent} content 短信内容
   * @param {SmsProvider[]} availableProviders 可用的短信提供商列表
   * @returns {SmsProvider | null} 最适合的短信提供商
   */
  public selectBestProvider(
    phoneNumber: PhoneNumber,
    content: SmsContent,
    availableProviders: SmsProvider[],
  ): SmsProvider | null {
    // 过滤支持该地区和编码的提供商
    const supportedProviders = availableProviders.filter(
      provider =>
        provider.supportsRegion(phoneNumber.getRegion()) &&
        provider.supportsEncoding(content.getEncoding()) &&
        provider.isAvailable(),
    );

    if (supportedProviders.length === 0) {
      return null;
    }

    // 根据优先级和地区偏好选择最佳提供商
    return supportedProviders.sort((a, b) => {
      // 首先按优先级排序
      const priorityDiff = a.comparePriority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // 然后按地区匹配度排序
      const regionMatchA = this.getRegionMatchScore(phoneNumber.getRegion(), a);
      const regionMatchB = this.getRegionMatchScore(phoneNumber.getRegion(), b);
      return regionMatchB - regionMatchA;
    })[0];
  }

  /**
   * 计算短信发送成本
   *
   * @param {SmsContent} content 短信内容
   * @param {SmsProvider} provider 短信提供商
   * @param {PhoneNumber} phoneNumber 手机号
   * @returns {number} 发送成本（分）
   */
  public calculateSendingCost(
    content: SmsContent,
    provider: SmsProvider,
    phoneNumber: PhoneNumber,
  ): number {
    const baseCost = this.getBaseCostByProvider(provider);
    const segmentCount = content.getSegmentCount();
    const regionMultiplier = this.getRegionCostMultiplier(
      phoneNumber.getRegion(),
    );

    return Math.round(baseCost * segmentCount * regionMultiplier);
  }

  /**
   * 计算短信发送延迟
   *
   * @param {SmsProvider} provider 短信提供商
   * @param {PhoneNumber} phoneNumber 手机号
   * @param {SmsContent} content 短信内容
   * @returns {number} 预计发送延迟（毫秒）
   */
  public calculateSendingDelay(
    provider: SmsProvider,
    phoneNumber: PhoneNumber,
    content: SmsContent,
  ): number {
    const baseDelay = this.getBaseDelayByProvider(provider);
    const regionDelay = this.getRegionDelay(phoneNumber.getRegion());
    const contentDelay = this.getContentDelay(content);

    return baseDelay + regionDelay + contentDelay;
  }

  /**
   * 验证短信发送规则
   *
   * @param {SmsNotifEntity} smsNotif 短信通知实体
   * @returns {string[]} 验证错误列表
   */
  public validateSendingRules(smsNotif: SmsNotifEntity): string[] {
    const errors: string[] = [];

    // 验证手机号
    if (!smsNotif.getPhoneNumber().isValid()) {
      errors.push('手机号格式无效');
    }

    if (!smsNotif.getPhoneNumber().canReceiveSms()) {
      errors.push('手机号不支持短信接收');
    }

    // 验证短信内容
    if (smsNotif.getContent().exceedsMaxLength()) {
      errors.push('短信内容超过最大长度限制');
    }

    if (smsNotif.getContent().getSegmentCount() > 10) {
      errors.push('短信段数超过限制');
    }

    // 验证提供商
    if (!smsNotif.getProvider().isAvailable()) {
      errors.push('短信提供商不可用');
    }

    if (
      !smsNotif
        .getProvider()
        .supportsRegion(smsNotif.getPhoneNumber().getRegion())
    ) {
      errors.push('短信提供商不支持该地区');
    }

    if (
      !smsNotif
        .getProvider()
        .supportsEncoding(smsNotif.getContent().getEncoding())
    ) {
      errors.push('短信提供商不支持该编码方式');
    }

    // 验证状态
    if (!smsNotif.canSend()) {
      errors.push('短信通知当前状态不允许发送');
    }

    // 验证重试次数
    if (smsNotif.getRetryCount() > smsNotif.getMaxRetries()) {
      errors.push('重试次数超过最大限制');
    }

    return errors;
  }

  /**
   * 计算短信通知指标
   *
   * @param {SmsNotifEntity[]} smsNotifs 短信通知列表
   * @returns {Record<string, any>} 指标数据
   */
  public calculateSmsNotifMetrics(
    smsNotifs: SmsNotifEntity[],
  ): Record<string, any> {
    const metrics = {
      total: smsNotifs.length,
      byStatus: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      byEncoding: {} as Record<string, number>,
      successRate: 0,
      averageRetryCount: 0,
      totalCost: 0,
    };

    let successCount = 0;
    let totalRetryCount = 0;
    let totalCost = 0;

    smsNotifs.forEach(smsNotif => {
      // 按状态统计
      const status = smsNotif.getStatus().getStatus();
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

      // 按提供商统计
      const providerName = smsNotif.getProvider().getProviderName();
      metrics.byProvider[providerName] =
        (metrics.byProvider[providerName] || 0) + 1;

      // 按地区统计
      const region = smsNotif.getPhoneNumber().getRegion();
      metrics.byRegion[region] = (metrics.byRegion[region] || 0) + 1;

      // 按编码统计
      const encoding = smsNotif.getContent().getEncoding();
      metrics.byEncoding[encoding] = (metrics.byEncoding[encoding] || 0) + 1;

      // 计算成功率
      if (smsNotif.getStatus().isSuccessStatus()) {
        successCount++;
      }

      // 计算重试次数
      totalRetryCount += smsNotif.getRetryCount();

      // 计算成本
      totalCost += this.calculateSendingCost(
        smsNotif.getContent(),
        smsNotif.getProvider(),
        smsNotif.getPhoneNumber(),
      );
    });

    metrics.successRate =
      metrics.total > 0 ? (successCount / metrics.total) * 100 : 0;
    metrics.averageRetryCount =
      metrics.total > 0 ? totalRetryCount / metrics.total : 0;
    metrics.totalCost = totalCost;

    return metrics;
  }

  /**
   * 获取地区匹配分数
   *
   * @param {PhoneRegion} region 手机号地区
   * @param {SmsProvider} provider 短信提供商
   * @returns {number} 匹配分数
   * @private
   */
  private getRegionMatchScore(
    region: PhoneRegion,
    provider: SmsProvider,
  ): number {
    const supportedRegions = provider.getSupportedRegions();

    // 完全匹配
    if (supportedRegions.includes(region)) {
      return 100;
    }

    // 部分匹配（例如：中国大陆匹配中国）
    if (
      region === PhoneRegion.CHINA_MAINLAND &&
      (supportedRegions.includes('CHINA') || supportedRegions.includes('CN'))
    ) {
      return 80;
    }

    // 无匹配
    return 0;
  }

  /**
   * 获取提供商基础成本
   *
   * @param {SmsProvider} provider 短信提供商
   * @returns {number} 基础成本（分）
   * @private
   */
  private getBaseCostByProvider(provider: SmsProvider): number {
    const costMap: Record<SmsProviderType, number> = {
      [SmsProviderType.ALIYUN]: 5,
      [SmsProviderType.TENCENT]: 5,
      [SmsProviderType.HUAWEI]: 4,
      [SmsProviderType.TWILIO]: 8,
      [SmsProviderType.AWS_SNS]: 7,
      [SmsProviderType.CUSTOM]: 6,
    };

    return costMap[provider.getProviderType()] || 5;
  }

  /**
   * 获取地区成本倍数
   *
   * @param {PhoneRegion} region 手机号地区
   * @returns {number} 成本倍数
   * @private
   */
  private getRegionCostMultiplier(region: PhoneRegion): number {
    const multiplierMap: Record<PhoneRegion, number> = {
      [PhoneRegion.CHINA_MAINLAND]: 1.0,
      [PhoneRegion.HONG_KONG]: 1.2,
      [PhoneRegion.TAIWAN]: 1.2,
      [PhoneRegion.USA]: 1.5,
      [PhoneRegion.UK]: 1.3,
      [PhoneRegion.JAPAN]: 1.4,
      [PhoneRegion.SOUTH_KOREA]: 1.3,
      [PhoneRegion.SINGAPORE]: 1.1,
      [PhoneRegion.MALAYSIA]: 1.1,
      [PhoneRegion.THAILAND]: 1.1,
      [PhoneRegion.VIETNAM]: 1.1,
      [PhoneRegion.PHILIPPINES]: 1.1,
      [PhoneRegion.INDONESIA]: 1.1,
      [PhoneRegion.INDIA]: 1.2,
      [PhoneRegion.AUSTRALIA]: 1.4,
      [PhoneRegion.GERMANY]: 1.3,
      [PhoneRegion.FRANCE]: 1.3,
      [PhoneRegion.ITALY]: 1.3,
      [PhoneRegion.SPAIN]: 1.3,
      [PhoneRegion.RUSSIA]: 1.2,
      [PhoneRegion.BRAZIL]: 1.3,
      [PhoneRegion.MEXICO]: 1.2,
      [PhoneRegion.ARGENTINA]: 1.3,
      [PhoneRegion.CHILE]: 1.3,
      [PhoneRegion.COLOMBIA]: 1.3,
      [PhoneRegion.PERU]: 1.3,
      [PhoneRegion.VENEZUELA]: 1.3,
      [PhoneRegion.SOUTH_AFRICA]: 1.4,
      [PhoneRegion.EGYPT]: 1.3,
      [PhoneRegion.NIGERIA]: 1.3,
      [PhoneRegion.KENYA]: 1.3,
      [PhoneRegion.GHANA]: 1.3,
      [PhoneRegion.LANDLINE]: 0,
      [PhoneRegion.OTHER]: 1.5,
    };

    return multiplierMap[region] || 1.5;
  }

  /**
   * 获取提供商基础延迟
   *
   * @param {SmsProvider} provider 短信提供商
   * @returns {number} 基础延迟（毫秒）
   * @private
   */
  private getBaseDelayByProvider(provider: SmsProvider): number {
    const delayMap: Record<SmsProviderType, number> = {
      [SmsProviderType.ALIYUN]: 1000,
      [SmsProviderType.TENCENT]: 1200,
      [SmsProviderType.HUAWEI]: 1500,
      [SmsProviderType.TWILIO]: 2000,
      [SmsProviderType.AWS_SNS]: 1800,
      [SmsProviderType.CUSTOM]: 2500,
    };

    return delayMap[provider.getProviderType()] || 2000;
  }

  /**
   * 获取地区延迟
   *
   * @param {PhoneRegion} region 手机号地区
   * @returns {number} 地区延迟（毫秒）
   * @private
   */
  private getRegionDelay(region: PhoneRegion): number {
    const delayMap: Record<PhoneRegion, number> = {
      [PhoneRegion.CHINA_MAINLAND]: 0,
      [PhoneRegion.HONG_KONG]: 200,
      [PhoneRegion.TAIWAN]: 200,
      [PhoneRegion.USA]: 500,
      [PhoneRegion.UK]: 300,
      [PhoneRegion.JAPAN]: 300,
      [PhoneRegion.SOUTH_KOREA]: 300,
      [PhoneRegion.SINGAPORE]: 100,
      [PhoneRegion.MALAYSIA]: 100,
      [PhoneRegion.THAILAND]: 100,
      [PhoneRegion.VIETNAM]: 100,
      [PhoneRegion.PHILIPPINES]: 100,
      [PhoneRegion.INDONESIA]: 100,
      [PhoneRegion.INDIA]: 200,
      [PhoneRegion.AUSTRALIA]: 400,
      [PhoneRegion.GERMANY]: 300,
      [PhoneRegion.FRANCE]: 300,
      [PhoneRegion.ITALY]: 300,
      [PhoneRegion.SPAIN]: 300,
      [PhoneRegion.RUSSIA]: 200,
      [PhoneRegion.BRAZIL]: 300,
      [PhoneRegion.MEXICO]: 200,
      [PhoneRegion.ARGENTINA]: 300,
      [PhoneRegion.CHILE]: 300,
      [PhoneRegion.COLOMBIA]: 300,
      [PhoneRegion.PERU]: 300,
      [PhoneRegion.VENEZUELA]: 300,
      [PhoneRegion.SOUTH_AFRICA]: 400,
      [PhoneRegion.EGYPT]: 300,
      [PhoneRegion.NIGERIA]: 300,
      [PhoneRegion.KENYA]: 300,
      [PhoneRegion.GHANA]: 300,
      [PhoneRegion.LANDLINE]: 0,
      [PhoneRegion.OTHER]: 500,
    };

    return delayMap[region] || 500;
  }

  /**
   * 获取内容延迟
   *
   * @param {SmsContent} content 短信内容
   * @returns {number} 内容延迟（毫秒）
   * @private
   */
  private getContentDelay(content: SmsContent): number {
    const segmentCount = content.getSegmentCount();
    const encoding = content.getEncoding();

    // 多段短信需要更多处理时间
    const segmentDelay = (segmentCount - 1) * 200;

    // UTF-8编码需要更多处理时间
    const encodingDelay = encoding === SmsEncoding.UTF8 ? 100 : 0;

    return segmentDelay + encodingDelay;
  }
}
