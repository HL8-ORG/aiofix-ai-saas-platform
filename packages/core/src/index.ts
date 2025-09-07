/**
 * @fileoverview 核心架构包入口文件
 * @description
 * 核心架构包，提供DDD、CQRS、事件溯源的基础组件和基础设施。
 *
 * 架构组件：
 * 1. 领域层组件：聚合根、领域事件、值对象、接口定义
 * 2. 应用层组件：命令、查询基类
 * 3. 基础设施层组件：事件存储接口、数据隔离服务
 *
 * 核心特性：
 * 1. 事件溯源：支持聚合状态重建和审计
 * 2. CQRS模式：命令查询职责分离
 * 3. 多租户支持：数据隔离和权限控制
 * 4. 类型安全：完整的TypeScript类型定义
 *
 * @example
 * ```typescript
 * import { EventSourcedAggregateRoot, DomainEvent, Command, Query } from '@aiofix/core';
 *
 * // 创建事件溯源聚合根
 * class UserAggregate extends EventSourcedAggregateRoot {
 *   // 实现抽象方法
 * }
 *
 * // 创建领域事件
 * class UserCreatedEvent extends DomainEvent {
 *   // 实现事件逻辑
 * }
 * ```
 * @since 1.0.0
 */

// 领域层导出
export { EventSourcedAggregateRoot } from './domain/event-sourced-aggregate-root';
export { DomainEvent } from './domain/domain-event';
export { ValueObject } from './domain/value-object';

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
