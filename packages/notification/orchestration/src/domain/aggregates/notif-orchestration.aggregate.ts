import { EventSourcedAggregateRoot } from '@aiofix/core';
import { NotifOrchestrationEntity } from '../entities/notif-orchestration.entity';
import {
  NotifChannel,
  NotifChannelType,
} from '../value-objects/notif-channel.vo';
import { NotifStrategy } from '../value-objects/notif-strategy.vo';
import {
  OrchestrationStatus,
  OrchestrationStatusType,
} from '../value-objects/orchestration-status.vo';
import { NotifOrchestrationCreatedEvent } from '../events/notif-orchestration-created.event';
import { NotifOrchestrationStartedEvent } from '../events/notif-orchestration-started.event';
import { NotifOrchestrationCompletedEvent } from '../events/notif-orchestration-completed.event';
import { NotifOrchestrationFailedEvent } from '../events/notif-orchestration-failed.event';
import { NotifOrchestrationRetryingEvent } from '../events/notif-orchestration-retrying.event';
import { NotifOrchestrationCancelledEvent } from '../events/notif-orchestration-cancelled.event';

/**
 * 通知编排聚合根
 *
 * 负责管理通知编排的业务协调和事件发布。
 *
 * 聚合根职责：
 * - 协调通知编排的创建、执行和状态管理
 * - 发布通知编排相关的领域事件
 * - 维护通知编排的业务不变性
 * - 处理通知编排的复杂业务逻辑
 *
 * 业务协调：
 * - 通知编排创建和初始化
 * - 通知编排执行流程管理
 * - 通知编排状态转换控制
 * - 通知编排重试机制管理
 *
 * 事件发布：
 * - 通知编排创建事件
 * - 通知编排状态变更事件
 * - 通知编排执行结果事件
 * - 通知编排重试事件
 *
 * @class NotifOrchestration
 * @extends EventSourcedAggregateRoot
 */
export class NotifOrchestration extends EventSourcedAggregateRoot {
  private constructor(
    private readonly orchestration: NotifOrchestrationEntity,
  ) {
    super();
  }

  /**
   * 创建通知编排聚合根
   *
   * @param {string} id 编排ID
   * @param {string} tenantId 租户ID
   * @param {string} userId 用户ID
   * @param {string} notificationId 通知ID
   * @param {NotifStrategy} strategy 通知策略
   * @param {NotifChannel[]} channels 通知渠道列表
   * @param {Record<string, unknown>} context 上下文信息
   * @param {string} [createdBy] 创建者
   * @returns {NotifOrchestration} 通知编排聚合根
   */
  public static create(
    id: string,
    tenantId: string,
    userId: string,
    notificationId: string,
    strategy: NotifStrategy,
    channels: NotifChannel[],
    context: Record<string, unknown>,
    createdBy: string = 'system',
  ): NotifOrchestration {
    const status = OrchestrationStatus.create(OrchestrationStatusType.PENDING);
    const orchestration = new NotifOrchestrationEntity(
      id,
      tenantId,
      userId,
      notificationId,
      strategy,
      channels,
      status,
      context,
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      3,
      createdBy,
    );

    const aggregate = new NotifOrchestration(orchestration);

    // 发布创建事件
    aggregate.addDomainEvent(
      new NotifOrchestrationCreatedEvent(
        id,
        tenantId,
        userId,
        notificationId,
        strategy,
        channels,
        context,
        createdBy,
      ),
    );

    return aggregate;
  }

  /**
   * 从实体重建聚合根
   *
   * @param {NotifOrchestrationEntity} orchestration 通知编排实体
   * @returns {NotifOrchestration} 通知编排聚合根
   */
  public static fromEntity(
    orchestration: NotifOrchestrationEntity,
  ): NotifOrchestration {
    return new NotifOrchestration(orchestration);
  }

  /**
   * 获取通知编排实体
   *
   * @returns {NotifOrchestrationEntity} 通知编排实体
   */
  public getOrchestration(): NotifOrchestrationEntity {
    return this.orchestration;
  }

  /**
   * 获取编排ID
   *
   * @returns {string} 编排ID
   */
  public getId(): string {
    return this.orchestration.id;
  }

  /**
   * 获取租户ID
   *
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.orchestration.tenantId;
  }

  /**
   * 获取用户ID
   *
   * @returns {string} 用户ID
   */
  public getUserId(): string {
    return this.orchestration.userId;
  }

