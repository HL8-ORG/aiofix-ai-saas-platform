/**
 * @fileoverview 通知分析子领域主入口文件
 * @description 导出通知分析子领域的所有公共API
 */

// 导出领域层所有组件
export * from './domain';

// 导出类型定义
export type {
  NotifAnalyticsServiceProps,
  NotifAnalyticsData,
  NotifAnalyticsReportRequest,
  NotifAnalyticsQuery,
} from './domain';

// 导出常量
export {
  AnalyticsMetricType,
  AnalyticsTimeRange,
  AnalyticsDimensionType,
  AnalyticsDimensionValueType,
  AnalyticsReportType,
  AnalyticsReportStatus,
} from './domain';

// 导出工具函数
export {
  createNotifAnalytics,
  validateAnalyticsData,
  calculateAnalyticsMetrics,
  formatAnalyticsReport,
} from './domain';
