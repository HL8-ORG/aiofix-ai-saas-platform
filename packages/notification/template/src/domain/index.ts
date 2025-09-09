// 聚合根导出
export { EmailTemplate } from './aggregates/email-template.aggregate';

// 实体导出
export { EmailTemplateEntity } from './entities/email-template.entity';

// 值对象导出
export {
  TemplateId,
  InvalidTemplateIdError,
} from './value-objects/template-id.vo';
export {
  TemplateType,
  TemplateTypeValidator,
  InvalidTemplateTypeError,
  type TemplateTypeConfig,
} from './value-objects/template-type.vo';
export {
  TemplateStatus,
  TemplateStatusValidator,
  InvalidTemplateStatusError,
  InvalidStatusTransitionError,
} from './value-objects/template-status.vo';
export {
  TemplateVariable,
  VariableType,
  InvalidTemplateVariableError,
} from './value-objects/template-variable.vo';
export {
  TemplateContent,
  InvalidTemplateContentError,
} from './value-objects/template-content.vo';

// 领域事件导出
export { TemplateCreatedEvent } from './events/template-created.event';
export { TemplateUpdatedEvent } from './events/template-updated.event';
export { TemplatePublishedEvent } from './events/template-published.event';
export { TemplateUnpublishedEvent } from './events/template-unpublished.event';
export { TemplateDeletedEvent } from './events/template-deleted.event';

// 领域服务导出
export { TemplateService } from './services/template.service';

// 错误类导出
export {
  InvalidEmailTemplateDataError,
  InvalidOperationError,
} from './entities/email-template.entity';
