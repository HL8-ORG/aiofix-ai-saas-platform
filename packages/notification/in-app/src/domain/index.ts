/**
 * @file index.ts
 * @description
 * 站内通知领域层入口文件，导出所有领域层相关的类和接口。
 *
 * 导出内容：
 * 1. 聚合根：InAppNotif
 * 2. 值对象：NotifId, TenantId, UserId, NotifType, NotifPriority, ReadStatus
 * 3. 领域事件：InAppNotifCreatedEvent, InAppNotifReadEvent, InAppNotifArchivedEvent
 * 4. 领域服务：NotifCenter
 * 5. 验证器：ReadStatusValidator, NotifTypeValidator, NotifPriorityValidator
 * 6. 错误类：各种领域错误
 *
 * @since 1.0.0
 */

// 基类（从core包导入）
export {
  BaseEntity,
  AuditInfo,
  InvalidOperationError,
  InvalidAuditStateError,
  ValidationError,
  EventSourcedAggregateRoot,
} from '@aiofix/core';

// 领域实体
export {
  InAppNotifEntity,
  InvalidNotifDataError,
} from './entities/in-app-notif.entity';

// 聚合根
export { InAppNotif } from './aggregates/in-app-notif.aggregate';

// 值对象
export { NotifId, InvalidNotifIdError } from '@aiofix/shared';
export { TenantId, InvalidTenantIdError } from '@aiofix/shared';
export { UserId, InvalidUserIdError } from '@aiofix/shared';
export {
  NotifType,
  NotifTypeValidator,
  InvalidNotifTypeError,
} from './value-objects/notif-type.vo';
export {
  NotifPriority,
  NotifPriorityValidator,
  InvalidNotifPriorityError,
} from './value-objects/notif-priority.vo';
export {
  ReadStatus,
  ReadStatusValidator,
  InvalidStatusTransitionError,
} from './value-objects/read-status.vo';

// 领域事件
export {
  InAppNotifCreatedEvent,
  InvalidEventDataError,
} from './events/in-app-notif-created.event';
export { InAppNotifReadEvent } from './events/in-app-notif-read.event';
export { InAppNotifArchivedEvent } from './events/in-app-notif-archived.event';

// 领域服务
export { NotifCenter } from './services/notif-center.service';

// 聚合根错误（已移动到实体中）
