import {
  PushNotifAggregate,
  PushToken,
  PushPlatform,
  PushContent,
  PushPriorityLevel,
  PushNotifCreatedEvent,
  PushNotifSendingEvent,
  PushNotifSentEvent,
  PushNotifDeliveredEvent,
  PushNotifFailedEvent,
  PushNotifPermanentlyFailedEvent,
  PushNotifRetryingEvent,
  PushNotifScheduledEvent,
  PushNotifService,
} from './index';

/**
 * @description 推送通知子领域测试示例
 * 展示推送通知聚合根的基本使用方法和业务逻辑
 */
export class PushNotifTestExample {
  /**
   * @method testCreatePushNotif
   * @description 测试创建推送通知
   */
  static testCreatePushNotif(): void {
    console.log('=== 测试创建推送通知 ===');

    // 1. 创建推送令牌
    const fcmToken = new PushToken(
      'fcm_token_example_12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
      PushPlatform.FCM,
    );

    // 2. 创建推送内容
    const content = new PushContent(
      '新消息通知',
      '您有一条新消息，请及时查看',
      'https://example.com/icon.png',
      'https://example.com/image.jpg',
      'open_message',
      { messageId: 'msg-123', type: 'text' },
    );

    // 3. 创建推送通知聚合根
    const aggregate = new PushNotifAggregate();

    // 4. 创建推送通知
    aggregate.createPushNotif(
      'push-123',
      'tenant-456',
      'user-789',
      fcmToken,
      content,
      PushPriorityLevel.NORMAL,
    );

    // 5. 获取未提交的事件
    const events = aggregate.getUncommittedEvents();
    console.log('创建事件数量:', events.length);
    console.log('创建事件类型:', events[0]?.getEventType());

    // 6. 获取推送通知实体
    const pushNotif = aggregate.getPushNotif();
    console.log('推送通知ID:', pushNotif.id);
    console.log('推送通知状态:', pushNotif.getStatus().getValue());
    console.log('推送通知优先级:', pushNotif.getPriority().getValue());
    console.log('推送令牌平台:', pushNotif.getPushToken().getPlatform());
  }

  /**
   * @method testSendPushNotif
   * @description 测试发送推送通知
   */
  static testSendPushNotif(): void {
    console.log('\n=== 测试发送推送通知 ===');

    // 1. 创建推送通知聚合根
    const aggregate = new PushNotifAggregate();

    // 2. 创建推送通知
    const fcmToken = new PushToken(
      'fcm_token_example_12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
      PushPlatform.FCM,
    );
    const content = new PushContent(
      '订单更新',
      '您的订单已发货，预计3天内到达',
      'https://example.com/icon.png',
    );

    aggregate.createPushNotif(
      'push-456',
      'tenant-789',
      'user-123',
      fcmToken,
      content,
      PushPriorityLevel.HIGH,
    );

    // 3. 发送推送通知
    aggregate.sendPushNotif();

    // 4. 标记为已发送
    aggregate.markAsSent();

    // 5. 标记为已送达
    aggregate.markAsDelivered();

    // 6. 获取事件
    const events = aggregate.getUncommittedEvents();
    console.log('事件数量:', events.length);
    console.log(
      '事件类型:',
      events.map(e => e.getEventType()),
    );

    // 7. 获取推送通知状态
    const pushNotif = aggregate.getPushNotif();
    console.log('最终状态:', pushNotif.getStatus().getValue());
    console.log('发送时间:', pushNotif.getSentAt());
    console.log('送达时间:', pushNotif.getDeliveredAt());
  }

  /**
   * @method testFailedPushNotif
   * @description 测试失败的推送通知
   */
  static testFailedPushNotif(): void {
    console.log('\n=== 测试失败的推送通知 ===');

    // 1. 创建推送通知聚合根
    const aggregate = new PushNotifAggregate();

    // 2. 创建推送通知
    const apnsToken = new PushToken(
      '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      PushPlatform.APNS,
    );
    const content = new PushContent(
      '系统通知',
      '系统将在今晚进行维护，请提前保存工作',
      'https://example.com/icon.png',
    );

    aggregate.createPushNotif(
      'push-789',
      'tenant-123',
      'user-456',
      apnsToken,
      content,
      PushPriorityLevel.CRITICAL,
    );

    // 3. 发送推送通知
    aggregate.sendPushNotif();

    // 4. 标记为失败
    aggregate.markAsFailed('网络超时');

    // 5. 重试推送通知
    aggregate.retryPushNotif();

    // 6. 再次标记为失败
    aggregate.markAsFailed('推送令牌无效');

    // 7. 标记为永久失败
    aggregate.markAsPermanentlyFailed('推送令牌无效');

    // 8. 获取事件
    const events = aggregate.getUncommittedEvents();
    console.log('事件数量:', events.length);
    console.log(
      '事件类型:',
      events.map(e => e.getEventType()),
    );

    // 9. 获取推送通知状态
    const pushNotif = aggregate.getPushNotif();
    console.log('最终状态:', pushNotif.getStatus().getValue());
    console.log('失败原因:', pushNotif.getFailureReason());
    console.log('重试次数:', pushNotif.getRetryCount());
  }

