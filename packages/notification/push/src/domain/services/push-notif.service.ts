import { PushToken, PushPlatform } from '../value-objects/push-token.vo';
import { PushContent } from '../value-objects/push-content.vo';
import {
  PushPriority,
  PushPriorityLevel,
} from '../value-objects/push-priority.vo';
import { PushNotifEntity } from '../entities/push-notif.entity';

/**
 * @class PushNotifService
 * @description
 * 推送通知领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 领域服务职责：
 * 1. 协调推送通知和用户设备之间的业务规则
 * 2. 处理推送通知和推送平台之间的关联关系
 * 3. 管理推送通知的复杂计算逻辑
 * 4. 提供推送通知的业务规则验证
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的推送通知计算逻辑
 * 2. 提供可重用的业务规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 * 4. 支持推送通知的批量处理
 *
 * @example
 * ```typescript
 * const pushNotifService = new PushNotifService();
 * const canSend = pushNotifService.canSendPushNotif(userId, pushToken);
 * const priority = pushNotifService.calculateOptimalPriority(content, userPreferences);
 * ```
 * @since 1.0.0
 */
export class PushNotifService {
  /**
   * @method canSendPushNotif
   * @description 判断是否可以发送推送通知，跨聚合权限计算
   * @param {string} userId 用户ID
   * @param {PushToken} pushToken 推送令牌
   * @param {PushContent} content 推送内容
   * @param {PushPriorityLevel} priority 推送优先级
   * @returns {Promise<boolean>} 是否可以发送
   *
   * 业务逻辑：
   * 1. 检查用户是否允许接收推送通知
   * 2. 验证推送令牌是否有效
   * 3. 检查推送内容是否符合用户偏好
   * 4. 考虑推送频率限制
   */
  async canSendPushNotif(
    userId: string,
    pushToken: PushToken,
    content: PushContent,
    priority: PushPriorityLevel,
  ): Promise<boolean> {
    // 1. 检查推送令牌有效性
    if (!this.isValidPushToken(pushToken)) {
      return false;
    }

    // 2. 检查推送内容有效性
    if (!this.isValidPushContent(content)) {
      return false;
    }

    // 3. 检查推送优先级合理性
    if (!this.isValidPushPriority(priority)) {
      return false;
    }

    // 4. 检查用户推送偏好（这里需要调用用户偏好服务）
    // const userPreferences = await this.getUserPushPreferences(userId);
    // if (!this.isContentAllowedByPreferences(content, userPreferences)) {
    //   return false;
    // }

    // 5. 检查推送频率限制
    // const canSendByRateLimit = await this.checkPushRateLimit(userId, priority);
    // if (!canSendByRateLimit) {
    //   return false;
    // }

    return true;
  }

  /**
   * @method calculateOptimalPriority
   * @description 计算推送通知的最优优先级，无状态优先级计算
   * @param {PushContent} content 推送内容
   * @param {Record<string, any>} userPreferences 用户偏好设置
   * @param {Record<string, any>} context 上下文信息
   * @returns {PushPriorityLevel} 最优优先级
   */
  calculateOptimalPriority(
    content: PushContent,
    userPreferences: Record<string, any>,
    context: Record<string, any>,
  ): PushPriorityLevel {
    // 1. 基于内容类型计算基础优先级
    let basePriority = this.getBasePriorityByContentType(content);

    // 2. 基于用户偏好调整优先级
    basePriority = this.adjustPriorityByUserPreferences(
      basePriority,
      userPreferences,
    );

    // 3. 基于上下文信息调整优先级
    basePriority = this.adjustPriorityByContext(basePriority, context);

    // 4. 基于时间因素调整优先级
    basePriority = this.adjustPriorityByTime(basePriority, context);

    return basePriority;
  }

  /**
   * @method validatePushNotifBatch
   * @description 验证推送通知批量发送的有效性
   * @param {PushNotifEntity[]} pushNotifs 推送通知列表
   * @returns {Promise<{ valid: PushNotifEntity[]; invalid: PushNotifEntity[] }>} 验证结果
   */
  async validatePushNotifBatch(
    pushNotifs: PushNotifEntity[],
  ): Promise<{ valid: PushNotifEntity[]; invalid: PushNotifEntity[] }> {
    const valid: PushNotifEntity[] = [];
    const invalid: PushNotifEntity[] = [];

    for (const pushNotif of pushNotifs) {
      const isValid = await this.validateSinglePushNotif(pushNotif);
      if (isValid) {
        valid.push(pushNotif);
      } else {
        invalid.push(pushNotif);
      }
    }

    return { valid, invalid };
  }

