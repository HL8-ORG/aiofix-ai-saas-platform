/**
 * @class BaseEntity
 * @description
 * 领域实体基础类，提供通用的实体功能和审计能力。
 *
 * 通用功能：
 * 1. 审计追踪：创建、更新、删除的完整审计记录
 * 2. 版本控制：乐观锁支持，防止并发冲突
 * 3. 软删除：支持数据恢复和删除审计
 * 4. 状态管理：提供实体的生命周期管理
 * 5. 验证支持：提供实体验证的基础框架
 * 6. 事件支持：为领域事件提供基础支持
 *
 * 设计原则：
 * 1. 所有领域实体都应该继承此类
 * 2. 提供统一的实体接口和行为
 * 3. 支持多租户数据隔离
 * 4. 确保数据的完整性和一致性
 * 5. 为未来的扩展需求预留接口
 *
 * @property {Date} createdAt 创建时间
 * @property {string} createdBy 创建者ID
 * @property {Date} updatedAt 最后更新时间
 * @property {string} updatedBy 最后更新者ID
 * @property {number} version 数据版本号（乐观锁）
 * @property {boolean} isDeleted 软删除标记
 * @property {Date} deletedAt 删除时间
 * @property {string} deletedBy 删除者ID
 *
 * @example
 * ```typescript
 * export class InAppNotifEntity extends BaseEntity {
 *   constructor(
 *     public readonly id: NotifId,
 *     public readonly tenantId: TenantId,
 *     // ... 其他业务属性
 *     createdBy?: string
 *   ) {
 *     super(createdBy);
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseEntity {
  public readonly createdAt: Date;
  public readonly createdBy: string;
  private _updatedAt: Date;
  private _updatedBy: string;
  private _version: number;
  private _isDeleted: boolean;
  private _deletedAt?: Date;
  private _deletedBy?: string;

  constructor(createdBy: string = 'system') {
    const now = new Date();
    this.createdAt = now;
    this.createdBy = createdBy;
    this._updatedAt = now;
    this._updatedBy = createdBy;
    this._version = 1;
    this._isDeleted = false;
  }

  /**
   * @method updateAuditInfo
   * @description 更新审计信息
   * @param {string} updatedBy 更新者ID
   * @returns {void}
   * @protected
   */
  protected updateAuditInfo(updatedBy: string): void {
    this._updatedAt = new Date();
    this._updatedBy = updatedBy;
    this._version += 1;
  }

  /**
   * @method softDelete
   * @description 软删除实体
   * @param {string} deletedBy 删除者ID
   * @returns {void}
   * @throws {InvalidOperationError} 当实体已被删除时抛出
   */
  public softDelete(deletedBy: string = 'system'): void {
    if (this._isDeleted) {
      throw new InvalidOperationError('Entity is already deleted');
    }

    this._isDeleted = true;
    this._deletedAt = new Date();
    this._deletedBy = deletedBy;
    this.updateAuditInfo(deletedBy);
  }

  /**
   * @method restore
   * @description 恢复已删除的实体
   * @param {string} updatedBy 恢复者ID
   * @returns {void}
   * @throws {InvalidOperationError} 当实体未被删除时抛出
   */
  public restore(updatedBy: string = 'system'): void {
    if (!this._isDeleted) {
      throw new InvalidOperationError('Entity is not deleted');
    }

    this._isDeleted = false;
    this._deletedAt = undefined;
    this._deletedBy = undefined;
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method isDeleted
   * @description 检查实体是否已被删除
   * @returns {boolean} 是否已被删除
   */
  public isDeleted(): boolean {
    return this._isDeleted;
  }

  /**
   * @method getUpdatedAt
   * @description 获取最后更新时间
   * @returns {Date} 最后更新时间
   */
  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @method getUpdatedBy
   * @description 获取最后更新者ID
   * @returns {string} 最后更新者ID
   */
  public getUpdatedBy(): string {
    return this._updatedBy;
  }

  /**
   * @method getVersion
   * @description 获取数据版本号
   * @returns {number} 数据版本号
   */
  public getVersion(): number {
    return this._version;
  }

  /**
   * @method getDeletedAt
   * @description 获取删除时间
   * @returns {Date | undefined} 删除时间
   */
  public getDeletedAt(): Date | undefined {
    return this._deletedAt;
  }

  /**
   * @method getDeletedBy
   * @description 获取删除者ID
   * @returns {string | undefined} 删除者ID
   */
  public getDeletedBy(): string | undefined {
    return this._deletedBy;
  }

  /**
   * @method getCreatedBy
   * @description 获取创建者ID
   * @returns {string} 创建者ID
   */
  public getCreatedBy(): string {
    return this.createdBy;
  }

  /**
   * @method getCreatedAt
   * @description 获取创建时间
   * @returns {Date} 创建时间
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * @method getAuditInfo
   * @description 获取完整的审计信息
   * @returns {AuditInfo} 审计信息对象
   */
  public getAuditInfo(): AuditInfo {
    return {
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      updatedAt: this._updatedAt,
      updatedBy: this._updatedBy,
      version: this._version,
      isDeleted: this._isDeleted,
      deletedAt: this._deletedAt,
      deletedBy: this._deletedBy,
    };
  }

  /**
   * @method validateAuditState
   * @description 验证审计状态的有效性
   * @returns {void}
   * @throws {InvalidAuditStateError} 当审计状态无效时抛出
   * @protected
   */
  protected validateAuditState(): void {
    if (!this.createdBy) {
      throw new InvalidAuditStateError('Created by is required');
    }

    if (!this._updatedBy) {
      throw new InvalidAuditStateError('Updated by is required');
    }

    if (this._version < 1) {
      throw new InvalidAuditStateError('Version must be greater than 0');
    }

    if (this._isDeleted && !this._deletedAt) {
      throw new InvalidAuditStateError(
        'Deleted date is required when entity is deleted',
      );
    }

    if (this._isDeleted && !this._deletedBy) {
      throw new InvalidAuditStateError(
        'Deleted by is required when entity is deleted',
      );
    }
  }

  /**
   * @method validate
   * @description 验证实体的有效性，子类可以重写此方法
   * @returns {void}
   * @throws {ValidationError} 当实体无效时抛出
   * @protected
   */
  protected validate(): void {
    this.validateAuditState();
    // 子类可以重写此方法添加特定的验证逻辑
  }

  /**
   * @method isValid
   * @description 检查实体是否有效
   * @returns {boolean} 是否有效
   */
  public isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * @method equals
   * @description 比较两个实体是否相等，子类应该重写此方法
   * @param {BaseEntity} other 另一个实体
   * @returns {boolean} 是否相等
   */
  public equals(other: BaseEntity): boolean {
    if (this === other) return true;
    if (this.constructor !== other.constructor) return false;

    // 子类应该重写此方法提供具体的相等性判断逻辑
    return false;
  }

  /**
   * @method clone
   * @description 克隆实体，子类应该重写此方法
   * @returns {BaseEntity} 克隆的实体
   */
  public clone(): BaseEntity {
    // 子类应该重写此方法提供具体的克隆逻辑
    throw new Error('Clone method must be implemented by subclass');
  }

  /**
   * @method toJSON
   * @description 将实体转换为JSON对象，子类可以重写此方法
   * @returns {object} JSON对象
   */
  public toJSON(): object {
    return {
      createdAt: this.createdAt.toISOString(),
      createdBy: this.createdBy,
      updatedAt: this._updatedAt.toISOString(),
      updatedBy: this._updatedBy,
      version: this._version,
      isDeleted: this._isDeleted,
      deletedAt: this._deletedAt?.toISOString(),
      deletedBy: this._deletedBy,
    };
  }

  /**
   * @method toString
   * @description 将实体转换为字符串表示，子类可以重写此方法
   * @returns {string} 字符串表示
   */
  public toString(): string {
    return `${this.constructor.name}(${this._version})`;
  }

  /**
   * @method getEntityType
   * @description 获取实体类型名称
   * @returns {string} 实体类型名称
   */
  public getEntityType(): string {
    return this.constructor.name;
  }

  /**
   * @method getEntityId
   * @description 获取实体ID，子类必须重写此方法
   * @returns {string} 实体ID
   * @abstract
   */
  public abstract getEntityId(): string;

  /**
   * @method getTenantId
   * @description 获取租户ID，子类必须重写此方法（多租户支持）
   * @returns {string} 租户ID
   * @abstract
   */
  public abstract getTenantId(): string;
}

/**
 * @interface AuditInfo
 * @description 审计信息接口
 */
export interface AuditInfo {
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly updatedAt: Date;
  readonly updatedBy: string;
  readonly version: number;
  readonly isDeleted: boolean;
  readonly deletedAt?: Date;
  readonly deletedBy?: string;
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

/**
 * @class InvalidAuditStateError
 * @description 无效审计状态错误
 */
export class InvalidAuditStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAuditStateError';
  }
}

/**
 * @class ValidationError
 * @description 验证错误
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
