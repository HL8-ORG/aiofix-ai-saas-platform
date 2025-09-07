import { IDomainEvent } from '@aiofix/core';
import { TenantId } from '../value-objects/tenant-id.vo';
import { TenantStatus } from '../value-objects/tenant-settings.vo';

/**
 * @class TenantStatusChangedEvent
 * @description
 * 租户状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户状态已成功变更
 * 2. 包含状态变更的详细信息
 * 3. 为其他聚合根提供租户状态变更通知
 *
 * 触发条件：
 * 1. 租户状态成功变更后自动触发
 * 2. 状态变更验证通过
 * 3. 状态机规则检查通过
 *
 * 影响范围：
 * 1. 通知相关模块更新租户状态
 * 2. 触发状态相关的业务流程
 * 3. 更新租户状态缓存
 * 4. 记录状态变更审计日志
 *
 * @property {TenantId} tenantId 租户ID
 * @property {TenantStatus} oldStatus 旧状态
 * @property {TenantStatus} newStatus 新状态
 * @property {string} reason 变更原因
 * @property {string} changedBy 变更者ID
 * @property {string} eventId 事件唯一标识符
 * @property {Date} occurredOn 事件发生时间
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {number} eventVersion 事件版本号
 *
 * @example
 * ```typescript
 * const event = new TenantStatusChangedEvent(
 *   new TenantId('tenant-123'),
 *   TenantStatus.PENDING,
 *   TenantStatus.ACTIVE,
 *   '租户激活',
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantStatusChangedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'TenantStatusChanged';
  public readonly aggregateId: string;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly tenantId: TenantId,
    public readonly oldStatus: TenantStatus,
    public readonly newStatus: TenantStatus,
    public readonly reason: string,
    public readonly changedBy: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = this.tenantId.value;
    this.validate();
  }

  /**
   * @method validate
   * @description 验证事件数据的有效性
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.oldStatus) {
      throw new Error('旧状态不能为空');
    }

    if (!this.newStatus) {
      throw new Error('新状态不能为空');
    }

    if (this.oldStatus === this.newStatus) {
      throw new Error('新状态不能与旧状态相同');
    }

    if (!this.reason || this.reason.trim().length === 0) {
      throw new Error('变更原因不能为空');
    }

    if (!this.changedBy || this.changedBy.trim().length === 0) {
      throw new Error('变更者ID不能为空');
    }

    // 验证状态转换的合法性
    this.validateStatusTransition();
  }

  /**
   * @method validateStatusTransition
   * @description 验证状态转换的合法性
   * @returns {void}
   * @throws {Error} 当状态转换不合法时抛出
   * @private
   */
  private validateStatusTransition(): void {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.PENDING]: [
        TenantStatus.ACTIVE,
        TenantStatus.DISABLED,
        TenantStatus.DELETED,
      ],
      [TenantStatus.ACTIVE]: [
        TenantStatus.DISABLED,
        TenantStatus.SUSPENDED,
        TenantStatus.DELETED,
      ],
      [TenantStatus.DISABLED]: [TenantStatus.ACTIVE, TenantStatus.DELETED],
      [TenantStatus.SUSPENDED]: [
        TenantStatus.ACTIVE,
        TenantStatus.DISABLED,
        TenantStatus.DELETED,
      ],
      [TenantStatus.DELETED]: [], // 删除状态不能转换到其他状态
    };

    const allowedTransitions = validTransitions[this.oldStatus];
    if (!allowedTransitions.includes(this.newStatus)) {
      throw new Error(
        `不能从状态 ${this.oldStatus} 转换到状态 ${this.newStatus}`,
      );
    }
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns {Record<string, unknown>} 事件数据
   */
  public getEventData(): Record<string, unknown> {
    return {
      tenantId: this.tenantId.value,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      reason: this.reason,
      changedBy: this.changedBy,
      transitionType: this.getTransitionType(),
      isActivation: this.isActivation(),
      isDeactivation: this.isDeactivation(),
      isSuspension: this.isSuspension(),
      isDeletion: this.isDeletion(),
    };
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      ...this.getEventData(),
    };
  }

  /**
   * @method getTransitionType
   * @description 获取状态转换类型
   * @returns {string} 状态转换类型
   */
  public getTransitionType(): string {
    if (this.isActivation()) return 'activation';
    if (this.isDeactivation()) return 'deactivation';
    if (this.isSuspension()) return 'suspension';
    if (this.isResumption()) return 'resumption';
    if (this.isDeletion()) return 'deletion';
    if (this.isRestoration()) return 'restoration';
    return 'unknown';
  }

  /**
   * @method isActivation
   * @description 检查是否为激活操作
   * @returns {boolean} 是否为激活操作
   */
  public isActivation(): boolean {
    return (
      this.newStatus === TenantStatus.ACTIVE &&
      this.oldStatus !== TenantStatus.ACTIVE
    );
  }

  /**
   * @method isDeactivation
   * @description 检查是否为禁用操作
   * @returns {boolean} 是否为禁用操作
   */
  public isDeactivation(): boolean {
    return (
      this.newStatus === TenantStatus.DISABLED &&
      this.oldStatus !== TenantStatus.DISABLED
    );
  }

  /**
   * @method isSuspension
   * @description 检查是否为暂停操作
   * @returns {boolean} 是否为暂停操作
   */
  public isSuspension(): boolean {
    return (
      this.newStatus === TenantStatus.SUSPENDED &&
      this.oldStatus !== TenantStatus.SUSPENDED
    );
  }

  /**
   * @method isResumption
   * @description 检查是否为恢复操作
   * @returns {boolean} 是否为恢复操作
   */
  public isResumption(): boolean {
    return (
      this.oldStatus === TenantStatus.SUSPENDED &&
      this.newStatus === TenantStatus.ACTIVE
    );
  }

  /**
   * @method isDeletion
   * @description 检查是否为删除操作
   * @returns {boolean} 是否为删除操作
   */
  public isDeletion(): boolean {
    return (
      this.newStatus === TenantStatus.DELETED &&
      this.oldStatus !== TenantStatus.DELETED
    );
  }

  /**
   * @method isRestoration
   * @description 检查是否为恢复操作（从删除状态恢复）
   * @returns {boolean} 是否为恢复操作
   */
  public isRestoration(): boolean {
    return (
      this.oldStatus === TenantStatus.DELETED &&
      this.newStatus !== TenantStatus.DELETED
    );
  }

  /**
   * @method getStatusName
   * @description 获取状态名称
   * @param {TenantStatus} status 状态
   * @returns {string} 状态名称
   * @private
   */
  private getStatusName(status: TenantStatus): string {
    const statusNames: Record<TenantStatus, string> = {
      [TenantStatus.PENDING]: '待激活',
      [TenantStatus.ACTIVE]: '激活',
      [TenantStatus.DISABLED]: '禁用',
      [TenantStatus.SUSPENDED]: '暂停',
      [TenantStatus.DELETED]: '已删除',
    };
    return statusNames[status] || status;
  }

  /**
   * @method getMessage
   * @description 获取事件消息
   * @returns {string} 事件消息
   */
  public getMessage(): string {
    const oldStatusName = this.getStatusName(this.oldStatus);
    const newStatusName = this.getStatusName(this.newStatus);
    return `租户 ${this.tenantId.value} 状态从 ${oldStatusName} 变更为 ${newStatusName}。原因：${this.reason}`;
  }

  /**
   * @method getDetailedMessage
   * @description 获取详细的事件消息
   * @returns {string} 详细的事件消息
   */
  public getDetailedMessage(): string {
    const baseMessage = this.getMessage();
    const transitionType = this.getTransitionType();
    const changedBy = this.changedBy;
    const occurredOn = this.occurredOn.toISOString();

    return `${baseMessage}。转换类型：${transitionType}，操作者：${changedBy}，时间：${occurredOn}`;
  }
}
