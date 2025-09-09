import { EventSourcedAggregateRoot } from '@aiofix/core';
import { InAppNotifEntity } from '../entities/in-app-notif.entity';
import { NotifId } from '@aiofix/shared';
import { TenantId } from '@aiofix/shared';
import { UserId } from '@aiofix/shared';
import { NotifType } from '../value-objects/notif-type.vo';
import { NotifPriority } from '../value-objects/notif-priority.vo';
import { ReadStatus } from '../value-objects/read-status.vo';
import { InAppNotifCreatedEvent } from '../events/in-app-notif-created.event';
import { InAppNotifReadEvent } from '../events/in-app-notif-read.event';
import { InAppNotifArchivedEvent } from '../events/in-app-notif-archived.event';

/**
 * @class InAppNotif
 * @description
 * 站内通知聚合根，负责管理站内通知相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供站内通知创建、标记已读、归档等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 * 4. 协调领域实体的业务操作
 *
 * 不变性约束：
 * 1. 聚合根控制聚合内所有对象的一致性
 * 2. 确保业务规则在聚合边界内得到执行
 * 3. 管理聚合内实体的生命周期
 * 4. 保证事件发布的原子性
 *
 * @property {InAppNotifEntity} notif 站内通知实体
 *
 * @example
 * ```typescript
 * const notif = InAppNotif.create(
 *   NotifId.generate(),
 *   tenantId,
 *   recipientId,
 *   NotifType.SYSTEM,
 *   '系统通知',
 *   '系统将在今晚进行维护',
 *   NotifPriority.HIGH,
 *   { maintenanceTime: '2024-01-01 02:00:00' }
 * );
 * notif.markAsRead();
 * notif.archive();
 * ```
 * @since 1.0.0
 */
export class InAppNotif extends EventSourcedAggregateRoot {
  private constructor(private notif: InAppNotifEntity) {
    super();
  }

  /**
   * @method create
   * @description 创建新的站内通知聚合根
   * @param {NotifId} id 通知ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者用户ID
   * @param {NotifType} type 通知类型
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifPriority} priority 通知优先级
   * @param {Record<string, unknown>} metadata 通知元数据
   * @returns {InAppNotif} 创建的站内通知聚合根
   * @throws {InvalidNotifDataError} 当通知数据无效时抛出
   * @static
   */
  public static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
    metadata: Record<string, unknown> = {},
  ): InAppNotif {
    // 创建领域实体
    const notifEntity = new InAppNotifEntity(
      id,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
      metadata,
    );

    // 创建聚合根
    const aggregate = new InAppNotif(notifEntity);

    // 发布创建事件
    aggregate.addDomainEvent(
      new InAppNotifCreatedEvent(
        id,
        tenantId,
        recipientId,
        type,
        title,
        content,
        priority,
        metadata,
      ),
    );

    return aggregate;
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.markAsRead(updatedBy);

    const newStatus = this.notif.getStatus();
    const readAt = this.notif.getReadAt();

    // 发布已读事件
    this.addDomainEvent(
      new InAppNotifReadEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        newStatus,
        readAt!,
      ),
    );
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.archive(updatedBy);

    const archivedAt = this.notif.getArchivedAt();

    // 发布归档事件
    this.addDomainEvent(
      new InAppNotifArchivedEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        archivedAt!,
      ),
    );
  }

  /**
   * @method softDelete
   * @description 软删除通知
   * @param {string} [deletedBy] 删除者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidOperationError} 当通知已被删除时抛出
   */
  public softDelete(deletedBy: string = 'system'): void {
    // 委托给领域实体处理业务逻辑
    this.notif.softDelete(deletedBy);

    // 发布删除事件（如果需要的话）
    // this.addDomainEvent(new InAppNotifDeletedEvent(...));
  }

  /**
   * @method restore
   * @description 恢复已删除的通知
   * @param {string} [updatedBy] 恢复者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidOperationError} 当通知未被删除时抛出
   */
  public restore(updatedBy: string = 'system'): void {
    // 委托给领域实体处理业务逻辑
    this.notif.restore(updatedBy);

    // 发布恢复事件（如果需要的话）
    // this.addDomainEvent(new InAppNotifRestoredEvent(...));
  }

  /**
   * @method isRead
   * @description 检查通知是否已读
   * @returns {boolean} 是否已读
   */
  public isRead(): boolean {
    return this.notif.isRead();
  }

  /**
   * @method isArchived
   * @description 检查通知是否已归档
   * @returns {boolean} 是否已归档
   */
  public isArchived(): boolean {
    return this.notif.isArchived();
  }

  /**
   * @method isUnread
   * @description 检查通知是否未读
   * @returns {boolean} 是否未读
   */
  public isUnread(): boolean {
    return this.notif.isUnread();
  }

  /**
   * @method canBeRead
   * @description 检查通知是否可读
   * @returns {boolean} 是否可读
   */
  public canBeRead(): boolean {
    return this.notif.canBeRead();
  }

  /**
   * @method canBeArchived
   * @description 检查通知是否可归档
   * @returns {boolean} 是否可归档
   */
  public canBeArchived(): boolean {
    return this.notif.canBeArchived();
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {ReadStatus} 当前状态
   */
  public getStatus(): ReadStatus {
    return this.notif.getStatus();
  }

  /**
   * @method getReadAt
   * @description 获取阅读时间
   * @returns {Date | undefined} 阅读时间
   */
  public getReadAt(): Date | undefined {
    return this.notif.getReadAt();
  }

  /**
   * @method getArchivedAt
   * @description 获取归档时间
   * @returns {Date | undefined} 归档时间
   */
  public getArchivedAt(): Date | undefined {
    return this.notif.getArchivedAt();
  }

  /**
   * @method getUpdatedAt
   * @description 获取最后更新时间
   * @returns {Date} 最后更新时间
   */
  public getUpdatedAt(): Date {
    return this.notif.getUpdatedAt();
  }

  // 聚合根访问器方法，提供对实体属性的访问
  public get id(): NotifId {
    return this.notif.id;
  }

  public get tenantId(): TenantId {
    return this.notif.tenantId;
  }

  public get recipientId(): UserId {
    return this.notif.recipientId;
  }

  public get type(): NotifType {
    return this.notif.type;
  }

  public get title(): string {
    return this.notif.title;
  }

  public get content(): string {
    return this.notif.content;
  }

  public get priority(): NotifPriority {
    return this.notif.priority;
  }

  public get metadata(): Record<string, unknown> {
    return this.notif.metadata;
  }

  public get createdAt(): Date {
    return this.notif.createdAt;
  }

  // 审计相关访问器方法
  public get createdBy(): string {
    return this.notif.getCreatedBy();
  }

  public get updatedBy(): string {
    return this.notif.getUpdatedBy();
  }

  public get dataVersion(): number {
    return this.notif.getVersion();
  }

  public get isDeleted(): boolean {
    return this.notif.isDeleted();
  }

  public get deletedAt(): Date | undefined {
    return this.notif.getDeletedAt();
  }

  public get deletedBy(): string | undefined {
    return this.notif.getDeletedBy();
  }
}
