import { v4 as uuidv4 } from 'uuid';

/**
 * @interface EventMetadata
 * @description 事件元数据，用于审计追踪和业务分析
 */
export interface EventMetadata {
  readonly userId?: string; // 操作用户ID
  readonly tenantId?: string; // 租户ID
  readonly ipAddress?: string; // IP地址
  readonly userAgent?: string; // 用户代理
  readonly correlationId?: string; // 关联ID
  readonly causationId?: string; // 因果ID
  readonly timestamp: Date; // 时间戳
  readonly source: string; // 事件源
  readonly version: string; // 应用版本
}

/**
 * @class DomainEvent
 * @description
 * 领域事件基类，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示业务状态变更的重要时刻
 * 2. 包含事件发生时的关键信息
 * 3. 为其他聚合根提供状态变更通知
 *
 * 触发条件：
 * 1. 聚合根状态发生变更时自动触发
 * 2. 业务规则验证通过
 * 3. 事件数据完整性检查通过
 *
 * 影响范围：
 * 1. 通知其他聚合根状态变更
 * 2. 触发后续业务流程
 * 3. 更新读模型视图
 * 4. 记录业务审计日志
 *
 * @property {string} eventId 事件的唯一标识符
 * @property {string} aggregateId 聚合根的唯一标识符
 * @property {Date} occurredOn 事件发生的时间戳
 * @property {string} eventType 事件的类型名称
 * @property {number} eventVersion 事件的版本号
 * @property {EventMetadata} metadata 事件元数据，用于审计追踪和业务分析
 *
 * @example
 * ```typescript
 * class UserCreatedEvent extends DomainEvent {
 *   constructor(
 *     aggregateId: string,
 *     public readonly email: string,
 *     public readonly tenantId: string
 *   ) {
 *     super(aggregateId);
 *   }
 *
 *   toJSON(): any {
 *     return {
 *       ...this.getBaseEventData(),
 *       email: this.email,
 *       tenantId: this.tenantId
 *     };
 *   }
 * }
 * ```
 * @abstract
 * @since 1.0.0
 */
export abstract class DomainEvent {
  /**
   * 事件的唯一标识符
   * 使用UUID确保全局唯一性
   */
  public readonly eventId: string;

  /**
   * 聚合根的唯一标识符
   * 标识事件所属的聚合根
   */
  public readonly aggregateId: string;

  /**
   * 事件发生的时间戳
   * 记录事件发生的精确时间
   */
  public readonly occurredOn: Date;

  /**
   * 事件的类型名称
   * 使用构造函数名称作为事件类型
   */
  public readonly eventType: string;

  /**
   * 事件的版本号
   * 用于事件的版本控制和兼容性处理
   */
  public readonly eventVersion: number;

  /**
   * 事件元数据
   * 用于审计追踪和业务分析
   */
  public readonly metadata: EventMetadata;

  /**
   * 构造函数
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   * @param {number} [eventVersion=1] - 事件的版本号，默认为1
   * @param {EventMetadata} [metadata] - 事件元数据，可选
   *
   * @throws {Error} 当aggregateId为空或无效时抛出错误
   */
  constructor(
    aggregateId: string,
    eventVersion: number = 1,
    metadata?: Partial<EventMetadata>,
  ) {
    if (!aggregateId || aggregateId.trim().length === 0) {
      throw new Error('聚合根ID不能为空');
    }

    if (eventVersion < 1) {
      throw new Error('事件版本号必须大于等于1');
    }

    this.eventId = uuidv4();
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
    this.eventVersion = eventVersion;
    this.metadata = {
      timestamp: new Date(),
      source: 'domain',
      version: '1.0.0',
      ...metadata,
    };
  }

  /**
   * 将事件转换为JSON格式
   *
   * 子类应该重写此方法，提供具体的事件数据序列化。
   * 基类提供默认实现，包含事件的基本属性。
   *
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  abstract toJSON(): Record<string, unknown>;

  /**
   * 获取事件的基本信息
   *
   * @returns {object} 包含事件基本信息的对象
   */
  protected getBaseEventData(): object {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      metadata: this.metadata,
    };
  }

  /**
   * 获取事件类型
   * @returns {string} 事件类型
   */
  public getEventType(): string {
    return this.eventType;
  }

  /**
   * 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  public getAggregateId(): string {
    return this.aggregateId;
  }

  /**
   * 获取事件ID
   * @returns {string} 事件ID
   */
  public getEventId(): string {
    return this.eventId;
  }

  /**
   * 获取事件元数据
   * @returns {EventMetadata} 事件元数据
   */
  public getMetadata(): EventMetadata {
    return this.metadata;
  }

  /**
   * 获取关联ID
   * @returns {string | undefined} 关联ID
   */
  public getCorrelationId(): string | undefined {
    return this.metadata.correlationId;
  }

  /**
   * 获取因果ID
   * @returns {string | undefined} 因果ID
   */
  public getCausationId(): string | undefined {
    return this.metadata.causationId;
  }

  /**
   * 获取租户ID
   * @returns {string | undefined} 租户ID
   */
  public getTenantId(): string | undefined {
    return this.metadata.tenantId;
  }

  /**
   * 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  public getUserId(): string | undefined {
    return this.metadata.userId;
  }

  /**
   * 验证事件数据的有效性
   *
   * 子类可以重写此方法，添加特定的事件数据验证逻辑。
   * 基类提供基本的验证，确保事件的基本属性有效。
   *
   * @throws {Error} 当事件数据无效时抛出错误
   */
  protected validateEventData(): void {
    if (!this.eventId || this.eventId.trim().length === 0) {
      throw new Error('事件ID不能为空');
    }

    if (!this.aggregateId || this.aggregateId.trim().length === 0) {
      throw new Error('聚合根ID不能为空');
    }

    if (isNaN(this.occurredOn.getTime())) {
      throw new Error('事件发生时间无效');
    }

    if (!this.eventType || this.eventType.trim().length === 0) {
      throw new Error('事件类型不能为空');
    }

    if (this.eventVersion < 1) {
      throw new Error('事件版本号必须大于等于1');
    }
  }
}
