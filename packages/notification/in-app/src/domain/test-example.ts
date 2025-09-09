/**
 * @file test-example.ts
 * @description
 * 站内通知领域层使用示例，展示如何使用领域层的各个组件。
 *
 * 这个文件仅用于演示领域层的使用方式，不是正式的测试文件。
 * 在实际项目中，应该使用Jest等测试框架编写正式的单元测试。
 *
 * @since 1.0.0
 */

import {
  InAppNotif,
  NotifId,
  TenantId,
  UserId,
  NotifType,
  NotifPriority,
  NotifCenter,
} from './index';

/**
 * @function demonstrateInAppNotifUsage
 * @description 演示站内通知领域层的使用方式
 */
export function demonstrateInAppNotifUsage(): void {
  console.log('=== 站内通知领域层使用示例 ===');

  // 1. 创建值对象
  const notifId = NotifId.generate();
  const tenantId = TenantId.generate('tenant', 'test-tenant');
  const userId = UserId.generate();

  console.log('创建的值对象:');
  console.log('- NotifId:', notifId.value);
  console.log('- TenantId:', tenantId.value);
  console.log('- UserId:', userId.value);

  // 2. 创建站内通知聚合根
  const notif = InAppNotif.create(
    notifId,
    tenantId,
    userId,
    NotifType.SYSTEM,
    '系统维护通知',
    '系统将在今晚进行维护，预计持续2小时。',
    NotifPriority.HIGH,
    {
      maintenanceTime: '2024-01-01 02:00:00',
      duration: '2小时',
    },
  );

  console.log('\n创建的站内通知:');
  console.log('- ID:', notif.id.value);
  console.log('- 标题:', notif.title);
  console.log('- 内容:', notif.content);
  console.log('- 类型:', notif.type);
  console.log('- 优先级:', notif.priority);
  console.log('- 状态:', notif.getStatus());
  console.log('- 是否未读:', notif.isUnread());
  console.log('- 是否可读:', notif.canBeRead());
  console.log('- 是否可归档:', notif.canBeArchived());

  // 3. 标记为已读
  console.log('\n标记为已读...');
  notif.markAsRead();
  console.log('- 新状态:', notif.getStatus());
  console.log('- 是否已读:', notif.isRead());
  console.log('- 阅读时间:', notif.getReadAt());

  // 4. 归档通知
  console.log('\n归档通知...');
  notif.archive();
  console.log('- 新状态:', notif.getStatus());
  console.log('- 是否已归档:', notif.isArchived());
  console.log('- 归档时间:', notif.getArchivedAt());

  // 5. 使用领域服务
  console.log('\n使用领域服务:');
  const notifCenter = new NotifCenter();

  // 检查是否可以发送通知
  const canSend = notifCenter.canSendNotif(userId, tenantId, NotifType.SYSTEM);
  console.log('- 是否可以发送系统通知:', canSend);

  // 计算优先级
  const calculatedPriority = notifCenter.calculatePriority(
    NotifType.ALERT,
    true, // 紧急
    { isImportant: true },
  );
  console.log('- 计算的优先级:', calculatedPriority);

  // 验证通知内容
  const isValidContent = notifCenter.validateNotifContent(
    '警告通知',
    '这是一个重要的警告信息',
    NotifType.ALERT,
  );
  console.log('- 内容是否有效:', isValidContent);

  // 检查是否应该通知用户
  const shouldNotify = notifCenter.shouldNotifyUser(
    userId,
    NotifType.SYSTEM,
    NotifPriority.CRITICAL,
  );
  console.log('- 是否应该通知用户:', shouldNotify);

  console.log('\n=== 示例完成 ===');
}

/**
 * @function demonstrateValueObjectValidation
 * @description 演示值对象的验证功能
 */
export function demonstrateValueObjectValidation(): void {
  console.log('\n=== 值对象验证示例 ===');

  try {
    // 创建有效的值对象
    const validNotifId = new NotifId('123e4567-e89b-12d3-a456-426614174000');
    console.log('有效的NotifId:', validNotifId.value);

    // 尝试创建无效的值对象
    const invalidNotifId = new NotifId('invalid-id');
    console.log('无效的NotifId:', invalidNotifId.value);
  } catch (error) {
    console.log('捕获到错误:', (error as Error).message);
  }

  console.log('=== 验证示例完成 ===');
}

// 如果直接运行此文件，则执行示例
// 运行测试
demonstrateInAppNotifUsage();
demonstrateValueObjectValidation();
