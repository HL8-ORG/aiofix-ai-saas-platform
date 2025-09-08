/**
 * @fileoverview 通知编排子领域测试示例
 * @description 展示如何使用通知编排子领域的各种功能
 */

import { NotifOrchestrationService } from './src/domain/services/notif-orchestration.service';
import { NotifOrchestration } from './src/domain/aggregates/notif-orchestration.aggregate';
import { NotifChannel } from './src/domain/value-objects/notif-channel.vo';
import { NotifStrategy } from './src/domain/value-objects/notif-strategy.vo';
import { OrchestrationStatus } from './src/domain/value-objects/orchestration-status.vo';

/**
 * @class NotifOrchestrationTestExample
 * @description 通知编排子领域测试示例类
 */
export class NotifOrchestrationTestExample {
  private orchestrationService: NotifOrchestrationService;

  constructor() {
    this.orchestrationService = new NotifOrchestrationService();
  }

  /**
   * @method testBasicOrchestration
   * @description 测试基础编排功能
   */
  async testBasicOrchestration(): Promise<void> {
    console.log('🧪 测试基础编排功能...');

    try {
      // 创建编排请求
      const orchestrationRequest = {
        notificationId: 'notif-123',
        userId: 'user-456',
        tenantId: 'tenant-789',
        channels: [
          new NotifChannel('email', { priority: 1, enabled: true }),
          new NotifChannel('push', { priority: 2, enabled: true }),
          new NotifChannel('sms', { priority: 3, enabled: false }),
        ],
        strategy: new NotifStrategy('immediate', {
          maxRetries: 3,
          retryDelay: 1000,
          timeout: 30000,
        }),
        priority: 'high',
      };

      // 执行编排
      const orchestration =
        await this.orchestrationService.orchestrateNotification(
          orchestrationRequest,
        );

      // 验证结果
      console.log('✅ 编排创建成功:', orchestration.getId());
      console.log('📊 编排状态:', orchestration.getStatus().getValue());
      console.log(
        '📋 编排频道:',
        orchestration.getChannels().map(c => c.getType()),
      );
    } catch (error) {
      console.error('❌ 基础编排测试失败:', error);
    }
  }

  /**
   * @method testStrategyOrchestration
   * @description 测试策略化编排
   */
  async testStrategyOrchestration(): Promise<void> {
    console.log('🧪 测试策略化编排...');

    try {
      // 测试立即发送策略
      const immediateStrategy = new NotifStrategy('immediate', {
        maxRetries: 1,
        retryDelay: 500,
        timeout: 10000,
      });

      const immediateOrchestration =
        await this.orchestrationService.orchestrateWithStrategy({
          notificationId: 'notif-immediate-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          strategy: immediateStrategy,
          channels: [new NotifChannel('push', { priority: 1, enabled: true })],
        });

      console.log('✅ 立即策略编排成功:', immediateOrchestration.getId());

      // 测试延迟发送策略
      const delayedStrategy = new NotifStrategy('delayed', {
        delay: 5000,
        maxRetries: 2,
        retryDelay: 2000,
        timeout: 15000,
      });

      const delayedOrchestration =
        await this.orchestrationService.orchestrateWithStrategy({
          notificationId: 'notif-delayed-456',
          userId: 'user-456',
          tenantId: 'tenant-789',
          strategy: delayedStrategy,
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
        });

      console.log('✅ 延迟策略编排成功:', delayedOrchestration.getId());

      // 测试批量发送策略
      const batchStrategy = new NotifStrategy('batch', {
        batchSize: 10,
        batchDelay: 1000,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
      });

      const batchOrchestration =
        await this.orchestrationService.orchestrateWithStrategy({
          notificationId: 'notif-batch-789',
          userId: 'user-456',
          tenantId: 'tenant-789',
          strategy: batchStrategy,
          channels: [
            new NotifChannel('email', { priority: 1, enabled: true }),
            new NotifChannel('push', { priority: 2, enabled: true }),
          ],
        });

      console.log('✅ 批量策略编排成功:', batchOrchestration.getId());
    } catch (error) {
      console.error('❌ 策略化编排测试失败:', error);
    }
  }

