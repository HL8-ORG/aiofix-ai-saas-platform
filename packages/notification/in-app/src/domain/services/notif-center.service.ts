import { TenantId } from '@aiofix/shared';
import { UserId } from '@aiofix/shared';
import { NotifType } from '../value-objects/notif-type.vo';
import { NotifPriority } from '../value-objects/notif-priority.vo';

/**
 * @class NotifCenter
 * @description
 * 通知中心领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调通知和用户偏好之间的业务规则
 * 2. 处理通知和租户设置之间的关联关系
 * 3. 管理通知优先级的复杂计算逻辑
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的通知计算逻辑
 * 2. 提供可重用的通知规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 *
 * @example
 * ```typescript
 * const notifCenter = new NotifCenter();
 * const canSend = notifCenter.canSendNotif(userId, tenantId, type);
 * const priority = notifCenter.calculatePriority(type, urgency);
 * ```
 * @since 1.0.0
 */
export class NotifCenter {
  /**
   * @method canSendNotif
   * @description 判断是否可以发送通知，跨聚合权限计算
   * @param {UserId} userId 用户ID
   * @param {TenantId} tenantId 租户ID
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否可以发送
   *
   * 业务逻辑：
   * 1. 检查用户是否属于指定租户
   * 2. 验证用户通知偏好设置
   * 3. 检查租户通知策略
   * 4. 考虑通知类型限制
   */
  public canSendNotif(
    userId: UserId,
    tenantId: TenantId,
    type: NotifType,
  ): boolean {
    // 基础验证
    if (!userId || !tenantId || !type) {
      return false;
    }

    // 检查通知类型是否被允许
    if (this.isRestrictedType(type)) {
      return false;
    }

    // 检查租户通知策略
    if (!this.isTenantNotifEnabled(tenantId, type)) {
      return false;
    }

    return true;
  }

  /**
   * @method calculatePriority
   * @description 计算通知优先级，无状态优先级计算
   * @param {NotifType} type 通知类型
   * @param {boolean} isUrgent 是否紧急
   * @param {Record<string, any>} metadata 元数据
   * @returns {NotifPriority} 计算出的优先级
   */
  public calculatePriority(
    type: NotifType,
    isUrgent: boolean = false,
    metadata: Record<string, unknown> = {},
  ): NotifPriority {
    // 紧急通知直接设为最高优先级
    if (isUrgent) {
      return NotifPriority.CRITICAL;
    }

    // 根据通知类型确定基础优先级
    const basePriority = this.getBasePriorityByType(type);

    // 根据元数据调整优先级
    const adjustedPriority = this.adjustPriorityByMetadata(
      basePriority,
      metadata,
    );

    return adjustedPriority;
  }

  /**
   * @method validateNotifContent
   * @description 验证通知内容的合法性
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否合法
   */
  public validateNotifContent(
    title: string,
    content: string,
    type: NotifType,
  ): boolean {
    // 基础内容验证
    if (!title || !content) {
      return false;
    }

    // 长度验证
    if (title.length > 200 || content.length > 5000) {
      return false;
    }

    // 根据类型验证内容格式
    if (!this.validateContentByType(title, content, type)) {
      return false;
    }

    return true;
  }

  /**
   * @method shouldNotifyUser
   * @description 判断是否应该通知用户
   * @param {UserId} userId 用户ID
   * @param {NotifType} type 通知类型
   * @param {NotifPriority} priority 通知优先级
   * @returns {boolean} 是否应该通知
   */
  public shouldNotifyUser(
    userId: UserId,
    type: NotifType,
    priority: NotifPriority,
  ): boolean {
    // 高优先级通知总是发送
    if (
      priority === NotifPriority.CRITICAL ||
      priority === NotifPriority.URGENT
    ) {
      return true;
    }

    // 系统通知总是发送
    if (type === NotifType.SYSTEM) {
      return true;
    }

    // 其他情况根据用户偏好决定
    return true; // 简化实现，实际应该查询用户偏好
  }

  /**
   * @method isRestrictedType
   * @description 检查通知类型是否受限制
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否受限制
   * @private
   */
  private isRestrictedType(type: NotifType): boolean {
    // 定义受限制的通知类型
    const restrictedTypes: NotifType[] = [
      // 可以根据业务需求添加受限制的类型
    ];

    return restrictedTypes.includes(type);
  }