  /**
   * @method testScheduledPushNotif
   * @description 测试调度的推送通知
   */
  static testScheduledPushNotif(): void {
    console.log('\n=== 测试调度的推送通知 ===');

    // 1. 创建推送通知聚合根
    const aggregate = new PushNotifAggregate();

    // 2. 创建推送通知
    const huaweiToken = new PushToken(
      'huawei_token_example_12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
      PushPlatform.HUAWEI,
    );
    const content = new PushContent(
      '定时提醒',
      '您设置的提醒时间到了，请查看相关事项',
      'https://example.com/icon.png',
    );

    aggregate.createPushNotif(
      'push-999',
      'tenant-555',
      'user-777',
      huaweiToken,
      content,
      PushPriorityLevel.NORMAL,
    );

    // 3. 调度推送通知
    const scheduledAt = new Date(Date.now() + 3600000); // 1小时后
    aggregate.schedulePushNotif(scheduledAt);

    // 4. 获取事件
    const events = aggregate.getUncommittedEvents();
    console.log('事件数量:', events.length);
    console.log(
      '事件类型:',
      events.map(e => e.getEventType()),
    );

    // 5. 获取推送通知状态
    const pushNotif = aggregate.getPushNotif();
    console.log('最终状态:', pushNotif.getStatus().getValue());
    console.log('计划发送时间:', pushNotif.getScheduledAt());
    console.log('是否应该立即发送:', pushNotif.shouldSendNow());
  }

  /**
   * @method testPushNotifService
   * @description 测试推送通知领域服务
   */
  static async testPushNotifService(): Promise<void> {
    console.log('\n=== 测试推送通知领域服务 ===');

    const service = new PushNotifService();

    // 1. 测试推送通知发送权限
    const fcmToken = new PushToken(
      'fcm_token_example_12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
      PushPlatform.FCM,
    );
    const content = new PushContent(
      '测试通知',
      '这是一个测试推送通知',
      'https://example.com/icon.png',
    );

    const canSend = await service.canSendPushNotif(
      'user-123',
      fcmToken,
      content,
      PushPriorityLevel.NORMAL,
    );
    console.log('是否可以发送:', canSend);

    // 2. 测试优先级计算
    const optimalPriority = service.calculateOptimalPriority(
      content,
      { preferLowPriority: false },
      { isWorkingHours: true },
    );
    console.log('最优优先级:', optimalPriority);

    // 3. 测试批量验证
    const pushNotifs = [
      // 这里需要创建实际的推送通知实体
      // 由于需要复杂的构造函数，这里只是示例
    ];

    const validationResult = await service.validatePushNotifBatch(pushNotifs);
    console.log('批量验证结果:', validationResult);

    // 4. 测试指标计算
    const metrics = service.calculatePushNotifMetrics(pushNotifs);
    console.log('推送通知指标:', metrics);
  }

  /**
   * @method testPushContentPlatformSpecific
   * @description 测试推送内容的平台特定格式
   */
  static testPushContentPlatformSpecific(): void {
    console.log('\n=== 测试推送内容的平台特定格式 ===');

    const content = new PushContent(
      '平台测试',
      '测试不同平台的推送内容格式',
      'https://example.com/icon.png',
      'https://example.com/image.jpg',
      'open_app',
      { testData: 'value' },
    );

    // 测试不同平台的格式
    const platforms = ['FCM', 'APNS', 'HUAWEI', 'XIAOMI'];
    platforms.forEach(platform => {
      const platformContent = content.getPlatformContent(platform);
      console.log(
        `${platform} 格式:`,
        JSON.stringify(platformContent, null, 2),
      );
    });
  }

  /**
   * @method testPushTokenValidation
   * @description 测试推送令牌验证
   */
  static testPushTokenValidation(): void {
    console.log('\n=== 测试推送令牌验证 ===');

    try {
      // 测试有效的FCM令牌
      const validFcmToken = new PushToken(
        'fcm_token_example_12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        PushPlatform.FCM,
      );
      console.log('有效FCM令牌:', validFcmToken.toString());

      // 测试有效的APNs令牌
      const validApnsToken = new PushToken(
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        PushPlatform.APNS,
      );
      console.log('有效APNs令牌:', validApnsToken.toString());

      // 测试脱敏显示
      console.log('脱敏FCM令牌:', validFcmToken.toMaskedString());
      console.log('脱敏APNs令牌:', validApnsToken.toMaskedString());
    } catch (error) {
      console.error('令牌验证错误:', error);
    }

    try {
      // 测试无效的FCM令牌（长度不足）
      const invalidFcmToken = new PushToken('short', PushPlatform.FCM);
    } catch (error) {
      console.log('预期的FCM令牌验证错误:', error.message);
    }

    try {
      // 测试无效的APNs令牌（长度不正确）
      const invalidApnsToken = new PushToken(
        'invalid_apns_token',
        PushPlatform.APNS,
      );
    } catch (error) {
      console.log('预期的APNs令牌验证错误:', error.message);
    }
  }

  /**
   * @method runAllTests
   * @description 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    console.log('开始推送通知子领域测试...\n');

    try {
      this.testCreatePushNotif();
      this.testSendPushNotif();
      this.testFailedPushNotif();
      this.testScheduledPushNotif();
      await this.testPushNotifService();
      this.testPushContentPlatformSpecific();
      this.testPushTokenValidation();

      console.log('\n所有测试完成！');
    } catch (error) {
      console.error('测试过程中发生错误:', error);
    }
  }
}

// 如果直接运行此文件，则执行所有测试
if (require.main === module) {
  PushNotifTestExample.runAllTests().catch(console.error);
}
