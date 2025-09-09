// 聚合根导出
export { EmailNotif } from './aggregates/email-notif.aggregate';

// 实体导出
export { EmailNotifEntity } from './entities/email-notif.entity';

// 值对象导出
export {
  EmailStatus,
  EmailStatusType,
  EmailStatusValidator,
  InvalidEmailStatusError,
  InvalidStatusTransitionError,
} from './value-objects/email-status.vo';
export {
  EmailProvider,
  EmailProviderValidator,
  InvalidEmailProviderError,
  type EmailProviderConfig,
} from './value-objects/email-provider.vo';
export {
  TemplateId,
  InvalidTemplateIdError,
} from './value-objects/template-id.vo';
export {
  EmailContent,
  InvalidEmailContentError,
} from './value-objects/email-content.vo';
export {
  EmailPriority,
  EmailPriorityType,
  InvalidEmailPriorityError,
} from './value-objects/email-priority.vo';
export { NotifType } from './value-objects/notif-type.vo';

// 领域事件导出
export { EmailNotifCreatedEvent } from './events/email-notif-created.event';
export { EmailNotifSendingEvent } from './events/email-notif-sending.event';
export { EmailNotifSentEvent } from './events/email-notif-sent.event';
export { EmailNotifFailedEvent } from './events/email-notif-failed.event';
export { EmailNotifPermanentlyFailedEvent } from './events/email-notif-permanently-failed.event';

// 领域服务导出
export { EmailNotifService } from './services/email-notif.service';

// 错误类导出
export { InvalidEmailNotifDataError } from './entities/email-notif.entity';
export { InvalidOperationError } from './aggregates/email-notif.aggregate';