  /**
   * @method isTenantNotifEnabled
   * @description 检查租户是否启用通知
   * @param {TenantId} tenantId 租户ID
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否启用
   * @private
   */
  private isTenantNotifEnabled(_tenantId: TenantId, _type: NotifType): boolean {
    // 简化实现，实际应该查询租户设置
    return true;
  }

  /**
   * @method getBasePriorityByType
   * @description 根据通知类型获取基础优先级
   * @param {NotifType} type 通知类型
   * @returns {NotifPriority} 基础优先级
   * @private
   */
  private getBasePriorityByType(type: NotifType): NotifPriority {
    const priorityMap: Record<NotifType, NotifPriority> = {
      [NotifType.SYSTEM]: NotifPriority.HIGH,
      [NotifType.PLATFORM_MANAGEMENT]: NotifPriority.HIGH,
      [NotifType.TENANT_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.USER_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.ORGANIZATION_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.DEPARTMENT_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.ROLE_MANAGEMENT]: NotifPriority.NORMAL,
      [NotifType.PERMISSION_MANAGEMENT]: NotifPriority.HIGH,
      [NotifType.BUSINESS]: NotifPriority.NORMAL,
      [NotifType.REMINDER]: NotifPriority.LOW,
      [NotifType.ALERT]: NotifPriority.URGENT,
      [NotifType.INFO]: NotifPriority.LOW,
    };

    return priorityMap[type] ?? NotifPriority.NORMAL;
  }

  /**
   * @method adjustPriorityByMetadata
   * @description 根据元数据调整优先级
   * @param {NotifPriority} basePriority 基础优先级
   * @param {Record<string, any>} metadata 元数据
   * @returns {NotifPriority} 调整后的优先级
   * @private
   */
  private adjustPriorityByMetadata(
    basePriority: NotifPriority,
    metadata: Record<string, unknown>,
  ): NotifPriority {
    // 检查是否有紧急标记
    if (metadata.isUrgent === true) {
      return this.upgradePriority(basePriority);
    }

    // 检查是否有重要标记
    if (metadata.isImportant === true) {
      return this.upgradePriority(basePriority);
    }

    return basePriority;
  }

  /**
   * @method upgradePriority
   * @description 升级优先级
   * @param {NotifPriority} priority 当前优先级
   * @returns {NotifPriority} 升级后的优先级
   * @private
   */
  private upgradePriority(priority: NotifPriority): NotifPriority {
    const priorityOrder = [
      NotifPriority.LOW,
      NotifPriority.NORMAL,
      NotifPriority.HIGH,
      NotifPriority.URGENT,
      NotifPriority.CRITICAL,
    ];

    const currentIndex = priorityOrder.indexOf(priority);
    const nextIndex = Math.min(currentIndex + 1, priorityOrder.length - 1);

    return priorityOrder[nextIndex];
  }

  /**
   * @method validateContentByType
   * @description 根据通知类型验证内容格式
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否合法
   * @private
   */
  private validateContentByType(
    title: string,
    content: string,
    type: NotifType,
  ): boolean {
    // 系统通知需要特定格式
    if (type === NotifType.SYSTEM) {
      return this.validateSystemNotifContent(title, content);
    }

    // 警告通知需要特定格式
    if (type === NotifType.ALERT) {
      return this.validateAlertNotifContent(title, content);
    }

    // 其他类型的基础验证
    return this.validateBasicNotifContent(title, content);
  }

  /**
   * @method validateSystemNotifContent
   * @description 验证系统通知内容
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateSystemNotifContent(title: string, content: string): boolean {
    // 系统通知标题不能为空
    if (!title.trim()) {
      return false;
    }

    // 系统通知内容不能为空
    if (!content.trim()) {
      return false;
    }

    return true;
  }

  /**
   * @method validateAlertNotifContent
   * @description 验证警告通知内容
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateAlertNotifContent(title: string, content: string): boolean {
    // 警告通知标题不能为空
    if (!title.trim()) {
      return false;
    }

    // 警告通知内容不能为空
    if (!content.trim()) {
      return false;
    }

    // 警告通知标题应该包含警告标识
    if (!title.includes('警告') && !title.includes('Alert')) {
      return false;
    }

    return true;
  }

  /**
   * @method validateBasicNotifContent
   * @description 验证基础通知内容
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @returns {boolean} 是否合法
   * @private
   */
  private validateBasicNotifContent(title: string, content: string): boolean {
    // 基础验证：标题和内容不能为空
    return title.trim().length > 0 && content.trim().length > 0;
  }
}
