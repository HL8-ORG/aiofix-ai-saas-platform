/**
 * @enum NotifPriority
 * @description
 * 通知优先级枚举，定义通知的优先级级别。
 *
 * 优先级级别：
 * 1. LOW - 低优先级：一般信息通知，不紧急
 * 2. NORMAL - 普通优先级：常规通知，正常处理
 * 3. HIGH - 高优先级：重要通知，需要关注
 * 4. URGENT - 紧急优先级：紧急通知，需要立即处理
 * 5. CRITICAL - 关键优先级：关键通知，系统级别
 *
 * 优先级规则：
 * 1. 优先级影响通知的显示顺序
 * 2. 优先级影响通知的推送策略
 * 3. 优先级影响用户的通知偏好
 *
 * @example
 * ```typescript
 * const priority = NotifPriority.HIGH;
 * console.log(priority === NotifPriority.HIGH); // true
 * ```
 * @since 1.0.0
 */
export enum NotifPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

/**
 * @class NotifPriorityValidator
 * @description
 * 通知优先级验证器，负责验证优先级的合法性和提供优先级相关的业务规则。
 *
 * 验证职责：
 * 1. 验证优先级的有效性
 * 2. 提供优先级比较功能
 * 3. 确保优先级与业务场景的匹配
 *
 * @example
 * ```typescript
 * const validator = new NotifPriorityValidator();
 * const isValid = validator.isValid(NotifPriority.HIGH);
 * const isHigher = validator.isHigher(NotifPriority.HIGH, NotifPriority.NORMAL);
 * ```
 * @since 1.0.0
 */
export class NotifPriorityValidator {
  /**
   * @method isValid
   * @description 检查优先级是否有效
   * @param {string} priority 优先级字符串
   * @returns {boolean} 是否有效
   */
  public isValid(priority: string): boolean {
    return Object.values(NotifPriority).includes(priority as NotifPriority);
  }

  /**
   * @method validate
   * @description 验证优先级的合法性，如果无效则抛出异常
   * @param {string} priority 优先级字符串
   * @returns {void}
   * @throws {InvalidNotifPriorityError} 当优先级无效时抛出
   */
  public validate(priority: string): void {
    if (!this.isValid(priority)) {
      throw new InvalidNotifPriorityError(
        `Invalid notification priority: ${priority}`,
      );
    }
  }

  /**
   * @method isHigher
   * @description 检查第一个优先级是否高于第二个优先级
   * @param {NotifPriority} priority1 第一个优先级
   * @param {NotifPriority} priority2 第二个优先级
   * @returns {boolean} 是否更高
   */
  public isHigher(priority1: NotifPriority, priority2: NotifPriority): boolean {
    const priorityOrder = {
      [NotifPriority.LOW]: 1,
      [NotifPriority.NORMAL]: 2,
      [NotifPriority.HIGH]: 3,
      [NotifPriority.URGENT]: 4,
      [NotifPriority.CRITICAL]: 5,
    };

    return priorityOrder[priority1] > priorityOrder[priority2];
  }

  /**
   * @method isLower
   * @description 检查第一个优先级是否低于第二个优先级
   * @param {NotifPriority} priority1 第一个优先级
   * @param {NotifPriority} priority2 第二个优先级
   * @returns {boolean} 是否更低
   */
  public isLower(priority1: NotifPriority, priority2: NotifPriority): boolean {
    return this.isHigher(priority2, priority1);
  }

  /**
   * @method isEqual
   * @description 检查两个优先级是否相等
   * @param {NotifPriority} priority1 第一个优先级
   * @param {NotifPriority} priority2 第二个优先级
   * @returns {boolean} 是否相等
   */
  public isEqual(priority1: NotifPriority, priority2: NotifPriority): boolean {
    return priority1 === priority2;
  }

  /**
   * @method getPriorityLevel
   * @description 获取优先级的数值级别
   * @param {NotifPriority} priority 优先级
   * @returns {number} 优先级数值级别
   */
  public getPriorityLevel(priority: NotifPriority): number {
    const priorityOrder = {
      [NotifPriority.LOW]: 1,
      [NotifPriority.NORMAL]: 2,
      [NotifPriority.HIGH]: 3,
      [NotifPriority.URGENT]: 4,
      [NotifPriority.CRITICAL]: 5,
    };

    return priorityOrder[priority];
  }

  /**
   * @method isUrgent
   * @description 检查优先级是否为紧急级别
   * @param {NotifPriority} priority 优先级
   * @returns {boolean} 是否为紧急级别
   */
  public isUrgent(priority: NotifPriority): boolean {
    return (
      priority === NotifPriority.URGENT || priority === NotifPriority.CRITICAL
    );
  }

  /**
   * @method isHigh
   * @description 检查优先级是否为高优先级
   * @param {NotifPriority} priority 优先级
   * @returns {boolean} 是否为高优先级
   */
  public isHigh(priority: NotifPriority): boolean {
    return priority === NotifPriority.HIGH || this.isUrgent(priority);
  }

  /**
   * @method isLow
   * @description 检查优先级是否为低优先级
   * @param {NotifPriority} priority 优先级
   * @returns {boolean} 是否为低优先级
   */
  public isLow(priority: NotifPriority): boolean {
    return priority === NotifPriority.LOW || priority === NotifPriority.NORMAL;
  }
}

/**
 * @class InvalidNotifPriorityError
 * @description 无效通知优先级错误
 */
export class InvalidNotifPriorityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifPriorityError';
  }
}
