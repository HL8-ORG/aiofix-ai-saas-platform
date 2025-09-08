/**
 * @enum TemplateStatus
 * @description
 * 模板状态枚举，定义通知模板的各种状态。
 *
 * 状态定义：
 * 1. DRAFT - 草稿：模板正在编辑中，未发布
 * 2. PUBLISHED - 已发布：模板已发布，可以使用
 * 3. ARCHIVED - 已归档：模板已归档，不再使用
 * 4. DELETED - 已删除：模板已删除，不可恢复
 *
 * 状态转换规则：
 * 1. DRAFT → PUBLISHED: 发布模板时
 * 2. PUBLISHED → DRAFT: 下线模板时
 * 3. PUBLISHED → ARCHIVED: 归档模板时
 * 4. DRAFT → DELETED: 删除草稿模板时
 * 5. ARCHIVED → DELETED: 删除归档模板时
 *
 * @example
 * ```typescript
 * const status = TemplateStatus.DRAFT;
 * console.log(status === TemplateStatus.DRAFT); // true
 * ```
 * @since 1.0.0
 */
export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

/**
 * @class TemplateStatusValidator
 * @description
 * 模板状态验证器，负责验证模板状态的合法性和提供状态相关的业务规则。
 *
 * 验证职责：
 * 1. 验证模板状态的有效性
 * 2. 提供状态转换验证功能
 * 3. 确保状态转换符合业务规则
 *
 * @example
 * ```typescript
 * const validator = new TemplateStatusValidator();
 * const canTransition = validator.canTransition(TemplateStatus.DRAFT, TemplateStatus.PUBLISHED);
 * validator.validateTransition(TemplateStatus.DRAFT, TemplateStatus.PUBLISHED);
 * ```
 * @since 1.0.0
 */
export class TemplateStatusValidator {
  /**
   * @method isValid
   * @description 检查模板状态是否有效
   * @param {string} status 模板状态字符串
   * @returns {boolean} 是否有效
   */
  public isValid(status: string): boolean {
    return Object.values(TemplateStatus).includes(status as TemplateStatus);
  }

  /**
   * @method validate
   * @description 验证模板状态的合法性，如果无效则抛出异常
   * @param {string} status 模板状态字符串
   * @returns {void}
   * @throws {InvalidTemplateStatusError} 当模板状态无效时抛出
   */
  public validate(status: string): void {
    if (!this.isValid(status)) {
      throw new InvalidTemplateStatusError(
        `Invalid template status: ${status}`,
      );
    }
  }

  /**
   * @method canTransition
   * @description 检查是否可以从一个状态转换到另一个状态
   * @param {TemplateStatus} fromStatus 源状态
   * @param {TemplateStatus} toStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransition(
    fromStatus: TemplateStatus,
    toStatus: TemplateStatus,
  ): boolean {
    const validTransitions: Record<TemplateStatus, TemplateStatus[]> = {
      [TemplateStatus.DRAFT]: [
        TemplateStatus.PUBLISHED,
        TemplateStatus.DELETED,
      ],
      [TemplateStatus.PUBLISHED]: [
        TemplateStatus.DRAFT,
        TemplateStatus.ARCHIVED,
      ],
      [TemplateStatus.ARCHIVED]: [TemplateStatus.DELETED],
      [TemplateStatus.DELETED]: [], // 已删除状态是终态
    };

    return validTransitions[fromStatus]?.includes(toStatus) ?? false;
  }

  /**
   * @method validateTransition
   * @description 验证状态转换的合法性，如果无效则抛出异常
   * @param {TemplateStatus} fromStatus 源状态
   * @param {TemplateStatus} toStatus 目标状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public validateTransition(
    fromStatus: TemplateStatus,
    toStatus: TemplateStatus,
  ): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  /**
   * @method isDraft
   * @description 检查状态是否为草稿
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为草稿状态
   */
  public isDraft(status: TemplateStatus): boolean {
    return status === TemplateStatus.DRAFT;
  }

  /**
   * @method isPublished
   * @description 检查状态是否为已发布
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为已发布状态
   */
  public isPublished(status: TemplateStatus): boolean {
    return status === TemplateStatus.PUBLISHED;
  }

  /**
   * @method isArchived
   * @description 检查状态是否为已归档
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为已归档状态
   */
  public isArchived(status: TemplateStatus): boolean {
    return status === TemplateStatus.ARCHIVED;
  }

  /**
   * @method isDeleted
   * @description 检查状态是否为已删除
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为已删除状态
   */
  public isDeleted(status: TemplateStatus): boolean {
    return status === TemplateStatus.DELETED;
  }

  /**
   * @method isActive
   * @description 检查状态是否为活跃状态（可以使用）
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为活跃状态
   */
  public isActive(status: TemplateStatus): boolean {
    return status === TemplateStatus.PUBLISHED;
  }

  /**
   * @method isEditable
   * @description 检查状态是否可编辑
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否可编辑
   */
  public isEditable(status: TemplateStatus): boolean {
    return status === TemplateStatus.DRAFT;
  }

  /**
   * @method isDeletable
   * @description 检查状态是否可删除
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否可删除
   */
  public isDeletable(status: TemplateStatus): boolean {
    return (
      status === TemplateStatus.DRAFT || status === TemplateStatus.ARCHIVED
    );
  }

  /**
   * @method isFinal
   * @description 检查状态是否为终态
   * @param {TemplateStatus} status 模板状态
   * @returns {boolean} 是否为终态
   */
  public isFinal(status: TemplateStatus): boolean {
    return status === TemplateStatus.DELETED;
  }

  /**
   * @method getStatusDisplayName
   * @description 获取状态的显示名称
   * @param {TemplateStatus} status 模板状态
   * @returns {string} 状态显示名称
   */
  public getStatusDisplayName(status: TemplateStatus): string {
    const displayNames: Record<TemplateStatus, string> = {
      [TemplateStatus.DRAFT]: '草稿',
      [TemplateStatus.PUBLISHED]: '已发布',
      [TemplateStatus.ARCHIVED]: '已归档',
      [TemplateStatus.DELETED]: '已删除',
    };

    return displayNames[status] || status;
  }

  /**
   * @method getNextValidStates
   * @description 获取当前状态可以转换到的下一个有效状态
   * @param {TemplateStatus} currentStatus 当前状态
   * @returns {TemplateStatus[]} 下一个有效状态列表
   */
  public getNextValidStates(currentStatus: TemplateStatus): TemplateStatus[] {
    const validTransitions: Record<TemplateStatus, TemplateStatus[]> = {
      [TemplateStatus.DRAFT]: [
        TemplateStatus.PUBLISHED,
        TemplateStatus.DELETED,
      ],
      [TemplateStatus.PUBLISHED]: [
        TemplateStatus.DRAFT,
        TemplateStatus.ARCHIVED,
      ],
      [TemplateStatus.ARCHIVED]: [TemplateStatus.DELETED],
      [TemplateStatus.DELETED]: [],
    };

    return validTransitions[currentStatus] || [];
  }
}

/**
 * @class InvalidTemplateStatusError
 * @description 无效模板状态错误
 */
export class InvalidTemplateStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateStatusError';
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
