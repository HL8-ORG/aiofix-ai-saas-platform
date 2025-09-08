import { ValueObject } from '@aiofix/core';
import {
  NotifChannel,
  NotifChannelType,
  ChannelPriority,
} from './notif-channel.vo';

/**
 * 通知策略类型枚举
 * 定义不同的通知发送策略
 */
export enum NotifStrategyType {
  IMMEDIATE = 'immediate',
  BATCH = 'batch',
  SCHEDULED = 'scheduled',
  CONDITIONAL = 'conditional',
  FALLBACK = 'fallback',
}

/**
 * 通知策略值对象
 * 封装通知发送策略的相关信息，包括策略类型、渠道配置、条件等
 *
 * 业务规则：
 * 1. 策略类型必须有效
 * 2. 渠道列表不能为空
 * 3. 渠道必须按优先级排序
 * 4. 条件配置必须有效
 */
export class NotifStrategy extends ValueObject<{
  strategyId: string;
  name: string;
  type: NotifStrategyType;
  channels: NotifChannel[];
  conditions?: Record<string, unknown>;
  fallbackChannels?: NotifChannel[];
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  scheduledAt?: Date;
}> {
  constructor(props: {
    strategyId: string;
    name: string;
    type: NotifStrategyType;
    channels: NotifChannel[];
    conditions?: Record<string, unknown>;
    fallbackChannels?: NotifChannel[];
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    scheduledAt?: Date;
  }) {
    super(props);
    this.validate();
  }

  /**
   * 获取策略ID
   */
  get strategyId(): string {
    return this.value.strategyId;
  }

  /**
   * 获取策略名称
   */
  get name(): string {
    return this.value.name;
  }

  /**
   * 获取策略类型
   */
  get type(): NotifStrategyType {
    return this.value.type;
  }

  /**
   * 获取渠道列表
   */
  get channels(): NotifChannel[] {
    return this.value.channels;
  }

  /**
   * 获取条件配置
   */
  get conditions(): Record<string, unknown> | undefined {
    return this.value.conditions;
  }

  /**
   * 获取备用渠道列表
   */
  get fallbackChannels(): NotifChannel[] | undefined {
    return this.value.fallbackChannels;
  }

  /**
   * 获取最大重试次数
   */
  get maxRetries(): number | undefined {
    return this.value.maxRetries;
  }

  /**
   * 获取重试延迟
   */
  get retryDelay(): number | undefined {
    return this.value.retryDelay;
  }

  /**
   * 获取批处理大小
   */
  get batchSize(): number | undefined {
    return this.value.batchSize;
  }

  /**
   * 获取计划发送时间
   */
  get scheduledAt(): Date | undefined {
    return this.value.scheduledAt;
  }

  /**
   * 验证策略配置
   */
  private validate(): void {
    if (!this.value.strategyId || this.value.strategyId.trim().length === 0) {
      throw new InvalidNotifStrategyError('策略ID不能为空');
    }

    if (!this.value.name || this.value.name.trim().length === 0) {
      throw new InvalidNotifStrategyError('策略名称不能为空');
    }

    if (!Object.values(NotifStrategyType).includes(this.value.type)) {
      throw new InvalidNotifStrategyError(`无效的策略类型: ${this.value.type}`);
    }

    if (!this.value.channels || this.value.channels.length === 0) {
      throw new InvalidNotifStrategyError('渠道列表不能为空');
    }

    // 验证渠道配置
    this.validateChannels();

    // 验证策略特定配置
    this.validateStrategy();
  }

  /**
   * 验证渠道配置
   */
  private validateChannels(): void {
    const channelTypes = new Set<NotifChannelType>();

    for (const channel of this.value.channels) {
      // 检查渠道类型重复
      if (channelTypes.has(channel.type)) {
        throw new InvalidNotifStrategyError(`渠道类型 ${channel.type} 重复`);
      }
      channelTypes.add(channel.type);

      // 检查渠道是否启用
      if (!channel.enabled) {
        throw new InvalidNotifStrategyError(`渠道 ${channel.name} 未启用`);
      }
    }

    // 验证渠道优先级排序
    this.validateChannelPriority();
  }

  /**
   * 验证渠道优先级排序
   */
  private validateChannelPriority(): void {
    const sortedChannels = [...this.value.channels].sort((a, b) =>
      a.comparePriority(b),
    );

    for (let i = 0; i < this.value.channels.length; i++) {
      if (this.value.channels[i].priority !== sortedChannels[i].priority) {
        throw new InvalidNotifStrategyError('渠道必须按优先级排序');
      }
    }
  }

  /**
   * 验证策略特定配置
   */
  private validateStrategy(): void {
    switch (this.value.type) {
      case NotifStrategyType.IMMEDIATE:
        this.validateImmediateStrategy();
        break;
      case NotifStrategyType.BATCH:
        this.validateBatchStrategy();
        break;
      case NotifStrategyType.SCHEDULED:
        this.validateScheduledStrategy();
        break;
      case NotifStrategyType.CONDITIONAL:
        this.validateConditionalStrategy();
        break;
      case NotifStrategyType.FALLBACK:
        this.validateFallbackStrategy();
        break;
    }
  }

  /**
   * 验证立即发送策略
   */
  private validateImmediateStrategy(): void {
    if (this.value.scheduledAt) {
      throw new InvalidNotifStrategyError('立即发送策略不能设置计划时间');
    }
    if (this.value.batchSize && this.value.batchSize > 1) {
      throw new InvalidNotifStrategyError('立即发送策略的批处理大小必须为1');
    }
  }

  /**
   * 验证批处理策略
   */
  private validateBatchStrategy(): void {
    if (!this.value.batchSize || this.value.batchSize < 2) {
      throw new InvalidNotifStrategyError('批处理策略的批处理大小必须大于1');
    }
    if (this.value.scheduledAt) {
      throw new InvalidNotifStrategyError('批处理策略不能设置计划时间');
    }
  }

  /**
   * 验证计划发送策略
   */
  private validateScheduledStrategy(): void {
    if (!this.value.scheduledAt) {
      throw new InvalidNotifStrategyError('计划发送策略必须设置计划时间');
    }
    if (this.value.scheduledAt <= new Date()) {
      throw new InvalidNotifStrategyError('计划时间必须是未来时间');
    }
  }

  /**
   * 验证条件发送策略
   */
  private validateConditionalStrategy(): void {
    if (
      !this.value.conditions ||
      Object.keys(this.value.conditions).length === 0
    ) {
      throw new InvalidNotifStrategyError('条件发送策略必须设置条件');
    }
  }

  /**
   * 验证备用策略
   */
  private validateFallbackStrategy(): void {
    if (
      !this.value.fallbackChannels ||
      this.value.fallbackChannels.length === 0
    ) {
      throw new InvalidNotifStrategyError('备用策略必须设置备用渠道');
    }

    // 验证备用渠道
    for (const channel of this.value.fallbackChannels) {
      if (!channel.enabled) {
        throw new InvalidNotifStrategyError(`备用渠道 ${channel.name} 未启用`);
      }
    }
  }

  /**
   * 检查策略是否满足条件
   */
  isConditionMet(context: Record<string, unknown>): boolean {
    if (!this.value.conditions) {
      return true;
    }

    return Object.entries(this.value.conditions).every(([key, value]) => {
      return context[key] === value;
    });
  }

  /**
   * 获取启用的渠道列表
   */
  getEnabledChannels(): NotifChannel[] {
    return this.value.channels.filter(channel => channel.enabled);
  }

  /**
   * 获取指定类型的渠道
   */
  getChannelsByType(type: NotifChannelType): NotifChannel[] {
    return this.value.channels.filter(channel => channel.type === type);
  }

  /**
   * 获取最高优先级的渠道
   */
  getHighestPriorityChannel(): NotifChannel | undefined {
    const enabledChannels = this.getEnabledChannels();
    if (enabledChannels.length === 0) {
      return undefined;
    }

    return enabledChannels.reduce((highest, current) =>
      current.priority < highest.priority ? current : highest,
    );
  }

  /**
   * 添加渠道
   */
  addChannel(channel: NotifChannel): NotifStrategy {
    const newChannels = [...this.value.channels, channel];
    // 按优先级重新排序
    newChannels.sort((a, b) => a.comparePriority(b));

    return new NotifStrategy({
      ...this.value,
      channels: newChannels,
    });
  }

  /**
   * 移除渠道
   */
  removeChannel(channelType: NotifChannelType): NotifStrategy {
    const newChannels = this.value.channels.filter(
      channel => channel.type !== channelType,
    );

    return new NotifStrategy({
      ...this.value,
      channels: newChannels,
    });
  }

  /**
   * 更新策略配置
   */
  updateConfig(
    config: Partial<{
      name: string;
      conditions: Record<string, unknown>;
      maxRetries: number;
      retryDelay: number;
      batchSize: number;
      scheduledAt: Date;
    }>,
  ): NotifStrategy {
    return new NotifStrategy({
      ...this.value,
      ...config,
    });
  }

  /**
   * 创建备用策略
   */
  createFallbackStrategy(fallbackChannels: NotifChannel[]): NotifStrategy {
    return new NotifStrategy({
      ...this.value,
      type: NotifStrategyType.FALLBACK,
      fallbackChannels,
    });
  }

  /**
   * 获取策略摘要信息
   */
  getSummary(): Record<string, unknown> {
    return {
      strategyId: this.value.strategyId,
      name: this.value.name,
      type: this.value.type,
      channelCount: this.value.channels.length,
      hasConditions: !!this.value.conditions,
      hasFallbackChannels: !!this.value.fallbackChannels,
      maxRetries: this.value.maxRetries,
      batchSize: this.value.batchSize,
      scheduledAt: this.value.scheduledAt,
    };
  }
}

/**
 * 无效通知策略错误
 */
export class InvalidNotifStrategyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifStrategyError';
  }
}
