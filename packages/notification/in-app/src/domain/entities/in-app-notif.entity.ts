import { BaseEntity } from '@aiofix/core';
import { NotifId } from '@aiofix/shared';
import { TenantId } from '@aiofix/shared';
import { UserId } from '@aiofix/shared';
import { NotifType } from '../value-objects/notif-type.vo';
import { NotifPriority } from '../value-objects/notif-priority.vo';
import {
  ReadStatus,
  ReadStatusValidator,
} from '../value-objects/read-status.vo';

/**
 * @class InAppNotifEntity
 * @description
 * 站内通知领域实体，负责维护站内通知的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识通知身份
 * 2. 管理通知的基本状态（未读、已读、已归档）
 * 3. 维护通知的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 通知ID一旦创建不可变更
 * 2. 通知状态变更必须遵循预定义的状态机
 * 3. 通知内容不能为空或超过长度限制
 * 4. 通知必须属于有效的租户和用户
 *
 * @property {NotifId} id 通知唯一标识符，不可变更
 * @property {TenantId} tenantId 所属租户ID
 * @property {UserId} recipientId 接收者用户ID
 * @property {NotifType} type 通知类型
 * @property {string} title 通知标题
 * @property {string} content 通知内容
 * @property {NotifPriority} priority 通知优先级
 * @property {Record<string, unknown>} metadata 通知元数据
 * @property {Date} createdAt 创建时间
 * @property {Date} updatedAt 最后更新时间
 * @property {ReadStatus} status 读取状态
 * @property {Date} readAt 阅读时间
 * @property {Date} archivedAt 归档时间
 * @property {string} createdBy 创建者ID
 * @property {string} updatedBy 最后更新者ID
 * @property {number} version 数据版本号
 * @property {boolean} isDeleted 软删除标记
 * @property {Date} deletedAt 删除时间
 * @property {string} deletedBy 删除者ID
 *
 * @example
 * ```typescript
 * const notifEntity = new InAppNotifEntity(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   NotifType.SYSTEM,
 *   '系统通知',
 *   '系统将在今晚进行维护',
 *   NotifPriority.HIGH
 * );
 * notifEntity.markAsRead();
 * notifEntity.archive();
 * ```
 * @since 1.0.0
 */
export class InAppNotifEntity extends BaseEntity {
  private readonly statusValidator = new ReadStatusValidator();

