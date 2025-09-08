import { ChannelPreference } from '../value-objects/channel-preference.vo';
import { TimePreference } from '../value-objects/time-preference.vo';
import { ContentPreference } from '../value-objects/content-preference.vo';
import { FrequencyPreference } from '../value-objects/frequency-preference.vo';

/**
 * 用户通知偏好领域服务
 * 负责处理跨聚合的用户偏好业务逻辑和无状态操作
 *
 * 跨聚合业务逻辑：
 * 1. 协调用户偏好和通知发送之间的业务规则
 * 2. 处理用户偏好和通知渠道的关联关系
 * 3. 管理用户偏好的复杂计算逻辑
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的偏好计算逻辑
 * 2. 提供可重用的偏好验证规则
 * 3. 隔离跨聚合的复杂业务逻辑
 */
export class NotifPreferencesService {
  /**
   * 检查用户是否允许接收指定类型的通知
   *
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} channelType 渠道类型
   * @param {string} notificationType 通知类型
   * @param {Date} sendTime 发送时间
   * @param {ChannelPreference[]} channelPreferences 渠道偏好列表
   * @param {TimePreference[]} timePreferences 时间偏好列表
   * @param {ContentPreference[]} contentPreferences 内容偏好列表
   * @param {FrequencyPreference[]} frequencyPreferences 频率偏好列表
   * @returns {boolean} 是否允许接收
   *
   * 业务逻辑：
   * 1. 检查渠道是否启用
   * 2. 验证时间是否在允许范围内
   * 3. 检查内容类型是否被允许
   * 4. 考虑频率限制
   */
  canReceiveNotification(
    userId: string,
    tenantId: string,
    channelType: string,
    notificationType: string,
    sendTime: Date,
    channelPreferences: ChannelPreference[],
    timePreferences: TimePreference[],
    contentPreferences: ContentPreference[],
    frequencyPreferences: FrequencyPreference[],
  ): boolean {
    // 1. 检查渠道是否启用
    const channelPreference = channelPreferences.find(
      p => p.channelType === channelType,
    );
    if (!channelPreference || !channelPreference.enabled) {
      return false;
    }

    // 2. 验证时间是否在允许范围内
    if (!this.isTimeAllowed(sendTime, timePreferences)) {
      return false;
    }

    // 3. 检查内容类型是否被允许
    if (!this.isContentTypeAllowed(notificationType, contentPreferences)) {
      return false;
    }

    // 4. 考虑频率限制
    if (!this.isFrequencyAllowed(notificationType, frequencyPreferences)) {
      return false;
    }

    return true;
  }

  /**
   * 检查时间是否在允许范围内
   *
   * @param {Date} sendTime 发送时间
   * @param {TimePreference[]} timePreferences 时间偏好列表
   * @returns {boolean} 是否允许
   */
  private isTimeAllowed(
    sendTime: Date,
    timePreferences: TimePreference[],
  ): boolean {
    if (timePreferences.length === 0) {
      return true; // 没有时间限制
    }

    return timePreferences.some(preference =>
      preference.isTimeAllowed(sendTime),
    );
  }

  /**
   * 检查内容类型是否被允许
   *
   * @param {string} notificationType 通知类型
   * @param {ContentPreference[]} contentPreferences 内容偏好列表
   * @returns {boolean} 是否允许
   */
  private isContentTypeAllowed(
    notificationType: string,
    contentPreferences: ContentPreference[],
  ): boolean {
    if (contentPreferences.length === 0) {
      return true; // 没有内容限制
    }

    return contentPreferences.some(preference =>
      preference.isContentTypeAllowed(notificationType),
    );
  }

  /**
   * 检查频率是否允许
   *
   * @param {string} notificationType 通知类型
   * @param {FrequencyPreference[]} frequencyPreferences 频率偏好列表
   * @returns {boolean} 是否允许
   */
  private isFrequencyAllowed(
    notificationType: string,
    frequencyPreferences: FrequencyPreference[],
  ): boolean {
    if (frequencyPreferences.length === 0) {
      return true; // 没有频率限制
    }

    return frequencyPreferences.some(preference =>
      preference.isNotificationTypeAllowed(notificationType),
    );
  }

  /**
   * 计算用户偏好的优先级
   *
   * @param {ChannelPreference[]} channelPreferences 渠道偏好列表
   * @param {TimePreference[]} timePreferences 时间偏好列表
   * @param {ContentPreference[]} contentPreferences 内容偏好列表
   * @param {FrequencyPreference[]} frequencyPreferences 频率偏好列表
   * @returns {number} 优先级分数
   */
  calculatePreferencePriority(
    channelPreferences: ChannelPreference[],
    timePreferences: TimePreference[],
    contentPreferences: ContentPreference[],
    frequencyPreferences: FrequencyPreference[],
  ): number {
    let priority = 0;

    // 渠道偏好权重
    priority += channelPreferences.filter(p => p.enabled).length * 10;

    // 时间偏好权重
    priority += timePreferences.length * 5;

    // 内容偏好权重
    priority += contentPreferences.length * 3;

    // 频率偏好权重
    priority += frequencyPreferences.length * 2;

    return priority;
  }

