import {
  EmailNotif,
  EmailAddress,
  EmailStatus,
  EmailProvider,
  EmailContent,
  TemplateId,
  EmailNotifService,
  TenantId,
  UserId,
  NotifType,
  NotifPriority,
} from './index';

/**
 * 邮件通知领域层使用示例
 * 演示邮件通知的创建、状态管理和业务逻辑
 */
async function runEmailNotifExample() {
  console.log('=== 邮件通知领域层使用示例 ===');

  try {
    // 1. 创建值对象
    console.log('\n1. 创建值对象:');
    const tenantId = TenantId.create('tenant-uuid-123');
    const userId = UserId.create('user-uuid-456');
    const emailAddress = EmailAddress.create('user@example.com');
    const templateId = TemplateId.create('template-uuid-789');

    console.log('- TenantId:', tenantId.value);
    console.log('- UserId:', userId.value);
    console.log('- EmailAddress:', emailAddress.value);
    console.log('- TemplateId:', templateId.value);

    // 2. 创建邮件内容
    console.log('\n2. 创建邮件内容:');
    const emailContent = EmailContent.create(
      '系统维护通知',
      '<h1>系统维护通知</h1><p>系统将在今晚进行维护，预计持续2小时。</p>',
      '系统维护通知\n\n系统将在今晚进行维护，预计持续2小时。',
    );

    console.log('- 主题:', emailContent.subject);
    console.log('- HTML内容长度:', emailContent.getHtmlContentLength());
    console.log('- 纯文本内容长度:', emailContent.getTextContentLength());
    console.log('- 是否为多部分内容:', emailContent.isMultipart());

    // 3. 创建邮件通知
    console.log('\n3. 创建邮件通知:');
    const emailNotif = EmailNotif.create(
      tenantId,
      userId,
      emailAddress,
      emailContent,
      templateId,
      EmailProvider.SENDGRID,
      NotifPriority.HIGH,
      { source: 'system', maintenanceTime: '2024-01-01 02:00:00' },
      'system',
    );

    console.log('- 通知ID:', emailNotif.id.value);
    console.log('- 收件人邮箱:', emailNotif.recipientEmail.value);
    console.log('- 服务提供商:', emailNotif.provider);
    console.log('- 当前状态:', emailNotif.getStatus());
    console.log('- 是否待发送:', emailNotif.isPending());

    // 4. 状态管理
    console.log('\n4. 状态管理:');
    console.log('标记为发送中...');
    emailNotif.markAsSending();
    console.log('- 新状态:', emailNotif.getStatus());
    console.log('- 是否发送中:', emailNotif.isSending());

    console.log('标记为已发送...');
    emailNotif.markAsSent();
    console.log('- 新状态:', emailNotif.getStatus());
    console.log('- 是否已发送:', emailNotif.isSent());
    console.log('- 发送时间:', emailNotif.getSentAt());

    // 5. 使用领域服务
    console.log('\n5. 使用领域服务:');
    const emailService = new EmailNotifService();

    // 检查是否可以发送邮件
    const canSend = emailService.canSendEmail(
      userId,
      tenantId,
      NotifType.SYSTEM,
    );
    console.log('- 是否可以发送系统邮件:', canSend);

    // 计算优先级
    const priority = emailService.calculatePriority(
      NotifType.ALERT,
      true, // 紧急
      { isImportant: true },
    );
    console.log('- 计算的优先级:', priority);

    // 验证邮件内容
    const isValid = emailService.validateEmailContent(
      emailContent,
      NotifType.SYSTEM,
    );
    console.log('- 内容是否有效:', isValid);

    // 选择邮件服务提供商
    const selectedProvider = emailService.selectEmailProvider(
      tenantId,
      NotifPriority.URGENT,
      NotifType.ALERT,
    );
    console.log('- 选择的服务提供商:', selectedProvider);

    // 计算重试延迟
    const retryDelay = emailService.calculateRetryDelay(
      2,
      EmailProvider.SENDGRID,
    );
    console.log('- 重试延迟(毫秒):', retryDelay);

    // 判断错误是否可重试
    const isRetryable = emailService.isRetryableError(
      'Connection timeout',
      EmailProvider.SENDGRID,
    );
    console.log('- 连接超时是否可重试:', isRetryable);

    // 6. 错误处理示例
    console.log('\n6. 错误处理示例:');
    try {
      // 尝试创建无效的邮箱地址
      EmailAddress.create('invalid-email');
    } catch (error) {
      console.log('捕获到错误:', error.message);
    }

    try {
      // 尝试创建无效的邮件内容
      EmailContent.create('', '', '');
    } catch (error) {
      console.log('捕获到错误:', error.message);
    }

    // 7. 事件处理示例
    console.log('\n7. 事件处理示例:');
    const events = emailNotif.getUncommittedEvents();
    console.log('- 未提交的事件数量:', events.length);

    events.forEach((event, index) => {
      console.log(`- 事件 ${index + 1}:`, event.getEventType());
    });

    console.log('\n=== 邮件通知领域层使用示例完成 ===');
  } catch (error) {
    console.error('示例执行出错:', error);
  }
}

// 运行示例
if (require.main === module) {
  runEmailNotifExample().catch(console.error);
}

export { runEmailNotifExample };
