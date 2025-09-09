// 值对象导出
// 使用共享模块中的值对象
export {
  PhoneNumber,
  PhoneRegion,
  InvalidPhoneNumberError,
} from '@aiofix/shared';
export {
  NotifStatus,
  NotifStatusType,
  InvalidStatusTransitionError,
} from '@aiofix/shared';
export * from './value-objects/sms-content.vo';
export * from './value-objects/sms-provider.vo';

// 实体导出
export * from './entities/sms-notif.entity';

// 聚合根导出
export * from './aggregates/sms-notif.aggregate';

// 领域事件导出
export * from './events/sms-notif-created.event';
export * from './events/sms-notif-sending.event';
export * from './events/sms-notif-sent.event';
export * from './events/sms-notif-delivered.event';
export * from './events/sms-notif-failed.event';
export * from './events/sms-notif-permanently-failed.event';
export * from './events/sms-notif-retrying.event';
export * from './events/sms-notif-scheduled.event';
export * from './events/sms-notif-cancelled.event';

// 领域服务导出
export * from './services/sms-notif.service';

// 测试示例导出