  /**
   * @method calculatePushNotifMetrics
   * @description 计算推送通知的指标数据
   * @param {PushNotifEntity[]} pushNotifs 推送通知列表
   * @returns {Record<string, any>} 指标数据
   */
  calculatePushNotifMetrics(
    pushNotifs: PushNotifEntity[],
  ): Record<string, any> {
    const metrics = {
      total: pushNotifs.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      successRate: 0,
      averageRetryCount: 0,
      totalRetryCount: 0,
    };

    let successCount = 0;
    let totalRetryCount = 0;

    for (const pushNotif of pushNotifs) {
      // 按状态统计
      const status = pushNotif.getStatus().getValue();
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;

      // 按优先级统计
      const priority = pushNotif.getPriority().getValue();
      metrics.byPriority[priority] = (metrics.byPriority[priority] || 0) + 1;

      // 按平台统计
      const platform = pushNotif.getPushToken().getPlatform();
      metrics.byPlatform[platform] = (metrics.byPlatform[platform] || 0) + 1;

      // 成功统计
      if (pushNotif.isSent() || pushNotif.isDelivered()) {
        successCount++;
      }

      // 重试统计
      totalRetryCount += pushNotif.getRetryCount();
    }

    // 计算成功率
    metrics.successRate = metrics.total > 0 ? successCount / metrics.total : 0;

    // 计算平均重试次数
    metrics.totalRetryCount = totalRetryCount;
    metrics.averageRetryCount =
      metrics.total > 0 ? totalRetryCount / metrics.total : 0;

    return metrics;
  }

  /**
   * @method isValidPushToken
   * @description 验证推送令牌有效性
   * @param {PushToken} pushToken 推送令牌
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPushToken(pushToken: PushToken): boolean {
    try {
      // 这里可以添加更复杂的令牌验证逻辑
      // 比如检查令牌是否过期、是否被撤销等
      return pushToken.getValue().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * @method isValidPushContent
   * @description 验证推送内容有效性
   * @param {PushContent} content 推送内容
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPushContent(content: PushContent): boolean {
    try {
      // 检查内容长度
      const contentLength = content.getContentLength();
      if (contentLength.total > 2000) {
        return false;
      }

      // 检查是否包含敏感内容
      // const hasSensitiveContent = this.checkSensitiveContent(content);
      // if (hasSensitiveContent) {
      //   return false;
      // }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method isValidPushPriority
   * @description 验证推送优先级合理性
   * @param {PushPriorityLevel} priority 推送优先级
   * @returns {boolean} 是否合理
   * @private
   */
  private isValidPushPriority(priority: PushPriorityLevel): boolean {
    return Object.values(PushPriorityLevel).includes(priority);
  }

  /**
   * @method validateSinglePushNotif
   * @description 验证单个推送通知
   * @param {PushNotifEntity} pushNotif 推送通知实体
   * @returns {Promise<boolean>} 是否有效
   * @private
   */
  private async validateSinglePushNotif(
    pushNotif: PushNotifEntity,
  ): Promise<boolean> {
    // 检查基本属性
    if (!pushNotif.id || !pushNotif.tenantId || !pushNotif.userId) {
      return false;
    }

    // 检查推送令牌
    if (!this.isValidPushToken(pushNotif.getPushToken())) {
      return false;
    }

    // 检查推送内容
    if (!this.isValidPushContent(pushNotif.getContent())) {
      return false;
    }

    // 检查推送优先级
    if (!this.isValidPushPriority(pushNotif.getPriority().getValue())) {
      return false;
    }

    // 检查状态一致性
    if (!this.isStatusConsistent(pushNotif)) {
      return false;
    }

    return true;
  }

  /**
   * @method isStatusConsistent
   * @description 检查状态一致性
   * @param {PushNotifEntity} pushNotif 推送通知实体
   * @returns {boolean} 是否一致
   * @private
   */
  private isStatusConsistent(pushNotif: PushNotifEntity): boolean {
    const status = pushNotif.getStatus();
    const sentAt = pushNotif.getSentAt();
    const deliveredAt = pushNotif.getDeliveredAt();
    const failureReason = pushNotif.getFailureReason();

    // 已发送状态必须有发送时间
    if (status.isSent() && !sentAt) {
      return false;
    }

    // 已送达状态必须有送达时间
    if (status.isDelivered() && !deliveredAt) {
      return false;
    }

    // 失败状态必须有失败原因
    if (status.isFailed() && !failureReason) {
      return false;
    }

    // 已送达时间不能早于发送时间
    if (sentAt && deliveredAt && deliveredAt < sentAt) {
      return false;
    }

    return true;
  }

