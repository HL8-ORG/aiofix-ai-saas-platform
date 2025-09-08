// 聚合根
export { NotifAnalyticsAggregate } from './aggregates/notif-analytics.aggregate';

// 实体
export { NotifAnalyticsEntity } from './entities/notif-analytics.entity';

// 值对象
export {
  AnalyticsMetric,
  AnalyticsMetricType,
  AnalyticsTimeRange,
} from './value-objects/analytics-metric.vo';
export {
  AnalyticsDimension,
  AnalyticsDimensionType,
  AnalyticsDimensionValueType,
} from './value-objects/analytics-dimension.vo';
export {
  AnalyticsReport,
  AnalyticsReportType,
  AnalyticsReportStatus,
} from './value-objects/analytics-report.vo';

// 领域事件
export { NotifAnalyticsCreatedEvent } from './events/notif-analytics-created.event';
export { NotifAnalyticsUpdatedEvent } from './events/notif-analytics-updated.event';
export { NotifAnalyticsReportGeneratedEvent } from './events/notif-analytics-report-generated.event';
export { NotifAnalyticsReportFailedEvent } from './events/notif-analytics-report-failed.event';
export { NotifAnalyticsDataProcessedEvent } from './events/notif-analytics-data-processed.event';

// 领域服务
export { NotifAnalyticsService } from './services/notif-analytics.service';

// 错误类
export { InvalidNotifAnalyticsError } from './entities/notif-analytics.entity';
export { InvalidNotifAnalyticsOperationError } from './aggregates/notif-analytics.aggregate';
export { InvalidAnalyticsMetricError } from './value-objects/analytics-metric.vo';
export { InvalidAnalyticsDimensionError } from './value-objects/analytics-dimension.vo';
export { InvalidAnalyticsReportError } from './value-objects/analytics-report.vo';
export { InvalidNotifAnalyticsEventError } from './events/notif-analytics-created.event';
export { InvalidNotifAnalyticsServiceError } from './services/notif-analytics.service';
