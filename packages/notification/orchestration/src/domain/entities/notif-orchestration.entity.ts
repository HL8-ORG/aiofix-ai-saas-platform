import { BaseEntity } from '@aiofix/core';
import {
  NotifChannel,
  NotifChannelType,
} from '../value-objects/notif-channel.vo';
import { NotifStrategy } from '../value-objects/notif-strategy.vo';
import {
  OrchestrationStatus,
  OrchestrationStatusType,
} from '../value-objects/orchestration-status.vo';

/**
 * 通知编排状态验证器
 * 验证状态转换的合法性
 */
export class OrchestrationStatusValidator {
  /**
   * 状态转换规则
   */
  private readonly transitions: Map<
    OrchestrationStatusType,
    OrchestrationStatusType[]
  > = new Map([
    [
      OrchestrationStatusType.PENDING,
      [OrchestrationStatusType.RUNNING, OrchestrationStatusType.CANCELLED],
    ],
    [
      OrchestrationStatusType.RUNNING,
      [
        OrchestrationStatusType.COMPLETED,
        OrchestrationStatusType.FAILED,
        OrchestrationStatusType.CANCELLED,
      ],
    ],
    [OrchestrationStatusType.COMPLETED, []],
    [
      OrchestrationStatusType.FAILED,
      [OrchestrationStatusType.RETRYING, OrchestrationStatusType.CANCELLED],
    ],
    [
      OrchestrationStatusType.RETRYING,
      [
        OrchestrationStatusType.RUNNING,
        OrchestrationStatusType.FAILED,
        OrchestrationStatusType.CANCELLED,
      ],
    ],
    [OrchestrationStatusType.CANCELLED, []],
  ]);

  /**
   * 验证状态转换是否合法
   */
  canTransition(
    from: OrchestrationStatusType,
    to: OrchestrationStatusType,
  ): boolean {
    const allowedTransitions = this.transitions.get(from) ?? [];
    return allowedTransitions.includes(to);
  }

  /**
   * 获取允许的状态转换
   */
  getAllowedTransitions(
    from: OrchestrationStatusType,
  ): OrchestrationStatusType[] {
    return this.transitions.get(from) ?? [];
  }
}

/**
 * 通知编排实体
 * 管理通知编排的状态和业务规则
 *
 * 业务规则：
 * 1. 状态转换必须遵循预定义的状态机
 * 2. 重试次数不能超过最大重试次数
 * 3. 渠道配置必须有效
 * 4. 策略配置必须符合业务要求
 */
export class NotifOrchestrationEntity extends BaseEntity {
  private readonly statusValidator = new OrchestrationStatusValidator();

  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly notificationId: string,
    private readonly _strategy: NotifStrategy,
    private _channels: NotifChannel[],
    private _status: OrchestrationStatus,
    private _context: Record<string, unknown>,
    private _scheduledAt?: Date,
    private _startedAt?: Date,
    private _completedAt?: Date,
    private _failureReason?: string,
    private _retryCount: number = 0,
    private readonly _maxRetries: number = 3,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * 获取策略
   */
  get strategy(): NotifStrategy {
    return this._strategy;
  }

  /**
   * 获取渠道列表
   */
  get channels(): NotifChannel[] {
    return [...this._channels];
  }

  /**
   * 获取状态
   */
  get status(): OrchestrationStatus {
    return this._status;
  }

  /**
   * 获取上下文
   */
  get context(): Record<string, unknown> {
    return { ...this._context };
  }

  /**
   * 获取计划时间
   */
  get scheduledAt(): Date | undefined {
    return this._scheduledAt;
  }

  /**
   * 获取开始时间
   */
  get startedAt(): Date | undefined {
    return this._startedAt;
  }

  /**
   * 获取完成时间
   */
  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  /**
   * 获取失败原因
   */
  get failureReason(): string | undefined {
    return this._failureReason;
  }

  /**
   * 获取重试次数
   */
  get retryCount(): number {
    return this._retryCount;
  }

  /**
   * 获取最大重试次数
   */
  get maxRetries(): number {
    return this._maxRetries;
  }

