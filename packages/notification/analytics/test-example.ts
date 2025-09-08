/**
 * @fileoverview 通知分析子领域测试示例
 * @description 展示如何使用通知分析子领域的各种功能
 */

import { NotifAnalyticsService } from './src/domain/services/notif-analytics.service';
import { NotifAnalyticsAggregate } from './src/domain/aggregates/notif-analytics.aggregate';
import {
  AnalyticsMetric,
  AnalyticsMetricType,
  AnalyticsTimeRange,
} from './src/domain/value-objects/analytics-metric.vo';
import {
  AnalyticsDimension,
  AnalyticsDimensionType,
} from './src/domain/value-objects/analytics-dimension.vo';
import {
  AnalyticsReport,
  AnalyticsReportType,
} from './src/domain/value-objects/analytics-report.vo';

/**
 * @class NotifAnalyticsTestExample
 * @description 通知分析子领域测试示例类
 */
export class NotifAnalyticsTestExample {
  private analyticsService: NotifAnalyticsService;

  constructor() {
    this.analyticsService = new NotifAnalyticsService();
  }

  /**
   * @method testBasicAnalytics
   * @description 测试基础分析功能
   */
  async testBasicAnalytics(): Promise<void> {
    console.log('🧪 测试基础分析功能...');

    try {
      // 创建分析指标
      const deliveryRate = AnalyticsMetric.createDeliveryRate(
        95.5,
        new Date(),
        AnalyticsTimeRange.DAY,
      );

      const openRate = AnalyticsMetric.createOpenRate(
        25.3,
        new Date(),
        AnalyticsTimeRange.DAY,
      );

      const clickRate = AnalyticsMetric.createClickRate(
        8.7,
        new Date(),
        AnalyticsTimeRange.DAY,
      );

      // 创建分析维度
      const channelDimension = AnalyticsDimension.createChannel('email');
      const timeDimension = AnalyticsDimension.createTime(new Date());
      const userDimension = AnalyticsDimension.createUser('user-123');

      // 创建分析数据
      const analytics = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
          departmentId: 'dept-789',
          userId: 'user-123',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [deliveryRate, openRate, clickRate],
          dimensions: [channelDimension, timeDimension, userDimension],
        },
      );