  /**
   * @method testPriorityOrchestration
   * @description 测试优先级编排
   */
  async testPriorityOrchestration(): Promise<void> {
    console.log('🧪 测试优先级编排...');

    try {
      // 测试高优先级编排
      const highPriorityOrchestration =
        await this.orchestrationService.orchestrateWithPriority({
          notificationId: 'notif-high-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          priority: 'urgent',
          channels: [
            new NotifChannel('push', { priority: 1, enabled: true }),
            new NotifChannel('sms', { priority: 2, enabled: true }),
          ],
        });

      console.log('✅ 高优先级编排成功:', highPriorityOrchestration.getId());
      console.log('🚨 优先级:', highPriorityOrchestration.getPriority());

      // 测试普通优先级编排
      const normalPriorityOrchestration =
        await this.orchestrationService.orchestrateWithPriority({
          notificationId: 'notif-normal-456',
          userId: 'user-456',
          tenantId: 'tenant-789',
          priority: 'normal',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
        });

      console.log(
        '✅ 普通优先级编排成功:',
        normalPriorityOrchestration.getId(),
      );
      console.log('📧 优先级:', normalPriorityOrchestration.getPriority());

      // 测试低优先级编排
      const lowPriorityOrchestration =
        await this.orchestrationService.orchestrateWithPriority({
          notificationId: 'notif-low-789',
          userId: 'user-456',
          tenantId: 'tenant-789',
          priority: 'low',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
        });

      console.log('✅ 低优先级编排成功:', lowPriorityOrchestration.getId());
      console.log('📬 优先级:', lowPriorityOrchestration.getPriority());
    } catch (error) {
      console.error('❌ 优先级编排测试失败:', error);
    }
  }

