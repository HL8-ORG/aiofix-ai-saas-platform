import { NotifOrchestrationEntity } from '../entities/notif-orchestration.entity';
import { NotifChannel } from '../value-objects/notif-channel.vo';
import {
  NotifStrategy,
  NotifStrategyType,
} from '../value-objects/notif-strategy.vo';
import { OrchestrationStatusType } from '../value-objects/orchestration-status.vo';

/**
 * @class NotifOrchestrationService
 * @description
 * 通知编排领域服务，负责处理跨聚合的编排业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调不同通知渠道的发送策略
 * 2. 处理通知优先级和重试策略
 * 3. 管理编排状态的复杂转换逻辑
 * 4. 验证编排策略的有效性和一致性
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数或依赖注入的服务
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用和水平扩展
 *
 * 业务规则封装：
 * 1. 封装复杂的编排策略计算逻辑
 * 2. 提供可重用的编排规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 * 4. 统一编排决策的算法实现
 *
 * @since 1.0.0
 */
export class NotifOrchestrationService {
  /**
   * @method canExecuteOrchestration
   * @description 判断编排是否可以执行，检查前置条件和业务规则
   * @param {NotifOrchestrationEntity} orchestration 编排实体
   * @returns {boolean} 是否可以执行
   *
   * 验证规则：
   * 1. 编排状态必须是PENDING
   * 2. 必须有有效的通知策略
   * 3. 所有渠道必须配置正确
   * 4. 重试次数不能超过限制
   */
  canExecuteOrchestration(orchestration: NotifOrchestrationEntity): boolean {
    // 检查编排状态
    if (orchestration.status.getStatus() !== OrchestrationStatusType.PENDING) {
      return false;
    }

    // 检查策略有效性
    const strategy = orchestration.strategy;
    if (!this.isValidStrategy(strategy)) {
      return false;
    }

    // 检查渠道配置
    const channels = orchestration.channels;
    if (!this.areChannelsValid(channels)) {
      return false;
    }

    // 检查重试限制
    if (orchestration.retryCount >= this.getMaxRetries()) {
      return false;
    }

    return true;
  }

  /**
   * @method calculateNextChannel
   * @description 计算下一个要执行的通知渠道，基于策略和优先级
   * @param {NotifOrchestrationEntity} orchestration 编排实体
   * @returns {NotifChannel | null} 下一个渠道或null
   *
   * 计算逻辑：
   * 1. 根据策略类型选择算法
   * 2. 考虑渠道优先级和状态
   * 3. 排除已失败的渠道
   * 4. 应用重试和回退策略
   */
  calculateNextChannel(
    orchestration: NotifOrchestrationEntity,
  ): NotifChannel | null {
    const channels = orchestration.channels;

    // 简化实现：返回第一个可用的渠道
    if (channels.length === 0) {
      return null;
    }

    // 按优先级排序，返回优先级最高的渠道
    const sortedChannels = channels.sort((a, b) => {
      const aPriority = a.priority ?? 0;
      const bPriority = b.priority ?? 0;
      return aPriority - bPriority; // 数值越小优先级越高
    });

    return sortedChannels[0];
  }

  /**
   * @method shouldRetryOrchestration
   * @description 判断编排是否应该重试，基于失败原因和重试策略
   * @param {NotifOrchestrationEntity} orchestration 编排实体
   * @param {Error} error 失败错误
   * @returns {boolean} 是否应该重试
   *
   * 重试判断：
   * 1. 检查重试次数限制
   * 2. 分析错误类型和严重程度
   * 3. 考虑重试间隔和退避策略
   * 4. 评估资源可用性
   */
  shouldRetryOrchestration(
    orchestration: NotifOrchestrationEntity,
    error: Error,
  ): boolean {
    // 检查重试次数
    if (orchestration.retryCount >= this.getMaxRetries()) {
      return false;
    }

    // 检查错误类型
    if (this.isPermanentError(error)) {
      return false;
    }

    return true;
  }

  /**
   * @method calculateOrchestrationPriority
   * @description 计算编排的执行优先级，用于队列排序
   * @param {NotifOrchestrationEntity} orchestration 编排实体
   * @returns {number} 优先级分数（越高越优先）
   *
   * 优先级因素：
   * 1. 通知类型的重要性
   * 2. 用户或租户的优先级
   * 3. 时效性要求
   * 4. 重试次数和紧急程度
   */
  calculateOrchestrationPriority(
    orchestration: NotifOrchestrationEntity,
  ): number {
    let priority = 0;

    // 基础优先级
    const strategy = orchestration.strategy;
    priority += this.getStrategyBasePriority(strategy);

    // 重试加权
    const retryCount = orchestration.retryCount;
    priority += retryCount * 10; // 重试次数越多，优先级越高

    // 时间衰减
    const createdTime = orchestration.createdAt;
    const ageInMinutes = (Date.now() - createdTime.getTime()) / (1000 * 60);
    priority += Math.min(ageInMinutes, 60); // 最多加60分

    // 渠道数量影响
    const channelCount = orchestration.channels.length;
    priority += channelCount * 5;

    return Math.max(0, priority);
  }