  /**
   * 获取通知ID
   *
   * @returns {string} 通知ID
   */
  public getNotificationId(): string {
    return this.orchestration.notificationId;
  }

  /**
   * 获取通知策略
   *
   * @returns {NotifStrategy} 通知策略
   */
  public getStrategy(): NotifStrategy {
    return this.orchestration.strategy;
  }

  /**
   * 获取通知渠道列表
   *
   * @returns {NotifChannel[]} 通知渠道列表
   */
  public getChannels(): NotifChannel[] {
    return this.orchestration.channels;
  }

  /**
   * 获取编排状态
   *
   * @returns {OrchestrationStatus} 编排状态
   */
  public getStatus(): OrchestrationStatus {
    return this.orchestration.status;
  }

  /**
   * 获取上下文信息
   *
   * @returns {Record<string, unknown>} 上下文信息
   */
  public getContext(): Record<string, unknown> {
    return this.orchestration.context;
  }

  /**
   * 获取调度时间
   *
   * @returns {Date | undefined} 调度时间
   */
  public getScheduledAt(): Date | undefined {
    return this.orchestration.scheduledAt;
  }

  /**
   * 获取开始时间
   *
   * @returns {Date | undefined} 开始时间
   */
  public getStartedAt(): Date | undefined {
    return this.orchestration.startedAt;
  }

  /**
   * 获取完成时间
   *
   * @returns {Date | undefined} 完成时间
   */
  public getCompletedAt(): Date | undefined {
    return this.orchestration.completedAt;
  }

  /**
   * 获取失败原因
   *
   * @returns {string | undefined} 失败原因
   */
  public getFailureReason(): string | undefined {
    return this.orchestration.failureReason;
  }

  /**
   * 获取重试次数
   *
   * @returns {number} 重试次数
   */
  public getRetryCount(): number {
    return this.orchestration.retryCount;
  }

  /**
   * 获取最大重试次数
   *
   * @returns {number} 最大重试次数
   */
  public getMaxRetries(): number {
    return this.orchestration.maxRetries;
  }

  /**
   * 检查是否可以重试
   *
   * @returns {boolean} 是否可以重试
   */
  public canRetry(): boolean {
    return this.orchestration.canRetry();
  }

  /**
   * 检查是否已完成
   *
   * @returns {boolean} 是否已完成
   */
  public isCompleted(): boolean {
    return this.orchestration.isCompleted();
  }

  /**
   * 检查是否已失败
   *
   * @returns {boolean} 是否已失败
   */
  public isFailed(): boolean {
    return this.orchestration.isFailed();
  }

  /**
   * 检查是否已取消
   *
   * @returns {boolean} 是否已取消
   */
  public isCancelled(): boolean {
    return this.orchestration.isCancelled();
  }

  /**
   * 检查是否正在运行
   *
   * @returns {boolean} 是否正在运行
   */
  public isRunning(): boolean {
    return this.orchestration.isRunning();
  }

  /**
   * 检查是否正在重试
   *
   * @returns {boolean} 是否正在重试
   */
  public isRetrying(): boolean {
    return this.orchestration.isRetrying();
  }