  /**
   * @method getBasePriorityByContentType
   * @description 基于内容类型获取基础优先级
   * @param {PushContent} content 推送内容
   * @returns {PushPriorityLevel} 基础优先级
   * @private
   */
  private getBasePriorityByContentType(
    content: PushContent,
  ): PushPriorityLevel {
    const title = content.getTitle().toLowerCase();
    const body = content.getBody().toLowerCase();

    // 紧急内容
    if (
      title.includes('紧急') ||
      title.includes('urgent') ||
      body.includes('紧急') ||
      body.includes('urgent')
    ) {
      return PushPriorityLevel.CRITICAL;
    }

    // 重要内容
    if (
      title.includes('重要') ||
      title.includes('important') ||
      body.includes('重要') ||
      body.includes('important')
    ) {
      return PushPriorityLevel.HIGH;
    }

    // 默认普通优先级
    return PushPriorityLevel.NORMAL;
  }

  /**
   * @method adjustPriorityByUserPreferences
   * @description 基于用户偏好调整优先级
   * @param {PushPriorityLevel} priority 当前优先级
   * @param {Record<string, any>} userPreferences 用户偏好
   * @returns {PushPriorityLevel} 调整后的优先级
   * @private
   */
  private adjustPriorityByUserPreferences(
    priority: PushPriorityLevel,
    userPreferences: Record<string, any>,
  ): PushPriorityLevel {
    // 如果用户偏好低优先级，则降低优先级
    if (userPreferences.preferLowPriority) {
      switch (priority) {
        case PushPriorityLevel.CRITICAL:
          return PushPriorityLevel.HIGH;
        case PushPriorityLevel.HIGH:
          return PushPriorityLevel.NORMAL;
        case PushPriorityLevel.NORMAL:
          return PushPriorityLevel.LOW;
        default:
          return priority;
      }
    }

    return priority;
  }

  /**
   * @method adjustPriorityByContext
   * @description 基于上下文信息调整优先级
   * @param {PushPriorityLevel} priority 当前优先级
   * @param {Record<string, any>} context 上下文信息
   * @returns {PushPriorityLevel} 调整后的优先级
   * @private
   */
  private adjustPriorityByContext(
    priority: PushPriorityLevel,
    context: Record<string, any>,
  ): PushPriorityLevel {
    // 如果是在工作时间，可以提高优先级
    if (context.isWorkingHours) {
      switch (priority) {
        case PushPriorityLevel.LOW:
          return PushPriorityLevel.NORMAL;
        case PushPriorityLevel.NORMAL:
          return PushPriorityLevel.HIGH;
        default:
          return priority;
      }
    }

    // 如果是在非工作时间，可以降低优先级
    if (context.isNonWorkingHours) {
      switch (priority) {
        case PushPriorityLevel.CRITICAL:
          return PushPriorityLevel.HIGH;
        case PushPriorityLevel.HIGH:
          return PushPriorityLevel.NORMAL;
        case PushPriorityLevel.NORMAL:
          return PushPriorityLevel.LOW;
        default:
          return priority;
      }
    }

    return priority;
  }

  /**
   * @method adjustPriorityByTime
   * @description 基于时间因素调整优先级
   * @param {PushPriorityLevel} priority 当前优先级
   * @param {Record<string, any>} context 上下文信息
   * @returns {PushPriorityLevel} 调整后的优先级
   * @private
   */
  private adjustPriorityByTime(
    priority: PushPriorityLevel,
    context: Record<string, any>,
  ): PushPriorityLevel {
    const now = new Date();
    const hour = now.getHours();

    // 深夜时间（22:00-06:00）降低优先级
    if (hour >= 22 || hour < 6) {
      switch (priority) {
        case PushPriorityLevel.CRITICAL:
          return PushPriorityLevel.HIGH;
        case PushPriorityLevel.HIGH:
          return PushPriorityLevel.NORMAL;
        case PushPriorityLevel.NORMAL:
          return PushPriorityLevel.LOW;
        default:
          return priority;
      }
    }

    return priority;
  }
}