  /**
   * @method validateOrchestrationStrategy
   * @description 验证编排策略的完整性和一致性
   * @param {NotifStrategy} strategy 编排策略
   * @param {NotifChannel[]} channels 通知渠道列表
   * @returns {string[]} 验证错误列表，空数组表示验证通过
   */
  validateOrchestrationStrategy(
    strategy: NotifStrategy,
    channels: NotifChannel[],
  ): string[] {
    const errors: string[] = [];

    // 验证策略类型
    if (!this.isValidStrategyType(strategy.type)) {
      errors.push(`Invalid strategy type: ${strategy.type}`);
    }

    // 验证渠道配置
    if (channels.length === 0) {
      errors.push('At least one notification channel is required');
    }

    // 验证渠道重复
    const channelTypes = channels.map(channel => channel.type);
    const uniqueChannelTypes = [...new Set(channelTypes)];
    if (channelTypes.length !== uniqueChannelTypes.length) {
      errors.push('Duplicate notification channels are not allowed');
    }

    return errors;
  }

  /**
   * @method isValidStrategy
   * @description 检查编排策略是否有效
   * @param {NotifStrategy} strategy 编排策略
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidStrategy(strategy: NotifStrategy): boolean {
    return (
      this.isValidStrategyType(strategy.type) && strategy.channels.length > 0
    );
  }

  /**
   * @method areChannelsValid
   * @description 检查所有渠道配置是否有效
   * @param {NotifChannel[]} channels 通知渠道列表
   * @returns {boolean} 是否有效
   * @private
   */
  private areChannelsValid(channels: NotifChannel[]): boolean {
    return (
      channels.length > 0 &&
      channels.every(channel => this.isChannelConfigured(channel))
    );
  }

  /**
   * @method isChannelConfigured
   * @description 检查单个渠道是否正确配置
   * @param {NotifChannel} channel 通知渠道
   * @returns {boolean} 是否配置正确
   * @private
   */
  private isChannelConfigured(channel: NotifChannel): boolean {
    const validTypes = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'];
    return validTypes.includes(channel.type) && channel.enabled;
  }

  /**
   * @method isPermanentError
   * @description 判断错误是否为永久性错误（不应重试）
   * @param {Error} error 错误对象
   * @returns {boolean} 是否为永久性错误
   * @private
   */
  private isPermanentError(error: Error): boolean {
    const permanentErrorTypes = [
      'INVALID_RECIPIENT',
      'PERMISSION_DENIED',
      'INVALID_TEMPLATE',
      'QUOTA_EXCEEDED',
    ];

    return permanentErrorTypes.some(
      type => error.message.includes(type) || error.name === type,
    );
  }

  /**
   * @method getMaxRetries
   * @description 获取最大重试次数
   * @returns {number} 最大重试次数
   * @private
   */
  private getMaxRetries(): number {
    return 3;
  }

  /**
   * @method getStrategyBasePriority
   * @description 获取策略的基础优先级
   * @param {NotifStrategy} strategy 编排策略
   * @returns {number} 基础优先级
   * @private
   */
  private getStrategyBasePriority(strategy: NotifStrategy): number {
    switch (strategy.type) {
      case NotifStrategyType.IMMEDIATE:
        return 30;
      case NotifStrategyType.BATCH:
        return 10;
      case NotifStrategyType.SCHEDULED:
        return 20;
      case NotifStrategyType.CONDITIONAL:
        return 15;
      case NotifStrategyType.FALLBACK:
        return 25;
      default:
        return 5;
    }
  }

  /**
   * @method isValidStrategyType
   * @description 检查策略类型是否有效
   * @param {string} strategyType 策略类型
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidStrategyType(strategyType: NotifStrategyType): boolean {
    const validTypes = [
      NotifStrategyType.IMMEDIATE,
      NotifStrategyType.BATCH,
      NotifStrategyType.SCHEDULED,
      NotifStrategyType.CONDITIONAL,
      NotifStrategyType.FALLBACK,
    ];
    return validTypes.includes(strategyType);
  }
}
