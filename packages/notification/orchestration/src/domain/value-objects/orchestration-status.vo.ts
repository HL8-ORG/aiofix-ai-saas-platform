import { ValueObject } from '@aiofix/core';

/**
 * 通知编排状态值对象
 *
 * 封装通知编排的状态信息，包括状态转换和状态机验证。
 *
 * 业务规则：
 * - 状态转换必须遵循预定义的状态机
 * - 某些状态转换需要满足特定条件
 * - 状态变更必须记录时间戳和原因
 *
 * @class OrchestrationStatus
 * @extends ValueObject
 */
export class OrchestrationStatus extends ValueObject<{
  readonly status: OrchestrationStatusType;
  readonly timestamp: Date;
  readonly reason?: string;
  readonly progress: number;
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly failedSteps: number;
}> {
  /**
   * 创建通知编排状态值对象
   *
   * @param {OrchestrationStatusType} status 状态类型
   * @param {string} [reason] 状态原因
   * @param {number} [progress] 进度百分比
   * @param {number} [totalSteps] 总步骤数
   * @param {number} [completedSteps] 已完成步骤数
   * @param {number} [failedSteps] 失败步骤数
   * @returns {OrchestrationStatus} 通知编排状态值对象
   */
  constructor(data: {
    status: OrchestrationStatusType;
    timestamp: Date;
    reason?: string;
    progress: number;
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
  }) {
    super(data);
  }

  public static create(
    status: OrchestrationStatusType,
    reason?: string,
    progress: number = 0,
    totalSteps: number = 0,
    completedSteps: number = 0,
    failedSteps: number = 0,
  ): OrchestrationStatus {
    return new OrchestrationStatus({
      status,
      timestamp: new Date(),
      reason,
      progress,
      totalSteps,
      completedSteps,
      failedSteps,
    });
  }

  /**
   * 获取状态类型
   *
   * @returns {OrchestrationStatusType} 状态类型
   */
  public getStatus(): OrchestrationStatusType {
    return this.value.status;
  }

  /**
   * 获取状态时间戳
   *
   * @returns {Date} 状态时间戳
   */
  public getTimestamp(): Date {
    return this.value.timestamp;
  }

  /**
   * 获取状态原因
   *
   * @returns {string | undefined} 状态原因
   */
  public getReason(): string | undefined {
    return this.value.reason;
  }

  /**
   * 获取进度百分比
   *
   * @returns {number} 进度百分比
   */
  public getProgress(): number {
    return this.value.progress;
  }

  /**
   * 获取总步骤数
   *
   * @returns {number} 总步骤数
   */
  public getTotalSteps(): number {
    return this.value.totalSteps;
  }

  /**
   * 获取已完成步骤数
   *
   * @returns {number} 已完成步骤数
   */
  public getCompletedSteps(): number {
    return this.value.completedSteps;
  }

  /**
   * 获取失败步骤数
   *
   * @returns {number} 失败步骤数
   */
  public getFailedSteps(): number {
    return this.value.failedSteps;
  }

  /**
   * 检查是否为最终状态
   *
   * @returns {boolean} 是否为最终状态
   */
  public isFinalStatus(): boolean {
    return [
      OrchestrationStatusType.COMPLETED,
      OrchestrationStatusType.FAILED,
      OrchestrationStatusType.CANCELLED,
    ].includes(this.value.status);
  }

  /**
   * 检查是否为失败状态
   *
   * @returns {boolean} 是否为失败状态
   */
  public isFailedStatus(): boolean {
    return this.value.status === OrchestrationStatusType.FAILED;
  }

  /**
   * 检查是否为成功状态
   *
   * @returns {boolean} 是否为成功状态
   */
  public isSuccessStatus(): boolean {
    return this.value.status === OrchestrationStatusType.COMPLETED;
  }

  /**
   * 检查是否正在处理中
   *
   * @returns {boolean} 是否正在处理中
   */
  public isProcessing(): boolean {
    return [
      OrchestrationStatusType.PENDING,
      OrchestrationStatusType.RUNNING,
      OrchestrationStatusType.RETRYING,
    ].includes(this.value.status);
  }

  /**
   * 状态转换
   *
   * @param {OrchestrationStatusType} newStatus 新状态
   * @param {string} [reason] 转换原因
   * @param {number} [progress] 进度百分比
   * @param {number} [totalSteps] 总步骤数
   * @param {number} [completedSteps] 已完成步骤数
   * @param {number} [failedSteps] 失败步骤数
   * @returns {OrchestrationStatus} 新的状态值对象
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public transitionTo(
    newStatus: OrchestrationStatusType,
    reason?: string,
    progress?: number,
    totalSteps?: number,
    completedSteps?: number,
    failedSteps?: number,
  ): OrchestrationStatus {
    this.validateTransition(newStatus);

    return new OrchestrationStatus({
      status: newStatus,
      timestamp: new Date(),
      reason,
      progress: progress ?? this.value.progress,
      totalSteps: totalSteps ?? this.value.totalSteps,
      completedSteps: completedSteps ?? this.value.completedSteps,
      failedSteps: failedSteps ?? this.value.failedSteps,
    });
  }

  /**
   * 更新进度
   *
   * @param {number} completedSteps 已完成步骤数
   * @param {number} [failedSteps] 失败步骤数
   * @returns {OrchestrationStatus} 新的状态值对象
   */
  public updateProgress(
    completedSteps: number,
    failedSteps?: number,
  ): OrchestrationStatus {
    const newFailedSteps = failedSteps ?? this.value.failedSteps;
    const progress =
      this.value.totalSteps > 0
        ? Math.round((completedSteps / this.value.totalSteps) * 100)
        : 0;

    return new OrchestrationStatus({
      status: this.value.status,
      timestamp: new Date(),
      reason: this.value.reason,
      progress,
      totalSteps: this.value.totalSteps,
      completedSteps,
      failedSteps: newFailedSteps,
    });
  }

  /**
   * 验证状态转换
   *
   * @param {OrchestrationStatusType} newStatus 新状态
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   * @private
   */
  private validateTransition(newStatus: OrchestrationStatusType): void {
    const currentStatus = this.value.status;

    // 如果状态相同，允许更新（用于更新进度等）
    if (currentStatus === newStatus) {
      return;
    }

    // 检查状态转换是否有效
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * 检查是否可以转换到指定状态
   *
   * @param {OrchestrationStatusType} newStatus 新状态
   * @returns {boolean} 是否可以转换
   * @private
   */
  private canTransitionTo(newStatus: OrchestrationStatusType): boolean {
    const currentStatus = this.value.status;

    // 定义状态转换规则
    const transitionRules: Record<
      OrchestrationStatusType,
      OrchestrationStatusType[]
    > = {
      [OrchestrationStatusType.PENDING]: [
        OrchestrationStatusType.RUNNING,
        OrchestrationStatusType.CANCELLED,
      ],
      [OrchestrationStatusType.RUNNING]: [
        OrchestrationStatusType.COMPLETED,
        OrchestrationStatusType.FAILED,
        OrchestrationStatusType.CANCELLED,
      ],
      [OrchestrationStatusType.RETRYING]: [
        OrchestrationStatusType.RUNNING,
        OrchestrationStatusType.FAILED,
        OrchestrationStatusType.CANCELLED,
      ],
      [OrchestrationStatusType.COMPLETED]: [], // 最终状态
      [OrchestrationStatusType.FAILED]: [], // 最终状态
      [OrchestrationStatusType.CANCELLED]: [], // 最终状态
    };

    return transitionRules[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * 获取状态描述
   *
   * @returns {string} 状态描述
   */
  public getStatusDescription(): string {
    const descriptions: Record<OrchestrationStatusType, string> = {
      [OrchestrationStatusType.PENDING]: '待处理',
      [OrchestrationStatusType.RUNNING]: '运行中',
      [OrchestrationStatusType.RETRYING]: '重试中',
      [OrchestrationStatusType.COMPLETED]: '已完成',
      [OrchestrationStatusType.FAILED]: '失败',
      [OrchestrationStatusType.CANCELLED]: '已取消',
    };

    return descriptions[this.value.status] || '未知状态';
  }

  /**
   * 获取状态优先级（用于排序）
   *
   * @returns {number} 状态优先级
   */
  public getStatusPriority(): number {
    const priorities: Record<OrchestrationStatusType, number> = {
      [OrchestrationStatusType.PENDING]: 1,
      [OrchestrationStatusType.RUNNING]: 2,
      [OrchestrationStatusType.RETRYING]: 3,
      [OrchestrationStatusType.COMPLETED]: 4,
      [OrchestrationStatusType.FAILED]: 5,
      [OrchestrationStatusType.CANCELLED]: 6,
    };

    return priorities[this.value.status] || 0;
  }

  /**
   * 获取状态摘要
   *
   * @returns {object} 状态摘要
   */
  public getSummary(): object {
    return {
      status: this.value.status,
      statusDescription: this.getStatusDescription(),
      timestamp: this.value.timestamp,
      reason: this.value.reason,
      progress: this.value.progress,
      totalSteps: this.value.totalSteps,
      completedSteps: this.value.completedSteps,
      failedSteps: this.value.failedSteps,
      isFinal: this.isFinalStatus(),
      isFailed: this.isFailedStatus(),
      isSuccess: this.isSuccessStatus(),
      isProcessing: this.isProcessing(),
    };
  }
}

/**
 * 通知编排状态类型枚举
 */
export enum OrchestrationStatusType {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  RETRYING = 'RETRYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * 无效状态转换错误
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