  /**
   * 验证实体状态
   */
  protected validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidNotifOrchestrationError('编排ID不能为空');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new InvalidNotifOrchestrationError('租户ID不能为空');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new InvalidNotifOrchestrationError('用户ID不能为空');
    }

    if (!this.notificationId || this.notificationId.trim().length === 0) {
      throw new InvalidNotifOrchestrationError('通知ID不能为空');
    }

    if (!this._strategy) {
      throw new InvalidNotifOrchestrationError('策略不能为空');
    }

    if (!this._channels || this._channels.length === 0) {
      throw new InvalidNotifOrchestrationError('渠道列表不能为空');
    }

    if (!this._status) {
      throw new InvalidNotifOrchestrationError('状态不能为空');
    }

    if (this._retryCount < 0) {
      throw new InvalidNotifOrchestrationError('重试次数不能为负数');
    }

    if (this._maxRetries < 0) {
      throw new InvalidNotifOrchestrationError('最大重试次数不能为负数');
    }

    if (this._retryCount > this._maxRetries) {
      throw new InvalidNotifOrchestrationError('重试次数不能超过最大重试次数');
    }

    // 验证渠道配置
    this.validateChannels();

    // 验证状态一致性
    this.validateStatusConsistency();
  }

  /**
   * 验证渠道配置
   */
  private validateChannels(): void {
    const channelTypes = new Set<NotifChannelType>();

    for (const channel of this._channels) {
      // 检查渠道类型重复
      if (channelTypes.has(channel.type)) {
        throw new InvalidNotifOrchestrationError(
          `渠道类型 ${channel.type} 重复`,
        );
      }
      channelTypes.add(channel.type);
    }
  }

  /**
   * 验证状态一致性
   */
  private validateStatusConsistency(): void {
    const statusType = this._status.getStatus();

    // 根据状态验证时间字段
    switch (statusType) {
      case OrchestrationStatusType.PENDING:
        if (this._startedAt || this._completedAt) {
          throw new InvalidNotifOrchestrationError(
            '待处理状态不能有开始时间或完成时间',
          );
        }
        break;

      case OrchestrationStatusType.RUNNING:
        if (!this._startedAt) {
          throw new InvalidNotifOrchestrationError('运行状态必须有开始时间');
        }
        if (this._completedAt) {
          throw new InvalidNotifOrchestrationError('运行状态不能有完成时间');
        }
        break;

      case OrchestrationStatusType.COMPLETED:
        if (!this._startedAt || !this._completedAt) {
          throw new InvalidNotifOrchestrationError(
            '完成状态必须有开始时间和完成时间',
          );
        }
        if (this._failureReason) {
          throw new InvalidNotifOrchestrationError('完成状态不能有失败原因');
        }
        break;

      case OrchestrationStatusType.FAILED:
        if (!this._startedAt) {
          throw new InvalidNotifOrchestrationError('失败状态必须有开始时间');
        }
        if (!this._failureReason) {
          throw new InvalidNotifOrchestrationError('失败状态必须有失败原因');
        }
        break;

      case OrchestrationStatusType.RETRYING:
        if (!this._startedAt) {
          throw new InvalidNotifOrchestrationError('重试状态必须有开始时间');
        }
        if (this._completedAt) {
          throw new InvalidNotifOrchestrationError('重试状态不能有完成时间');
        }
        break;

      case OrchestrationStatusType.CANCELLED:
        if (this._completedAt && !this._failureReason) {
          throw new InvalidNotifOrchestrationError(
            '取消状态不能有完成时间且没有失败原因',
          );
        }
        break;
    }
  }

  /**
   * 开始执行编排
   */
  start(): void {
    if (
      !this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.RUNNING,
      )
    ) {
      throw new InvalidNotifOrchestrationError(
        `无法从状态 ${this._status.getStatus()} 转换到运行状态`,
      );
    }

    this._status = OrchestrationStatus.create(OrchestrationStatusType.RUNNING);
    this._startedAt = new Date();
    this._failureReason = undefined;
  }

  /**
   * 完成编排
   */
  complete(): void {
    if (
      !this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.COMPLETED,
      )
    ) {
      throw new InvalidNotifOrchestrationError(
        `无法从状态 ${this._status.getStatus()} 转换到完成状态`,
      );
    }

    this._status = OrchestrationStatus.create(
      OrchestrationStatusType.COMPLETED,
    );
    this._completedAt = new Date();
    this._failureReason = undefined;
  }

  /**
   * 失败编排
   */
  fail(reason: string): void {
    if (
      !this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.FAILED,
      )
    ) {
      throw new InvalidNotifOrchestrationError(
        `无法从状态 ${this._status.getStatus()} 转换到失败状态`,
      );
    }

    this._status = OrchestrationStatus.create(OrchestrationStatusType.FAILED);
    this._failureReason = reason;
  }

  /**
   * 重试编排
   */
  retry(): void {
    if (
      !this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.RETRYING,
      )
    ) {
      throw new InvalidNotifOrchestrationError(
        `无法从状态 ${this._status.getStatus()} 转换到重试状态`,
      );
    }

    if (this._retryCount >= this._maxRetries) {
      throw new InvalidNotifOrchestrationError('已达到最大重试次数');
    }

    this._status = OrchestrationStatus.create(OrchestrationStatusType.RETRYING);
    this._retryCount++;
    this._failureReason = undefined;
  }

  /**
   * 取消编排
   */
  cancel(reason?: string): void {
    if (
      !this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.CANCELLED,
      )
    ) {
      throw new InvalidNotifOrchestrationError(
        `无法从状态 ${this._status.getStatus()} 转换到取消状态`,
      );
    }

    this._status = OrchestrationStatus.create(
      OrchestrationStatusType.CANCELLED,
    );
    this._failureReason = reason;
    this._completedAt = new Date();
  }

  /**
   * 更新渠道列表
   */
  updateChannels(channels: NotifChannel[]): void {
    if (!channels || channels.length === 0) {
      throw new InvalidNotifOrchestrationError('渠道列表不能为空');
    }

    // 验证渠道配置
    const channelTypes = new Set<NotifChannelType>();
    for (const channel of channels) {
      if (channelTypes.has(channel.type)) {
        throw new InvalidNotifOrchestrationError(
          `渠道类型 ${channel.type} 重复`,
        );
      }
      channelTypes.add(channel.type);
    }

    this._channels = [...channels];
  }

  /**
   * 更新上下文
   */
  updateContext(context: Record<string, unknown>): void {
    this._context = { ...context };
  }

  /**
   * 设置计划时间
   */
  setScheduledAt(scheduledAt: Date): void {
    if (scheduledAt <= new Date()) {
      throw new InvalidNotifOrchestrationError('计划时间必须是未来时间');
    }

    this._scheduledAt = scheduledAt;
  }

  /**
   * 检查是否可以重试
   */
  canRetry(): boolean {
    return (
      this._retryCount < this._maxRetries &&
      this.statusValidator.canTransition(
        this._status.getStatus(),
        OrchestrationStatusType.RETRYING,
      )
    );
  }

  /**
   * 检查是否已完成
   */
  isCompleted(): boolean {
    return this._status.getStatus() === OrchestrationStatusType.COMPLETED;
  }

  /**
   * 检查是否已失败
   */
  isFailed(): boolean {
    return this._status.getStatus() === OrchestrationStatusType.FAILED;
  }

  /**
   * 检查是否已取消
   */
  isCancelled(): boolean {
    return this._status.getStatus() === OrchestrationStatusType.CANCELLED;
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this._status.getStatus() === OrchestrationStatusType.RUNNING;
  }

  /**
   * 检查是否正在重试
   */
  isRetrying(): boolean {
    return this._status.getStatus() === OrchestrationStatusType.RETRYING;
  }

  /**
   * 获取指定类型的渠道
   */
  getChannelsByType(type: NotifChannelType): NotifChannel[] {
    return this._channels.filter(channel => channel.type === type);
  }

  /**
   * 获取启用的渠道
   */
  getEnabledChannels(): NotifChannel[] {
    return this._channels.filter(channel => channel.enabled);
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
   * 获取实体ID，实现BaseEntity抽象方法
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.id;
  }

  /**
   * 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId;
  }
}

/**
 * 无效通知编排错误
 */
export class InvalidNotifOrchestrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifOrchestrationError';
  }
}
