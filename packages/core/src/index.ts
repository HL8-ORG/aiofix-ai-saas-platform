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

// 基础事件处理器类
export { BaseEventHandler } from './domain/base/base-event-handler';

// 领域事件
export { DomainEvent } from './domain/domain-event';

// 通用值对象
export { ValueObject } from './domain/value-object';
export { generateUUID, validateUUID } from './domain/utils/uuid';

// 事件驱动架构接口
export * from './domain/interfaces';

// 应用层接口和基类
export { IUseCase } from './application/use-cases/use-case.interface';
export { ICommandHandler } from './application/handlers/command-handler.interface';
export { IQueryHandler } from './application/handlers/query-handler.interface';
export { BaseCommandHandler } from './application/handlers/base-command-handler';
export { BaseQueryHandler } from './application/handlers/base-query-handler';