  /**
   * @method testMultiChannelOrchestration
   * @description 测试多频道编排
   */
  async testMultiChannelOrchestration(): Promise<void> {
    console.log('🧪 测试多频道编排...');

    try {
      // 创建多频道编排
      const multiChannelOrchestration =
        await this.orchestrationService.orchestrateMultiChannel({
          notificationId: 'notif-multi-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [
            new NotifChannel('email', { priority: 1, enabled: true }),
            new NotifChannel('push', { priority: 2, enabled: true }),
            new NotifChannel('sms', { priority: 3, enabled: true }),
            new NotifChannel('in-app', { priority: 4, enabled: true }),
          ],
          strategy: new NotifStrategy('immediate', {
            maxRetries: 2,
            retryDelay: 1000,
            timeout: 20000,
          }),
        });

      console.log('✅ 多频道编排成功:', multiChannelOrchestration.getId());
      console.log(
        '📺 频道数量:',
        multiChannelOrchestration.getChannels().length,
      );
      console.log(
        '📋 频道列表:',
        multiChannelOrchestration.getChannels().map(c => c.getType()),
      );

      // 验证频道状态
      const channelStatuses = multiChannelOrchestration.getChannelStatuses();
      console.log('📊 频道状态:', channelStatuses);
    } catch (error) {
      console.error('❌ 多频道编排测试失败:', error);
    }
  }

  /**
   * @method testOrchestrationStatusTransitions
   * @description 测试编排状态转换
   */
  async testOrchestrationStatusTransitions(): Promise<void> {
    console.log('🧪 测试编排状态转换...');

    try {
      // 创建编排
      const orchestration =
        await this.orchestrationService.orchestrateNotification({
          notificationId: 'notif-status-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
          strategy: new NotifStrategy('immediate', {
            maxRetries: 1,
            retryDelay: 500,
            timeout: 5000,
          }),
        });

      console.log(
        '✅ 编排创建成功，初始状态:',
        orchestration.getStatus().getValue(),
      );

      // 开始编排
      orchestration.start();
      console.log('🚀 编排开始，状态:', orchestration.getStatus().getValue());

      // 模拟完成
      orchestration.complete();
      console.log('✅ 编排完成，状态:', orchestration.getStatus().getValue());

      // 测试失败状态
      const failedOrchestration =
        await this.orchestrationService.orchestrateNotification({
          notificationId: 'notif-failed-456',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [
            new NotifChannel('invalid', { priority: 1, enabled: true }),
          ],
          strategy: new NotifStrategy('immediate', {
            maxRetries: 1,
            retryDelay: 500,
            timeout: 5000,
          }),
        });

      failedOrchestration.start();
      failedOrchestration.fail('Channel not available');
      console.log(
        '❌ 编排失败，状态:',
        failedOrchestration.getStatus().getValue(),
      );
      console.log('📝 失败原因:', failedOrchestration.getFailureReason());
    } catch (error) {
      console.error('❌ 状态转换测试失败:', error);
    }
  }

  /**
   * @method testOrchestrationRetry
   * @description 测试编排重试机制
   */
  async testOrchestrationRetry(): Promise<void> {
    console.log('🧪 测试编排重试机制...');

    try {
      // 创建支持重试的编排
      const retryOrchestration =
        await this.orchestrationService.orchestrateNotification({
          notificationId: 'notif-retry-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
          strategy: new NotifStrategy('immediate', {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 10000,
          }),
        });

      console.log('✅ 重试编排创建成功:', retryOrchestration.getId());

      // 模拟失败和重试
      retryOrchestration.start();
      retryOrchestration.fail('Network timeout');
      console.log(
        '❌ 第一次失败，状态:',
        retryOrchestration.getStatus().getValue(),
      );

      retryOrchestration.retry();
      console.log(
        '🔄 第一次重试，状态:',
        retryOrchestration.getStatus().getValue(),
      );

      retryOrchestration.fail('Service unavailable');
      retryOrchestration.retry();
      console.log(
        '🔄 第二次重试，状态:',
        retryOrchestration.getStatus().getValue(),
      );

      retryOrchestration.fail('Rate limit exceeded');
      retryOrchestration.retry();
      console.log(
        '🔄 第三次重试，状态:',
        retryOrchestration.getStatus().getValue(),
      );

      // 最终完成
      retryOrchestration.complete();
      console.log(
        '✅ 重试后完成，状态:',
        retryOrchestration.getStatus().getValue(),
      );
      console.log('📊 重试次数:', retryOrchestration.getRetryCount());
    } catch (error) {
      console.error('❌ 重试机制测试失败:', error);
    }
  }

  /**
   * @method testOrchestrationCancellation
   * @description 测试编排取消功能
   */
  async testOrchestrationCancellation(): Promise<void> {
    console.log('🧪 测试编排取消功能...');

    try {
      // 创建可取消的编排
      const cancellableOrchestration =
        await this.orchestrationService.orchestrateNotification({
          notificationId: 'notif-cancel-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
          strategy: new NotifStrategy('delayed', {
            delay: 10000,
            maxRetries: 1,
            retryDelay: 500,
            timeout: 5000,
          }),
        });

      console.log('✅ 可取消编排创建成功:', cancellableOrchestration.getId());

      // 开始编排
      cancellableOrchestration.start();
      console.log(
        '🚀 编排开始，状态:',
        cancellableOrchestration.getStatus().getValue(),
      );

      // 取消编排
      cancellableOrchestration.cancel('User requested cancellation');
      console.log(
        '🛑 编排取消，状态:',
        cancellableOrchestration.getStatus().getValue(),
      );
      console.log(
        '📝 取消原因:',
        cancellableOrchestration.getCancellationReason(),
      );
    } catch (error) {
      console.error('❌ 取消功能测试失败:', error);
    }
  }

  /**
   * @method testOrchestrationEvents
   * @description 测试编排事件发布
   */
  async testOrchestrationEvents(): Promise<void> {
    console.log('🧪 测试编排事件发布...');

    try {
      // 创建编排并监听事件
      const orchestration =
        await this.orchestrationService.orchestrateNotification({
          notificationId: 'notif-events-123',
          userId: 'user-456',
          tenantId: 'tenant-789',
          channels: [new NotifChannel('email', { priority: 1, enabled: true })],
          strategy: new NotifStrategy('immediate', {
            maxRetries: 1,
            retryDelay: 500,
            timeout: 5000,
          }),
        });

      console.log('✅ 事件编排创建成功:', orchestration.getId());

      // 获取未提交的事件
      const uncommittedEvents = orchestration.getUncommittedEvents();
      console.log('📋 未提交事件数量:', uncommittedEvents.length);
      console.log(
        '📝 事件类型:',
        uncommittedEvents.map(e => e.getEventType()),
      );

      // 模拟状态变更并检查事件
      orchestration.start();
      const startEvents = orchestration.getUncommittedEvents();
      console.log(
        '🚀 开始事件:',
        startEvents.filter(
          e => e.getEventType() === 'NotifOrchestrationStarted',
        ).length,
      );

      orchestration.complete();
      const completeEvents = orchestration.getUncommittedEvents();
      console.log(
        '✅ 完成事件:',
        completeEvents.filter(
          e => e.getEventType() === 'NotifOrchestrationCompleted',
        ).length,
      );
    } catch (error) {
      console.error('❌ 事件发布测试失败:', error);
    }
  }

  /**
   * @method runAllTests
   * @description 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行通知编排子领域测试...\n');

    await this.testBasicOrchestration();
    console.log('');

    await this.testStrategyOrchestration();
    console.log('');

    await this.testPriorityOrchestration();
    console.log('');

    await this.testMultiChannelOrchestration();
    console.log('');

    await this.testOrchestrationStatusTransitions();
    console.log('');

    await this.testOrchestrationRetry();
    console.log('');

    await this.testOrchestrationCancellation();
    console.log('');

    await this.testOrchestrationEvents();
    console.log('');

    console.log('🎉 所有测试完成！');
  }
}

// 导出测试示例
export default NotifOrchestrationTestExample;

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const testExample = new NotifOrchestrationTestExample();
  testExample.runAllTests().catch(console.error);
}
