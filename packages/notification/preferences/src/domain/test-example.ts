import {
  NotifPreferences,
  NotifPreferencesService,
  ChannelPreference,
  TimePreference,
  ContentPreference,
  FrequencyPreference,
} from './index';

/**
 * 用户通知偏好测试示例
 * 演示如何使用用户通知偏好领域模型
 */

// 创建渠道偏好
const emailPreference = new ChannelPreference(
  'email',
  true,
  10,
  ['system', 'user', 'marketing'],
  { templateId: 'welcome-email' },
);

const smsPreference = new ChannelPreference(
  'sms',
  false,
  5,
  ['system', 'security'],
  { provider: 'twilio' },
);

const pushPreference = new ChannelPreference(
  'push',
  true,
  8,
  ['system', 'user'],
  { platform: 'ios' },
);

// 创建时间偏好
const workHoursPreference = new TimePreference(
  'work_hours',
  '09:00',
  '18:00',
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  { timezone: 'Asia/Shanghai' },
);

const weekendPreference = new TimePreference(
  'weekend',
  '10:00',
  '22:00',
  ['saturday', 'sunday'],
  { timezone: 'Asia/Shanghai' },
);

// 创建内容偏好
const systemContentPreference = new ContentPreference(
  'system',
  ['system', 'security'],
  ['urgent', 'important'],
  { maxLength: 200 },
);

const userContentPreference = new ContentPreference(
  'user',
  ['user', 'marketing'],
  ['normal', 'low'],
  { maxLength: 500 },
);

// 创建频率偏好
const systemFrequencyPreference = new FrequencyPreference(
  'system',
  10, // 每小时最多10条
  'hour',
  ['system', 'security'],
  { burstLimit: 5 },
);

const marketingFrequencyPreference = new FrequencyPreference(
  'marketing',
  3, // 每天最多3条
  'day',
  ['marketing'],
  { burstLimit: 1 },
);

// 创建用户偏好聚合根
const preferences = NotifPreferences.create(
  'user-123',
  'tenant-456',
  [emailPreference, smsPreference, pushPreference],
  [workHoursPreference, weekendPreference],
  [systemContentPreference, userContentPreference],
  [systemFrequencyPreference, marketingFrequencyPreference],
  'admin-789',
);

console.log('用户偏好创建成功:', preferences.getSummary());

// 测试偏好更新
preferences.updateChannelPreferences([
  emailPreference,
  new ChannelPreference('sms', true, 7, ['system'], { provider: 'twilio' }),
  pushPreference,
]);

console.log('渠道偏好更新成功');

// 测试偏好查询
const emailEnabled = preferences.isChannelEnabled('email');
const smsEnabled = preferences.isChannelEnabled('sms');
const pushEnabled = preferences.isChannelEnabled('push');

console.log('渠道启用状态:', {
  email: emailEnabled,
  sms: smsEnabled,
  push: pushEnabled,
});

// 测试时间检查
const now = new Date();
const isTimeAllowed = preferences.isTimeAllowed(now);
console.log('当前时间是否允许发送:', isTimeAllowed);

// 测试偏好服务
const service = new NotifPreferencesService();

// 检查是否可以接收通知
const canReceive = service.canReceiveNotification(
  'user-123',
  'tenant-456',
  'email',
  'system',
  new Date(),
  preferences.getChannelPreferences(),
  preferences.getTimePreferences(),
  preferences.getContentPreferences(),
  preferences.getFrequencyPreferences(),
);

console.log('是否可以接收系统邮件通知:', canReceive);

// 获取推荐渠道
const recommendedChannels = service.getRecommendedChannels(
  preferences.getChannelPreferences(),
  'system',
);

console.log('系统通知推荐渠道:', recommendedChannels);

// 计算偏好优先级
const priority = service.calculatePreferencePriority(
  preferences.getChannelPreferences(),
  preferences.getTimePreferences(),
  preferences.getContentPreferences(),
  preferences.getFrequencyPreferences(),
);

console.log('偏好优先级分数:', priority);

// 验证偏好一致性
const isConsistent = service.validatePreferenceConsistency(
  preferences.getChannelPreferences(),
  preferences.getTimePreferences(),
  preferences.getContentPreferences(),
  preferences.getFrequencyPreferences(),
);

console.log('偏好配置是否一致:', isConsistent);

// 测试偏好合并
const mergedPreferences = service.mergePreferences(
  [preferences.getChannelPreferences()],
  [preferences.getTimePreferences()],
  [preferences.getContentPreferences()],
  [preferences.getFrequencyPreferences()],
);

console.log('合并后的偏好配置:', mergedPreferences);

// 测试偏好激活/停用
preferences.deactivate();
console.log('偏好已停用:', preferences.isActive());

preferences.activate();
console.log('偏好已激活:', preferences.isActive());

// 测试获取特定偏好
const emailPref = preferences.getChannelPreference('email');
console.log('邮件渠道偏好:', emailPref?.getSummary());

const workTimePref = preferences.getTimePreference('work_hours');
console.log('工作时间偏好:', workTimePref?.getSummary());

const systemContentPref = preferences.getContentPreference('system');
console.log('系统内容偏好:', systemContentPref?.getSummary());

const systemFreqPref = preferences.getFrequencyPreference('system');
console.log('系统频率偏好:', systemFreqPref?.getSummary());

console.log('用户通知偏好测试完成');
