/**
 * 核心架构包入口文件
 *
 * 导出所有核心架构组件，包括：
 * - 领域层组件（聚合根、领域事件、接口）
 * - 应用层组件（命令、查询）
 * - 基础设施层组件（事件存储接口）
 *
 * @fileoverview 核心架构包 - 提供DDD、CQRS、事件溯源基础组件
 * @author AI开发团队
 * @since 1.0.0
 */

// 领域层导出
export { EventSourcedAggregateRoot } from './domain/event-sourced-aggregate-root';
export { DomainEvent } from './domain/domain-event';

// 领域层接口导出
export type {
  IDomainEvent,
  IAggregateSnapshot,
} from './domain/interfaces/domain-event.interface';
export type { IEventStore } from './domain/interfaces/event-store.interface';
export {
  ConcurrencyError,
  EventStoreError,
} from './domain/interfaces/event-store.interface';

// 数据隔离相关导出
export type {
  DataIsolationContext,
  DataClassification,
  DataIsolationPolicy,
  IsolationLevel,
  IDataIsolationService,
} from './domain/interfaces/data-isolation.interface';
export { DataIsolationService } from './domain/services/data-isolation.service';

// 应用层导出
export { Command } from './application/commands/command';
export { Query } from './application/queries/query';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/core';
