// 聚合根
export { NotifOrchestration } from './aggregates/notif-orchestration.aggregate';

// 实体
export { NotifOrchestrationEntity } from './entities/notif-orchestration.entity';

// 值对象
export {
  NotifChannel,
  NotifChannelType,
  NotifType,
  ChannelPriority,
} from './value-objects/notif-channel.vo';
export {
  NotifStrategy,
  NotifStrategyType,
} from './value-objects/notif-strategy.vo';
export {
  OrchestrationStatus,
  OrchestrationStatusType,
} from './value-objects/orchestration-status.vo';

// 领域事件
export { NotifOrchestrationCreatedEvent } from './events/notif-orchestration-created.event';
export { NotifOrchestrationStartedEvent } from './events/notif-orchestration-started.event';
export { NotifOrchestrationCompletedEvent } from './events/notif-orchestration-completed.event';
export { NotifOrchestrationFailedEvent } from './events/notif-orchestration-failed.event';
export { NotifOrchestrationRetryingEvent } from './events/notif-orchestration-retrying.event';
export { NotifOrchestrationCancelledEvent } from './events/notif-orchestration-cancelled.event';

// 领域服务
export { NotifOrchestrationService } from './services/notif-orchestration.service';

// 错误类
export { InvalidNotifOrchestrationError } from './entities/notif-orchestration.entity';
export { InvalidNotifOrchestrationOperationError } from './aggregates/notif-orchestration.aggregate';
export { InvalidNotifChannelError } from './value-objects/notif-channel.vo';
export { InvalidNotifStrategyError } from './value-objects/notif-strategy.vo';
export { InvalidStatusTransitionError } from './value-objects/orchestration-status.vo';