  /**
   * 获取推荐的渠道列表
   *
   * @param {ChannelPreference[]} channelPreferences 渠道偏好列表
   * @param {string} notificationType 通知类型
   * @returns {string[]} 推荐的渠道类型列表
   */
  getRecommendedChannels(
    channelPreferences: ChannelPreference[],
    notificationType: string,
  ): string[] {
    return channelPreferences
      .filter(
        preference =>
          preference.enabled &&
          preference.isNotificationTypeAllowed(notificationType),
      )
      .sort((a, b) => b.priority - a.priority)
      .map(preference => preference.channelType);
  }

  /**
   * 验证偏好配置的一致性
   *
   * @param {ChannelPreference[]} channelPreferences 渠道偏好列表
   * @param {TimePreference[]} timePreferences 时间偏好列表
   * @param {ContentPreference[]} contentPreferences 内容偏好列表
   * @param {FrequencyPreference[]} frequencyPreferences 频率偏好列表
   * @returns {boolean} 是否一致
   */
  validatePreferenceConsistency(
    channelPreferences: ChannelPreference[],
    timePreferences: TimePreference[],
    contentPreferences: ContentPreference[],
    frequencyPreferences: FrequencyPreference[],
  ): boolean {
    // 检查渠道偏好是否有重复
    const channelTypes = new Set<string>();
    for (const preference of channelPreferences) {
      if (channelTypes.has(preference.channelType)) {
        return false;
      }
      channelTypes.add(preference.channelType);
    }

    // 检查时间偏好是否有冲突
    for (let i = 0; i < timePreferences.length; i++) {
      for (let j = i + 1; j < timePreferences.length; j++) {
        if (timePreferences[i].hasConflict(timePreferences[j])) {
          return false;
        }
      }
    }

    // 检查内容偏好是否有冲突
    for (let i = 0; i < contentPreferences.length; i++) {
      for (let j = i + 1; j < contentPreferences.length; j++) {
        if (contentPreferences[i].hasConflict(contentPreferences[j])) {
          return false;
        }
      }
    }

    // 检查频率偏好是否有冲突
    for (let i = 0; i < frequencyPreferences.length; i++) {
      for (let j = i + 1; j < frequencyPreferences.length; j++) {
        if (frequencyPreferences[i].hasConflict(frequencyPreferences[j])) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 合并多个偏好配置
   *
   * @param {ChannelPreference[][]} channelPreferencesList 渠道偏好列表数组
   * @param {TimePreference[][]} timePreferencesList 时间偏好列表数组
   * @param {ContentPreference[][]} contentPreferencesList 内容偏好列表数组
   * @param {FrequencyPreference[][]} frequencyPreferencesList 频率偏好列表数组
   * @returns {object} 合并后的偏好配置
   */
  mergePreferences(
    channelPreferencesList: ChannelPreference[][],
    timePreferencesList: TimePreference[][],
    contentPreferencesList: ContentPreference[][],
    frequencyPreferencesList: FrequencyPreference[][],
  ): {
    channelPreferences: ChannelPreference[];
    timePreferences: TimePreference[];
    contentPreferences: ContentPreference[];
    frequencyPreferences: FrequencyPreference[];
  } {
    // 合并渠道偏好（取优先级最高的）
    const channelMap = new Map<string, ChannelPreference>();
    for (const preferences of channelPreferencesList) {
      for (const preference of preferences) {
        const existing = channelMap.get(preference.channelType);
        if (!existing || preference.priority > existing.priority) {
          channelMap.set(preference.channelType, preference);
        }
      }
    }

    // 合并时间偏好（去重）
    const timeSet = new Set<string>();
    const timePreferences: TimePreference[] = [];
    for (const preferences of timePreferencesList) {
      for (const preference of preferences) {
        const key = `${preference.type}-${preference.startTime}-${preference.endTime}`;
        if (!timeSet.has(key)) {
          timeSet.add(key);
          timePreferences.push(preference);
        }
      }
    }

    // 合并内容偏好（去重）
    const contentSet = new Set<string>();
    const contentPreferences: ContentPreference[] = [];
    for (const preferences of contentPreferencesList) {
      for (const preference of preferences) {
        const key = `${preference.type}-${preference.allowedTypes.join(',')}`;
        if (!contentSet.has(key)) {
          contentSet.add(key);
          contentPreferences.push(preference);
        }
      }
    }

    // 合并频率偏好（取最严格的限制）
    const frequencyMap = new Map<string, FrequencyPreference>();
    for (const preferences of frequencyPreferencesList) {
      for (const preference of preferences) {
        const existing = frequencyMap.get(preference.type);
        if (!existing || preference.maxFrequency < existing.maxFrequency) {
          frequencyMap.set(preference.type, preference);
        }
      }
    }

    return {
      channelPreferences: Array.from(channelMap.values()),
      timePreferences,
      contentPreferences,
      frequencyPreferences: Array.from(frequencyMap.values()),
    };
  }
}