  /**
   * 开始编排
   *
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public start(): void {
    if (
      this.orchestration.status.getStatus() !== OrchestrationStatusType.PENDING
    ) {
      throw new InvalidNotifOrchestrationOperationError(
        '编排当前状态不允许开始',
      );
    }

    this.orchestration.start();

    // 发布开始事件
    this.addDomainEvent(
      new NotifOrchestrationStartedEvent(
        this.getId(),
        this.getTenantId(),
        this.getUserId(),
        this.getNotificationId(),
        this.getStrategy(),
        this.getChannels(),
        this.getContext(),
      ),
    );
  }

  /**
   * 完成编排
   *
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public complete(): void {
    if (
      this.orchestration.status.getStatus() !== OrchestrationStatusType.RUNNING
    ) {
      throw new InvalidNotifOrchestrationOperationError(
        '只有运行中状态的编排才能完成',
      );
    }

    this.orchestration.complete();

    // 发布完成事件
    this.addDomainEvent(
      new NotifOrchestrationCompletedEvent(
        this.getId(),
        this.getTenantId(),
        this.getUserId(),
        this.getNotificationId(),
        this.getStrategy(),
        this.getChannels(),
        this.getContext(),
        this.getCompletedAt()!,
      ),
    );
  }

  /**
   * 失败编排
   *
   * @param {string} reason 失败原因
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public fail(reason: string): void {
    if (
      this.orchestration.status.getStatus() !== OrchestrationStatusType.RUNNING
    ) {
      throw new InvalidNotifOrchestrationOperationError(
        '只有运行中状态的编排才能失败',
      );
    }

    this.orchestration.fail(reason);

    // 发布失败事件
    this.addDomainEvent(
      new NotifOrchestrationFailedEvent(
        this.getId(),
        this.getTenantId(),
        this.getUserId(),
        this.getNotificationId(),
        this.getStrategy(),
        this.getChannels(),
        this.getContext(),
        reason,
        this.getRetryCount(),
      ),
    );
  }

  /**
   * 重试编排
   *
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public retry(): void {
    if (!this.canRetry()) {
      throw new InvalidNotifOrchestrationOperationError(
        '编排当前状态不允许重试',
      );
    }

    this.orchestration.retry();

    // 发布重试事件
    this.addDomainEvent(
      new NotifOrchestrationRetryingEvent(
        this.getId(),
        this.getTenantId(),
        this.getUserId(),
        this.getNotificationId(),
        this.getStrategy(),
        this.getChannels(),
        this.getContext(),
        this.getRetryCount(),
      ),
    );
  }

  /**
   * 取消编排
   *
   * @param {string} reason 取消原因
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public cancel(reason?: string): void {
    if (this.orchestration.status.isFinalStatus()) {
      throw new InvalidNotifOrchestrationOperationError(
        '已完成状态的编排不能取消',
      );
    }

    this.orchestration.cancel(reason);

    // 发布取消事件
    this.addDomainEvent(
      new NotifOrchestrationCancelledEvent(
        this.getId(),
        this.getTenantId(),
        this.getUserId(),
        this.getNotificationId(),
        this.getStrategy(),
        this.getChannels(),
        this.getContext(),
        reason,
      ),
    );
  }

  /**
   * 设置计划时间
   *
   * @param {Date} scheduledAt 计划时间
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public setScheduledAt(scheduledAt: Date): void {
    if (
      this.orchestration.status.getStatus() !== OrchestrationStatusType.PENDING
    ) {
      throw new InvalidNotifOrchestrationOperationError(
        '只有待处理状态的编排才能设置计划时间',
      );
    }

    this.orchestration.setScheduledAt(scheduledAt);
  }

  /**
   * 更新上下文信息
   *
   * @param {Record<string, unknown>} context 新的上下文信息
   */
  public updateContext(context: Record<string, unknown>): void {
    this.orchestration.updateContext(context);
  }

  /**
   * 更新渠道列表
   *
   * @param {NotifChannel[]} channels 新的渠道列表
   * @throws {InvalidNotifOrchestrationOperationError} 当操作无效时抛出
   */
  public updateChannels(channels: NotifChannel[]): void {
    if (
      this.orchestration.status.getStatus() !== OrchestrationStatusType.PENDING
    ) {
      throw new InvalidNotifOrchestrationOperationError(
        '只有待处理状态的编排才能更新渠道',
      );
    }

    this.orchestration.updateChannels(channels);
  }

  /**
   * 获取指定类型的渠道
   *
   * @param {NotifChannelType} type 渠道类型
   * @returns {NotifChannel[]} 指定类型的渠道列表
   */
  public getChannelsByType(type: NotifChannelType): NotifChannel[] {
    return this.orchestration.getChannelsByType(type);
  }

  /**
   * 获取启用的渠道
   *
   * @returns {NotifChannel[]} 启用的渠道列表
   */
  public getEnabledChannels(): NotifChannel[] {
    return this.orchestration.getEnabledChannels();
  }

  /**
   * 获取最高优先级的渠道
   *
   * @returns {NotifChannel | undefined} 最高优先级的渠道
   */
  public getHighestPriorityChannel(): NotifChannel | undefined {
    return this.orchestration.getHighestPriorityChannel();
  }
}

/**
 * 无效通知编排操作错误
 */
export class InvalidNotifOrchestrationOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifOrchestrationOperationError';
  }
}