  constructor(
    public readonly id: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown> = {},
    private status: ReadStatus = ReadStatus.UNREAD,
    private readAt?: Date,
    private archivedAt?: Date,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string = 'system'): void {
    const oldStatus = this.status;
    const newStatus = ReadStatus.READ;

    // 验证状态转换
    this.statusValidator.validateTransition(oldStatus, newStatus);

    // 更新状态
    this.status = newStatus;
    this.readAt = new Date();

    // 更新审计信息（使用基类方法）
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string = 'system'): void {
    const oldStatus = this.status;
    const newStatus = ReadStatus.ARCHIVED;

    // 验证状态转换
    this.statusValidator.validateTransition(oldStatus, newStatus);

    // 更新状态
    this.status = newStatus;
    this.archivedAt = new Date();

    // 更新审计信息（使用基类方法）
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method isRead
   * @description 检查通知是否已读
   * @returns {boolean} 是否已读
   */
  public isRead(): boolean {
    return this.status === ReadStatus.READ;
  }

  /**
   * @method isArchived
   * @description 检查通知是否已归档
   * @returns {boolean} 是否已归档
   */
  public isArchived(): boolean {
    return this.status === ReadStatus.ARCHIVED;
  }

  /**
   * @method isUnread
   * @description 检查通知是否未读
   * @returns {boolean} 是否未读
   */
  public isUnread(): boolean {
    return this.status === ReadStatus.UNREAD;
  }

  /**
   * @method canBeRead
   * @description 检查通知是否可读
   * @returns {boolean} 是否可读
   */
  public canBeRead(): boolean {
    return this.statusValidator.isReadable(this.status);
  }

  /**
   * @method canBeArchived
   * @description 检查通知是否可归档
   * @returns {boolean} 是否可归档
   */
  public canBeArchived(): boolean {
    return this.statusValidator.isArchivable(this.status);
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {ReadStatus} 当前状态
   */
  public getStatus(): ReadStatus {
    return this.status;
  }

  /**
   * @method getReadAt
   * @description 获取阅读时间
   * @returns {Date | undefined} 阅读时间
   */
  public getReadAt(): Date | undefined {
    return this.readAt;
  }

  /**
   * @method getArchivedAt
   * @description 获取归档时间
   * @returns {Date | undefined} 归档时间
   */
  public getArchivedAt(): Date | undefined {
    return this.archivedAt;
  }

  // 实现基类要求的抽象方法
  /**
   * @method getEntityId
   * @description 获取实体ID
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.id.value;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId.value;
  }

  /**
   * @method equals
   * @description 比较两个实体是否相等
   * @param {InAppNotifEntity} other 另一个实体
   * @returns {boolean} 是否相等
   */
  public equals(other: InAppNotifEntity): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id.equals(other.id);
  }

  /**
   * @method clone
   * @description 克隆实体
   * @returns {InAppNotifEntity} 克隆的实体
   */
  public clone(): InAppNotifEntity {
    return new InAppNotifEntity(
      this.id,
      this.tenantId,
      this.recipientId,
      this.type,
      this.title,
      this.content,
      this.priority,
      this.metadata,
      this.status,
      this.readAt,
      this.archivedAt,
      this.getCreatedBy(),
    );
  }

  /**
   * @method toJSON
   * @description 将实体转换为JSON对象
   * @returns {object} JSON对象
   */
  public toJSON(): object {
    return {
      ...super.toJSON(),
      id: this.id.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      type: this.type,
      title: this.title,
      content: this.content,
      priority: this.priority,
      metadata: this.metadata,
      status: this.status,
      readAt: this.readAt?.toISOString(),
      archivedAt: this.archivedAt?.toISOString(),
    };
  }

  /**
   * @method getOldStatus
   * @description 获取状态变更前的状态（用于事件发布）
   * @returns {ReadStatus} 原状态
   */
  public getOldStatus(): ReadStatus {
    // 这里需要根据具体的状态变更逻辑来实现
    // 简化实现，实际应该记录状态变更历史
    return this.status;
  }

  /**
   * @method validate
   * @description 验证实体的有效性
   * @returns {void}
   * @throws {InvalidNotifDataError} 当实体数据无效时抛出
   * @protected
   */
  protected validate(): void {
    // 调用基类的验证方法
    super.validate();

    // 业务特定的验证
    if (!this.id) {
      throw new InvalidNotifDataError('Notif ID is required');
    }

    if (!this.tenantId) {
      throw new InvalidNotifDataError('Tenant ID is required');
    }

    if (!this.recipientId) {
      throw new InvalidNotifDataError('Recipient ID is required');
    }

    if (!this.type) {
      throw new InvalidNotifDataError('Notification type is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new InvalidNotifDataError('Notification title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidNotifDataError('Notification content is required');
    }

    if (!this.priority) {
      throw new InvalidNotifDataError('Notification priority is required');
    }

    if (this.title.length > 200) {
      throw new InvalidNotifDataError(
        'Notification title cannot exceed 200 characters',
      );
    }

    if (this.content.length > 5000) {
      throw new InvalidNotifDataError(
        'Notification content cannot exceed 5000 characters',
      );
    }
  }
}

/**
 * @class InvalidNotifDataError
 * @description 无效通知数据错误
 */
export class InvalidNotifDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifDataError';
  }
}

/**
 * @class InvalidOperationError
 * @description 无效操作错误
 */
export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}