      // 验证结果
      console.log('✅ 分析创建成功:', analytics.getId());
      console.log('📊 指标数量:', analytics.getTotalMetrics());
      console.log('📋 维度数量:', analytics.getTotalDimensions());
      console.log(
        '📈 送达率:',
        analytics.getMetricByType('delivery_rate')?.getValue(),
      );
    } catch (error) {
      console.error('❌ 基础分析测试失败:', error);
    }
  }

  /**
   * @method testMetricsCalculation
   * @description 测试指标计算功能
   */
  async testMetricsCalculation(): Promise<void> {
    console.log('🧪 测试指标计算功能...');

    try {
      // 创建原始指标数据
      const sentMetrics = [
        AnalyticsMetric.createVolume(
          1000,
          'messages',
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createVolume(
          1200,
          'messages',
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createVolume(
          1100,
          'messages',
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
      ];

      const deliveredMetrics = [
        AnalyticsMetric.createDeliveryRate(
          95.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createDeliveryRate(
          96.5,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createDeliveryRate(
          94.8,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
      ];

      const openMetrics = [
        AnalyticsMetric.createOpenRate(
          25.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createOpenRate(
          26.5,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createOpenRate(
          24.8,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
      ];

      const clickMetrics = [
        AnalyticsMetric.createClickRate(
          8.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createClickRate(
          9.5,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createClickRate(
          8.8,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
      ];

      const allMetrics = [
        ...sentMetrics,
        ...deliveredMetrics,
        ...openMetrics,
        ...clickMetrics,
      ];
      const dimensions = [
        AnalyticsDimension.createChannel('email'),
        AnalyticsDimension.createTime(new Date()),
      ];

      // 计算聚合指标
      const calculatedMetrics = this.analyticsService.calculateMetrics(
        allMetrics,
        dimensions,
      );

      console.log('✅ 指标计算成功');
      console.log('📊 计算后指标数量:', calculatedMetrics.length);
      console.log(
        '📈 平均送达率:',
        calculatedMetrics
          .find(m => m.getType() === AnalyticsMetricType.DELIVERY_RATE)
          ?.getValue(),
      );
      console.log(
        '👁️ 平均打开率:',
        calculatedMetrics
          .find(m => m.getType() === AnalyticsMetricType.OPEN_RATE)
          ?.getValue(),
      );
      console.log(
        '🖱️ 平均点击率:',
        calculatedMetrics
          .find(m => m.getType() === AnalyticsMetricType.CLICK_RATE)
          ?.getValue(),
      );
    } catch (error) {
      console.error('❌ 指标计算测试失败:', error);
    }
  }

  /**
   * @method testReportGeneration
   * @description 测试报告生成功能
   */
  async testReportGeneration(): Promise<void> {
    console.log('🧪 测试报告生成功能...');

    try {
      // 创建分析数据
      const analytics = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [
            AnalyticsMetric.createDeliveryRate(
              95.5,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
            AnalyticsMetric.createOpenRate(
              25.3,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
            AnalyticsMetric.createClickRate(
              8.7,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
          ],
          dimensions: [
            AnalyticsDimension.createChannel('email'),
            AnalyticsDimension.createTime(new Date()),
          ],
        },
      );

      // 生成摘要报告
      const summaryReport = this.analyticsService.generateReport(analytics, {
        reportType: AnalyticsReportType.SUMMARY,
        title: '邮件通知效果摘要报告',
        description: '2024年1月邮件通知效果分析',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      console.log('✅ 摘要报告生成成功:', summaryReport.getTitle());
      console.log('📊 报告状态:', summaryReport.getStatus());
      console.log('📈 报告指标数量:', summaryReport.getTotalMetrics());

      // 生成详细报告
      const detailedReport = this.analyticsService.generateReport(analytics, {
        reportType: AnalyticsReportType.DETAILED,
        title: '邮件通知详细分析报告',
        description: '包含详细指标和维度的分析报告',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      console.log('✅ 详细报告生成成功:', detailedReport.getTitle());
      console.log('📊 报告状态:', detailedReport.getStatus());
      console.log('📋 报告维度数量:', detailedReport.getTotalDimensions());

      // 生成趋势报告
      const trendReport = this.analyticsService.generateReport(analytics, {
        reportType: AnalyticsReportType.TREND,
        title: '邮件通知趋势分析报告',
        description: '分析邮件通知效果的时间趋势',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      console.log('✅ 趋势报告生成成功:', trendReport.getTitle());
      console.log('📊 报告状态:', trendReport.getStatus());
      console.log('⏱️ 报告时间跨度:', trendReport.getDurationInDays(), '天');
    } catch (error) {
      console.error('❌ 报告生成测试失败:', error);
    }
  }

  /**
   * @method testDataProcessing
   * @description 测试数据处理功能
   */
  async testDataProcessing(): Promise<void> {
    console.log('🧪 测试数据处理功能...');

    try {
      // 创建分析聚合根
      const analytics = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [],
          dimensions: [],
        },
      );

      // 处理新的指标数据
      const newMetrics = [
        AnalyticsMetric.createDeliveryRate(
          96.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createOpenRate(
          26.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
        AnalyticsMetric.createClickRate(
          9.0,
          new Date(),
          AnalyticsTimeRange.DAY,
        ),
      ];

      const newDimensions = [
        AnalyticsDimension.createChannel('email'),
        AnalyticsDimension.createTime(new Date()),
        AnalyticsDimension.createUser('user-456'),
      ];

      // 处理数据
      this.analyticsService.processAnalyticsData(
        analytics,
        newMetrics,
        newDimensions,
      );

      console.log('✅ 数据处理成功');
      console.log('📊 处理后指标数量:', analytics.getTotalMetrics());
      console.log('📋 处理后维度数量:', analytics.getTotalDimensions());

      // 验证数据
      const deliveryRate = analytics.getMetricByType('delivery_rate');
      const channelDimension = analytics.getDimensionByType('channel');

      console.log(
        '📈 送达率指标:',
        deliveryRate?.getValue(),
        deliveryRate?.getUnit(),
      );
      console.log('📺 频道维度:', channelDimension?.getStringValue());
    } catch (error) {
      console.error('❌ 数据处理测试失败:', error);
    }
  }

  /**
   * @method testAnalyticsQuery
   * @description 测试分析查询功能
   */
  async testAnalyticsQuery(): Promise<void> {
    console.log('🧪 测试分析查询功能...');

    try {
      // 查询分析数据
      const results = this.analyticsService.queryAnalytics({
        tenantId: 'tenant-123',
        organizationId: 'org-456',
        channel: 'email',
        notificationType: 'marketing',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        limit: 10,
        offset: 0,
      });

      console.log('✅ 分析查询成功');
      console.log('📊 查询结果数量:', results.length);

      // 查询特定频道数据
      const emailResults = this.analyticsService.queryAnalytics({
        tenantId: 'tenant-123',
        channel: 'email',
        limit: 5,
      });

      console.log('📧 邮件频道查询结果数量:', emailResults.length);

      // 查询特定时间范围数据
      const timeRangeResults = this.analyticsService.queryAnalytics({
        tenantId: 'tenant-123',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-07'),
        },
      });

      console.log('📅 时间范围查询结果数量:', timeRangeResults.length);
    } catch (error) {
      console.error('❌ 分析查询测试失败:', error);
    }
  }

  /**
   * @method testAnalyticsEvents
   * @description 测试分析事件发布
   */
  async testAnalyticsEvents(): Promise<void> {
    console.log('🧪 测试分析事件发布...');

    try {
      // 创建分析聚合根
      const analytics = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [
            AnalyticsMetric.createDeliveryRate(
              95.5,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
          ],
          dimensions: [AnalyticsDimension.createChannel('email')],
        },
      );

      console.log('✅ 分析创建成功:', analytics.getId());

      // 获取未提交的事件
      const uncommittedEvents = analytics.getUncommittedEvents();
      console.log('📋 未提交事件数量:', uncommittedEvents.length);
      console.log(
        '📝 事件类型:',
        uncommittedEvents.map(e => e.getEventType()),
      );

      // 添加新指标并检查事件
      const newMetric = AnalyticsMetric.createOpenRate(
        25.3,
        new Date(),
        AnalyticsTimeRange.DAY,
      );
      analytics.addMetric(newMetric);

      const updateEvents = analytics.getUncommittedEvents();
      console.log('🔄 更新事件数量:', updateEvents.length);
      console.log(
        '📝 更新事件类型:',
        updateEvents.map(e => e.getEventType()),
      );

      // 生成报告并检查事件
      const report = this.analyticsService.generateReport(analytics, {
        reportType: AnalyticsReportType.SUMMARY,
        title: '测试报告',
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
      });

      const reportEvents = analytics.getUncommittedEvents();
      console.log('📊 报告事件数量:', reportEvents.length);
      console.log(
        '📝 报告事件类型:',
        reportEvents.map(e => e.getEventType()),
      );
    } catch (error) {
      console.error('❌ 分析事件测试失败:', error);
    }
  }

  /**
   * @method testAnalyticsValidation
   * @description 测试分析数据验证
   */
  async testAnalyticsValidation(): Promise<void> {
    console.log('🧪 测试分析数据验证...');

    try {
      // 测试有效数据
      const validAnalytics = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [
            AnalyticsMetric.createDeliveryRate(
              95.5,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
          ],
          dimensions: [AnalyticsDimension.createChannel('email')],
        },
      );

      console.log('✅ 有效数据验证通过:', validAnalytics.getId());

      // 测试无效租户ID
      try {
        this.analyticsService.createAnalytics(
          {
            tenantId: '',
          },
          {
            channel: 'email',
            notificationType: 'marketing',
            priority: 'normal',
            strategy: 'immediate',
            metrics: [],
            dimensions: [],
          },
        );
      } catch (error) {
        console.log('✅ 无效租户ID验证通过:', error.message);
      }

      // 测试无效频道
      try {
        this.analyticsService.createAnalytics(
          {
            tenantId: 'tenant-123',
          },
          {
            channel: '',
            notificationType: 'marketing',
            priority: 'normal',
            strategy: 'immediate',
            metrics: [],
            dimensions: [],
          },
        );
      } catch (error) {
        console.log('✅ 无效频道验证通过:', error.message);
      }

      // 测试无效指标数据
      try {
        this.analyticsService.createAnalytics(
          {
            tenantId: 'tenant-123',
          },
          {
            channel: 'email',
            notificationType: 'marketing',
            priority: 'normal',
            strategy: 'immediate',
            metrics: [], // 空指标数组
            dimensions: [],
          },
        );
      } catch (error) {
        console.log('✅ 无效指标数据验证通过:', error.message);
      }
    } catch (error) {
      console.error('❌ 分析数据验证测试失败:', error);
    }
  }

  /**
   * @method testAnalyticsAggregation
   * @description 测试分析数据聚合
   */
  async testAnalyticsAggregation(): Promise<void> {
    console.log('🧪 测试分析数据聚合...');

    try {
      // 创建多个分析聚合根
      const analytics1 = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
        },
        {
          channel: 'email',
          notificationType: 'marketing',
          priority: 'normal',
          strategy: 'immediate',
          metrics: [
            AnalyticsMetric.createDeliveryRate(
              95.0,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
            AnalyticsMetric.createOpenRate(
              25.0,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
          ],
          dimensions: [
            AnalyticsDimension.createChannel('email'),
            AnalyticsDimension.createTime(new Date()),
          ],
        },
      );

      const analytics2 = this.analyticsService.createAnalytics(
        {
          tenantId: 'tenant-123',
          organizationId: 'org-456',
        },
        {
          channel: 'push',
          notificationType: 'system',
          priority: 'high',
          strategy: 'immediate',
          metrics: [
            AnalyticsMetric.createDeliveryRate(
              98.0,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
            AnalyticsMetric.createOpenRate(
              45.0,
              new Date(),
              AnalyticsTimeRange.DAY,
            ),
          ],
          dimensions: [
            AnalyticsDimension.createChannel('push'),
            AnalyticsDimension.createTime(new Date()),
          ],
        },
      );

      console.log('✅ 分析聚合根创建成功');
      console.log('📊 分析1指标数量:', analytics1.getTotalMetrics());
      console.log('📊 分析2指标数量:', analytics2.getTotalMetrics());

      // 聚合指标数据
      const allMetrics = [
        ...analytics1.getMetrics(),
        ...analytics2.getMetrics(),
      ];

      const allDimensions = [
        ...analytics1.getDimensions(),
        ...analytics2.getDimensions(),
      ];

      // 计算聚合指标
      const aggregatedMetrics = this.analyticsService.calculateMetrics(
        allMetrics,
        allDimensions,
      );

      console.log('✅ 数据聚合成功');
      console.log('📊 聚合后指标数量:', aggregatedMetrics.length);
      console.log(
        '📈 聚合送达率:',
        aggregatedMetrics
          .find(m => m.getType() === AnalyticsMetricType.DELIVERY_RATE)
          ?.getValue(),
      );
      console.log(
        '👁️ 聚合打开率:',
        aggregatedMetrics
          .find(m => m.getType() === AnalyticsMetricType.OPEN_RATE)
          ?.getValue(),
      );
    } catch (error) {
      console.error('❌ 分析数据聚合测试失败:', error);
    }
  }

  /**
   * @method runAllTests
   * @description 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行通知分析子领域测试...\n');

    await this.testBasicAnalytics();
    console.log('');

    await this.testMetricsCalculation();
    console.log('');

    await this.testReportGeneration();
    console.log('');

    await this.testDataProcessing();
    console.log('');

    await this.testAnalyticsQuery();
    console.log('');

    await this.testAnalyticsEvents();
    console.log('');

    await this.testAnalyticsValidation();
    console.log('');

    await this.testAnalyticsAggregation();
    console.log('');

    console.log('🎉 所有测试完成！');
  }
}

// 导出测试示例
export default NotifAnalyticsTestExample;

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const testExample = new NotifAnalyticsTestExample();
  testExample.runAllTests().catch(console.error);
}
