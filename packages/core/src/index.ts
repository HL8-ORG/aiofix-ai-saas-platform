/**
 * @fileoverview Aiofix平台核心领域模型和基础类
 * @description 提供所有子领域共享的基础类和接口
 * @since 1.0.0
 */

// 基础实体类
export {
  BaseEntity,
  AuditInfo,
  InvalidOperationError,
  InvalidAuditStateError,
  ValidationError,
} from './domain/base/base-entity';

// 基础聚合根类
export { EventSourcedAggregateRoot } from './domain/base/event-sourced-aggregate-root';

// 领域事件
export { DomainEvent } from './domain/domain-event';

// 通用值对象
export { ValueObject } from './domain/value-object';
export { generateUUID, validateUUID } from './domain/utils/uuid';

// 事件驱动架构接口
export * from './domain/interfaces';
