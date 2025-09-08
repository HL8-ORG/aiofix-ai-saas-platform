/**
 * @enum NotifType
 * @description
 * 通知类型枚举，定义站内通知的业务类型。
 *
 * 通知类型：
 * 1. SYSTEM - 系统通知：系统级别的通知，如系统维护、更新等
 * 2. PLATFORM_MANAGEMENT - 平台管理：平台管理相关的通知
 * 3. TENANT_MANAGEMENT - 租户管理：租户管理相关的通知
 * 4. USER_MANAGEMENT - 用户管理：用户管理相关的通知
 * 5. ORGANIZATION_MANAGEMENT - 组织管理：组织管理相关的通知
 * 6. DEPARTMENT_MANAGEMENT - 部门管理：部门管理相关的通知
 * 7. ROLE_MANAGEMENT - 角色管理：角色管理相关的通知
 * 8. PERMISSION_MANAGEMENT - 权限管理：权限管理相关的通知
 * 9. BUSINESS - 业务通知：业务相关的通知
 * 10. REMINDER - 提醒通知：提醒类型的通知
 * 11. ALERT - 警告通知：警告类型的通知
 * 12. INFO - 信息通知：信息类型的通知
 *
 * 业务规则：
 * 1. 每种类型对应不同的业务场景
 * 2. 类型决定了通知的显示样式和优先级
 * 3. 类型影响用户的通知偏好设置
 *
 * @example
 * ```typescript
 * const type = NotifType.SYSTEM;
 * console.log(type === NotifType.SYSTEM); // true
 * ```
 * @since 1.0.0
 */
export enum NotifType {
  SYSTEM = 'SYSTEM',
  PLATFORM_MANAGEMENT = 'PLATFORM_MANAGEMENT',
  TENANT_MANAGEMENT = 'TENANT_MANAGEMENT',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  ORGANIZATION_MANAGEMENT = 'ORGANIZATION_MANAGEMENT',
  DEPARTMENT_MANAGEMENT = 'DEPARTMENT_MANAGEMENT',
  ROLE_MANAGEMENT = 'ROLE_MANAGEMENT',
  PERMISSION_MANAGEMENT = 'PERMISSION_MANAGEMENT',
  BUSINESS = 'BUSINESS',
  REMINDER = 'REMINDER',
  ALERT = 'ALERT',
  INFO = 'INFO',
}

/**
 * @class NotifTypeValidator
 * @description
 * 通知类型验证器，负责验证通知类型的合法性。
 *
 * 验证职责：
 * 1. 验证通知类型的有效性
 * 2. 提供类型相关的业务规则检查
 * 3. 确保类型与业务场景的匹配
 *
 * @example
 * ```typescript
 * const validator = new NotifTypeValidator();
 * const isValid = validator.isValid(NotifType.SYSTEM);
 * ```
 * @since 1.0.0
 */
export class NotifTypeValidator {
  /**
   * @method isValid
   * @description 检查通知类型是否有效
   * @param {string} type 通知类型字符串
   * @returns {boolean} 是否有效
   */
  public isValid(type: string): boolean {
    return Object.values(NotifType).includes(type as NotifType);
  }

  /**
   * @method validate
   * @description 验证通知类型的合法性，如果无效则抛出异常
   * @param {string} type 通知类型字符串
   * @returns {void}
   * @throws {InvalidNotifTypeError} 当通知类型无效时抛出
   */
  public validate(type: string): void {
    if (!this.isValid(type)) {
      throw new InvalidNotifTypeError(`Invalid notification type: ${type}`);
    }
  }

  /**
   * @method isSystemType
   * @description 检查是否为系统类型通知
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否为系统类型
   */
  public isSystemType(type: NotifType): boolean {
    return [
      NotifType.SYSTEM,
      NotifType.PLATFORM_MANAGEMENT,
      NotifType.TENANT_MANAGEMENT,
    ].includes(type);
  }

  /**
   * @method isManagementType
   * @description 检查是否为管理类型通知
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否为管理类型
   */
  public isManagementType(type: NotifType): boolean {
    return [
      NotifType.USER_MANAGEMENT,
      NotifType.ORGANIZATION_MANAGEMENT,
      NotifType.DEPARTMENT_MANAGEMENT,
      NotifType.ROLE_MANAGEMENT,
      NotifType.PERMISSION_MANAGEMENT,
    ].includes(type);
  }

  /**
   * @method isBusinessType
   * @description 检查是否为业务类型通知
   * @param {NotifType} type 通知类型
   * @returns {boolean} 是否为业务类型
   */
  public isBusinessType(type: NotifType): boolean {
    return [
      NotifType.BUSINESS,
      NotifType.REMINDER,
      NotifType.ALERT,
      NotifType.INFO,
    ].includes(type);
  }

  /**
   * @method getDefaultPriority
   * @description 获取通知类型的默认优先级
   * @param {NotifType} type 通知类型
   * @returns {string} 默认优先级
   */
  public getDefaultPriority(type: NotifType): string {
    const priorityMap: Record<NotifType, string> = {
      [NotifType.SYSTEM]: 'HIGH',
      [NotifType.PLATFORM_MANAGEMENT]: 'HIGH',
      [NotifType.TENANT_MANAGEMENT]: 'NORMAL',
      [NotifType.USER_MANAGEMENT]: 'NORMAL',
      [NotifType.ORGANIZATION_MANAGEMENT]: 'NORMAL',
      [NotifType.DEPARTMENT_MANAGEMENT]: 'NORMAL',
      [NotifType.ROLE_MANAGEMENT]: 'NORMAL',
      [NotifType.PERMISSION_MANAGEMENT]: 'HIGH',
      [NotifType.BUSINESS]: 'NORMAL',
      [NotifType.REMINDER]: 'LOW',
      [NotifType.ALERT]: 'URGENT',
      [NotifType.INFO]: 'LOW',
    };

    return priorityMap[type] || 'NORMAL';
  }
}

/**
 * @class InvalidNotifTypeError
 * @description 无效通知类型错误
 */
export class InvalidNotifTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifTypeError';
  }
}
