// 聚合根导出
export { EmailNotif } from './aggregates/email-notif.aggregate';

// 实体导出
export { EmailNotifEntity } from './entities/email-notif.entity';

// 值对象导出
export {
  EmailAddress,
  InvalidEmailAddressError,
} from './value-objects/email-address.vo';
export {
  EmailStatus,
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
export { NotifId, InvalidNotifIdError } from './value-objects/notif-id.vo';
export { TenantId, InvalidTenantIdError } from './value-objects/tenant-id.vo';
export { UserId, InvalidUserIdError } from './value-objects/user-id.vo';

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
