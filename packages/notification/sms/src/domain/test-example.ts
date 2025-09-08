import { PhoneNumber, PhoneRegion } from './value-objects/phone-number.vo';
import { SmsStatus, SmsStatusType } from './value-objects/sms-status.vo';
import { SmsContent, SmsEncoding } from './value-objects/sms-content.vo';
import { SmsProvider, SmsProviderType } from './value-objects/sms-provider.vo';
import { SmsNotifEntity } from './entities/sms-notif.entity';
import { SmsNotif } from './aggregates/sms-notif.aggregate';
import { SmsNotifService } from './services/sms-notif.service';

/**
 * 短信通知子领域测试示例
 *
 * 演示短信通知子领域的核心功能和业务逻辑
 */
export class SmsNotifTestExample {
  /**
   * 运行所有测试示例
   */
  public static async runAllTests(): Promise<void> {
    console.log('=== 短信通知子领域测试示例 ===\n');

    await this.testPhoneNumber();
    await this.testSmsStatus();
    await this.testSmsContent();
    await this.testSmsProvider();
    await this.testSmsNotifEntity();
    await this.testSmsNotifAggregate();
    await this.testSmsNotifService();

    console.log('\n=== 所有测试示例完成 ===');
  }

  /**
   * 测试手机号值对象
   */
  private static async testPhoneNumber(): Promise<void> {
    console.log('1. 测试手机号值对象');
    console.log('==================');

    try {
      // 测试中国大陆手机号
      const chinaPhone = PhoneNumber.create('13800138000', '+86');
      console.log('中国大陆手机号:');
      console.log('  号码:', chinaPhone.getNumber());
      console.log('  国家代码:', chinaPhone.getCountryCode());
      console.log('  地区:', chinaPhone.getRegion());
      console.log('  国际格式:', chinaPhone.getInternationalFormat());
      console.log('  是否有效:', chinaPhone.isValid());
      console.log('  是否支持短信:', chinaPhone.canReceiveSms());

      // 测试香港手机号
      const hkPhone = PhoneNumber.create('91234567', '+852');
      console.log('\n香港手机号:');
      console.log('  号码:', hkPhone.getNumber());
      console.log('  国家代码:', hkPhone.getCountryCode());
      console.log('  地区:', hkPhone.getRegion());
      console.log('  国际格式:', hkPhone.getInternationalFormat());

      // 测试美国手机号
      const usPhone = PhoneNumber.create('5551234567', '+1');
      console.log('\n美国手机号:');
      console.log('  号码:', usPhone.getNumber());
      console.log('  国家代码:', usPhone.getCountryCode());
      console.log('  地区:', usPhone.getRegion());
      console.log('  国际格式:', usPhone.getInternationalFormat());
    } catch (error) {
      console.error('手机号测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信状态值对象
   */
  private static async testSmsStatus(): Promise<void> {
    console.log('2. 测试短信状态值对象');
    console.log('==================');

    try {
      // 创建初始状态
      const status = SmsStatus.create(SmsStatusType.PENDING);
      console.log('初始状态:');
      console.log('  状态:', status.getStatus());
      console.log('  描述:', status.getStatusDescription());
      console.log('  优先级:', status.getStatusPriority());
      console.log('  是否最终状态:', status.isFinalStatus());
      console.log('  是否失败状态:', status.isFailedStatus());
      console.log('  是否成功状态:', status.isSuccessStatus());

      // 状态转换
      const sendingStatus = status.transitionTo(SmsStatusType.SENDING);
      console.log('\n转换到发送中:');
      console.log('  状态:', sendingStatus.getStatus());
      console.log('  描述:', sendingStatus.getStatusDescription());

      const sentStatus = sendingStatus.transitionTo(SmsStatusType.SENT);
      console.log('\n转换到已发送:');
      console.log('  状态:', sentStatus.getStatus());
      console.log('  描述:', sentStatus.getStatusDescription());

      const deliveredStatus = sentStatus.transitionTo(SmsStatusType.DELIVERED);
      console.log('\n转换到已送达:');
      console.log('  状态:', deliveredStatus.getStatus());
      console.log('  描述:', deliveredStatus.getStatusDescription());
    } catch (error) {
      console.error('短信状态测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信内容值对象
   */
  private static async testSmsContent(): Promise<void> {
    console.log('3. 测试短信内容值对象');
    console.log('==================');

    try {
      // 创建普通短信内容
      const content = SmsContent.create(
        '您的验证码是123456，请在5分钟内使用。',
        '【公司名称】',
      );
      console.log('普通短信内容:');
      console.log('  文本:', content.getText());
      console.log('  签名:', content.getSignature());
      console.log('  编码:', content.getEncoding());
      console.log('  语言:', content.getLanguage());
      console.log('  是否模板:', content.isTemplate());
      console.log('  完整内容:', content.getFullContent());
      console.log('  长度:', content.getLength());
      console.log('  段数:', content.getSegmentCount());
      console.log('  是否超过单条限制:', content.exceedsSingleSmsLimit());
      console.log('  是否超过最大长度:', content.exceedsMaxLength());

      // 创建模板短信内容
      const templateContent = SmsContent.createFromTemplate(
        'VERIFY_CODE',
        { code: '123456', minutes: '5' },
        '【公司名称】',
      );
      console.log('\n模板短信内容:');
      console.log('  模板ID:', templateContent.getTemplateId());
      console.log('  模板参数:', templateContent.getTemplateParams());
      console.log('  是否模板:', templateContent.isTemplate());
      console.log('  完整内容:', templateContent.getFullContent());
    } catch (error) {
      console.error('短信内容测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信提供商值对象
   */
  private static async testSmsProvider(): Promise<void> {
    console.log('4. 测试短信提供商值对象');
    console.log('==================');

    try {
      // 创建阿里云短信提供商
      const aliyunProvider = SmsProvider.create(
        SmsProviderType.ALIYUN,
        '阿里云短信',
        ['CHINA_MAINLAND', 'HONG_KONG', 'TAIWAN'],
        [SmsEncoding.UTF8, SmsEncoding.GSM],
        1,
        true,
        { apiKey: 'test-key', apiSecret: 'test-secret' },
      );
      console.log('阿里云短信提供商:');
      console.log('  类型:', aliyunProvider.getProviderType());
      console.log('  名称:', aliyunProvider.getProviderName());
      console.log('  支持地区:', aliyunProvider.getSupportedRegions());
      console.log('  支持编码:', aliyunProvider.getSupportedEncodings());
      console.log('  优先级:', aliyunProvider.getPriority());
      console.log('  是否可用:', aliyunProvider.isAvailable());
      console.log('  描述:', aliyunProvider.getDescription());

      // 测试地区支持
      console.log('\n地区支持测试:');
      console.log(
        '  支持中国大陆:',
        aliyunProvider.supportsRegion('CHINA_MAINLAND'),
      );
      console.log('  支持美国:', aliyunProvider.supportsRegion('USA'));

      // 测试编码支持
      console.log('\n编码支持测试:');
      console.log(
        '  支持UTF-8:',
        aliyunProvider.supportsEncoding(SmsEncoding.UTF8),
      );
      console.log(
        '  支持GSM:',
        aliyunProvider.supportsEncoding(SmsEncoding.GSM),
      );
    } catch (error) {
      console.error('短信提供商测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信通知实体
   */
  private static async testSmsNotifEntity(): Promise<void> {
    console.log('5. 测试短信通知实体');
    console.log('==================');

    try {
      // 创建组件
      const phoneNumber = PhoneNumber.create('13800138000', '+86');
      const content = SmsContent.create(
        '您的验证码是123456，请在5分钟内使用。',
        '【公司名称】',
      );
      const provider = SmsProvider.create(
        SmsProviderType.ALIYUN,
        '阿里云短信',
        ['CHINA_MAINLAND'],
        [SmsEncoding.UTF8],
        1,
        true,
        { apiKey: 'test-key', apiSecret: 'test-secret' },
      );
      const status = SmsStatus.create(SmsStatusType.PENDING);

      // 创建短信通知实体
      const smsNotif = new SmsNotifEntity(
        'sms-123',
        'tenant-456',
        'user-789',
        phoneNumber,
        content,
        provider,
        status,
      );

      console.log('短信通知实体:');
      console.log('  ID:', smsNotif.id);
      console.log('  租户ID:', smsNotif.tenantId);
      console.log('  用户ID:', smsNotif.userId);
      console.log(
        '  手机号:',
        smsNotif.getPhoneNumber().getInternationalFormat(),
      );
      console.log('  内容:', smsNotif.getContent().getSummary(30));
      console.log('  提供商:', smsNotif.getProvider().getProviderName());
      console.log('  状态:', smsNotif.getStatus().getStatus());
      console.log('  重试次数:', smsNotif.getRetryCount());
      console.log('  最大重试次数:', smsNotif.getMaxRetries());
      console.log('  是否可以发送:', smsNotif.canSend());
      console.log('  是否可以重试:', smsNotif.canRetry());
      console.log('  是否已过期:', smsNotif.isExpired());

      // 测试状态转换
      console.log('\n状态转换测试:');
      smsNotif.markAsSending();
      console.log('  标记为发送中:', smsNotif.getStatus().getStatus());

      smsNotif.markAsSent();
      console.log('  标记为已发送:', smsNotif.getStatus().getStatus());
      console.log('  发送时间:', smsNotif.getSentAt());

      smsNotif.markAsDelivered();
      console.log('  标记为已送达:', smsNotif.getStatus().getStatus());
      console.log('  送达时间:', smsNotif.getDeliveredAt());
    } catch (error) {
      console.error('短信通知实体测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信通知聚合根
   */
  private static async testSmsNotifAggregate(): Promise<void> {
    console.log('6. 测试短信通知聚合根');
    console.log('==================');

    try {
      // 创建组件
      const phoneNumber = PhoneNumber.create('13800138000', '+86');
      const content = SmsContent.create(
        '您的验证码是123456，请在5分钟内使用。',
        '【公司名称】',
      );
      const provider = SmsProvider.create(
        SmsProviderType.ALIYUN,
        '阿里云短信',
        ['CHINA_MAINLAND'],
        [SmsEncoding.UTF8],
        1,
        true,
        { apiKey: 'test-key', apiSecret: 'test-secret' },
      );

      // 创建短信通知聚合根
      const smsNotif = SmsNotif.create(
        'sms-123',
        'tenant-456',
        'user-789',
        phoneNumber,
        content,
        provider,
        'system',
      );

      console.log('短信通知聚合根:');
      console.log('  ID:', smsNotif.getId());
      console.log('  租户ID:', smsNotif.getTenantId());
      console.log('  用户ID:', smsNotif.getUserId());
      console.log(
        '  手机号:',
        smsNotif.getPhoneNumber().getInternationalFormat(),
      );
      console.log('  内容:', smsNotif.getContent().getSummary(30));
      console.log('  提供商:', smsNotif.getProvider().getProviderName());
      console.log('  状态:', smsNotif.getStatus().getStatus());
      console.log('  重试次数:', smsNotif.getRetryCount());
      console.log('  最大重试次数:', smsNotif.getMaxRetries());
      console.log('  是否可以发送:', smsNotif.canSend());
      console.log('  是否可以重试:', smsNotif.canRetry());
      console.log('  是否已过期:', smsNotif.isExpired());

      // 测试事件发布
      const events = smsNotif.getUncommittedEvents();
      console.log('\n事件发布测试:');
      console.log('  事件数量:', events.length);
      console.log(
        '  事件类型:',
        events.map(e => e.getEventType()),
      );

      // 测试业务操作
      console.log('\n业务操作测试:');
      smsNotif.startSending();
      console.log('  开始发送:', smsNotif.getStatus().getStatus());

      smsNotif.markAsSent();
      console.log('  标记为已发送:', smsNotif.getStatus().getStatus());
      console.log('  发送时间:', smsNotif.getSentAt());

      smsNotif.markAsDelivered();
      console.log('  标记为已送达:', smsNotif.getStatus().getStatus());
      console.log('  送达时间:', smsNotif.getDeliveredAt());

      // 获取最终事件
      const finalEvents = smsNotif.getUncommittedEvents();
      console.log('\n最终事件:');
      console.log('  事件数量:', finalEvents.length);
      console.log(
        '  事件类型:',
        finalEvents.map(e => e.getEventType()),
      );
    } catch (error) {
      console.error('短信通知聚合根测试失败:', error);
    }

    console.log('\n');
  }

  /**
   * 测试短信通知领域服务
   */
  private static async testSmsNotifService(): Promise<void> {
    console.log('7. 测试短信通知领域服务');
    console.log('==================');

    try {
      const service = new SmsNotifService();

      // 创建测试数据
      const phoneNumber = PhoneNumber.create('13800138000', '+86');
      const content = SmsContent.create(
        '您的验证码是123456，请在5分钟内使用。',
        '【公司名称】',
      );

      const providers = [
        SmsProvider.create(
          SmsProviderType.ALIYUN,
          '阿里云短信',
          ['CHINA_MAINLAND'],
          [SmsEncoding.UTF8],
          1,
          true,
          { apiKey: 'test-key', apiSecret: 'test-secret' },
        ),
        SmsProvider.create(
          SmsProviderType.TENCENT,
          '腾讯云短信',
          ['CHINA_MAINLAND'],
          [SmsEncoding.UTF8],
          2,
          true,
          { secretId: 'test-id', secretKey: 'test-key' },
        ),
      ];

      // 测试提供商选择
      console.log('提供商选择测试:');
      const bestProvider = service.selectBestProvider(
        phoneNumber,
        content,
        providers,
      );
      console.log('  最佳提供商:', bestProvider?.getProviderName());

      // 测试成本计算
      console.log('\n成本计算测试:');
      const cost = service.calculateSendingCost(
        content,
        bestProvider!,
        phoneNumber,
      );
      console.log('  发送成本:', cost, '分');

      // 测试延迟计算
      console.log('\n延迟计算测试:');
      const delay = service.calculateSendingDelay(
        bestProvider!,
        phoneNumber,
        content,
      );
      console.log('  预计延迟:', delay, '毫秒');

      // 测试业务规则验证
      console.log('\n业务规则验证测试:');
      const smsNotif = new SmsNotifEntity(
        'sms-123',
        'tenant-456',
        'user-789',
        phoneNumber,
        content,
        bestProvider!,
        SmsStatus.create(SmsStatusType.PENDING),
      );

      const validationErrors = service.validateSendingRules(smsNotif);
      console.log(
        '  验证错误:',
        validationErrors.length === 0 ? '无' : validationErrors,
      );

      // 测试指标计算
      console.log('\n指标计算测试:');
      const metrics = service.calculateSmsNotifMetrics([smsNotif]);
      console.log('  总数量:', metrics.total);
      console.log('  成功率:', metrics.successRate.toFixed(2), '%');
      console.log('  平均重试次数:', metrics.averageRetryCount.toFixed(2));
      console.log('  总成本:', metrics.totalCost, '分');
    } catch (error) {
      console.error('短信通知领域服务测试失败:', error);
    }

    console.log('\n');
  }
}

// 运行测试示例
if (require.main === module) {
  SmsNotifTestExample.runAllTests().catch(console.error);
}
