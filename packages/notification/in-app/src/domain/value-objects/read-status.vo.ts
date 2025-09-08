/**
 * @enum ReadStatus
 * @description
 * 站内通知读取状态枚举，定义站内通知的读取状态类型。
 *
 * 状态类型：
 * 1. UNREAD - 未读：用户尚未查看的通知
 * 2. READ - 已读：用户已经查看的通知
 * 3. ARCHIVED - 已归档：用户已归档的通知
 *
 * 状态转换规则：
 * 1. UNREAD → READ：用户查看通知时
 * 2. READ → ARCHIVED：用户归档通知时
 * 3. UNREAD → ARCHIVED：用户直接归档未读通知时
 * 4. 不允许反向转换
 *
 * @example
 * ```typescript
 * const status = ReadStatus.UNREAD;
 * console.log(status === ReadStatus.UNREAD); // true
 * ```
 * @since 1.0.0
 */
export enum ReadStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * @class ReadStatusValidator
 * @description
 * 读取状态验证器，负责验证状态转换的合法性。
 *
 * 验证职责：
 * 1. 验证状态转换的合法性
 * 2. 提供状态转换规则检查
 * 3. 确保状态转换的业务规则
 *
 * @example
 * ```typescript
 * const validator = new ReadStatusValidator();
 * const canTransition = validator.canTransition(ReadStatus.UNREAD, ReadStatus.READ);
 * ```
 * @since 1.0.0
 */
export class ReadStatusValidator {
  /**
   * @method canTransition
   * @description 检查是否可以从一个状态转换到另一个状态
   * @param {ReadStatus} fromStatus 源状态
   * @param {ReadStatus} toStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransition(fromStatus: ReadStatus, toStatus: ReadStatus): boolean {
    // 相同状态不需要转换
    if (fromStatus === toStatus) {
      return true;
    }

    // 定义允许的状态转换
    const allowedTransitions: Record<ReadStatus, ReadStatus[]> = {
      [ReadStatus.UNREAD]: [ReadStatus.READ, ReadStatus.ARCHIVED],
      [ReadStatus.READ]: [ReadStatus.ARCHIVED],
      [ReadStatus.ARCHIVED]: [], // 已归档状态不能转换到其他状态
    };

    return allowedTransitions[fromStatus].includes(toStatus);
  }

  /**
   * @method validateTransition
   * @description 验证状态转换的合法性，如果无效则抛出异常
   * @param {ReadStatus} fromStatus 源状态
   * @param {ReadStatus} toStatus 目标状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public validateTransition(
    fromStatus: ReadStatus,
    toStatus: ReadStatus,
  ): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  /**
   * @method isReadable
   * @description 检查状态是否可读
   * @param {ReadStatus} status 读取状态
   * @returns {boolean} 是否可读
   */
  public isReadable(status: ReadStatus): boolean {
    return status === ReadStatus.UNREAD || status === ReadStatus.READ;
  }

  /**
   * @method isArchivable
   * @description 检查状态是否可归档
   * @param {ReadStatus} status 读取状态
   * @returns {boolean} 是否可归档
   */
  public isArchivable(status: ReadStatus): boolean {
    return status === ReadStatus.UNREAD || status === ReadStatus.READ;
  }
}

/**
 * @class InvalidStatusTransitionError
 * @description 无效状态转换错误
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
