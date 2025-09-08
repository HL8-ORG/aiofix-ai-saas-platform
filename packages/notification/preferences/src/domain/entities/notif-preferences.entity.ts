import { BaseEntity } from '@aiofix/core';
import { ChannelPreference } from '../value-objects/channel-preference.vo';
import { TimePreference } from '../value-objects/time-preference.vo';
import { ContentPreference } from '../value-objects/content-preference.vo';
import { FrequencyPreference } from '../value-objects/frequency-preference.vo';

/**
 * 用户通知偏好实体
 * 管理用户的通知偏好设置，包括渠道偏好、时间偏好、内容偏好等
 *
 * 业务规则：
 * 1. 用户ID和租户ID不能为空
 * 2. 渠道偏好必须有效
 * 3. 时间偏好必须符合业务规则
 * 4. 内容偏好必须合理
 * 5. 频率偏好必须在有效范围内
 */
export class NotifPreferencesEntity extends BaseEntity {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    private _channelPreferences: ChannelPreference[] = [],
    private _timePreferences: TimePreference[] = [],
    private _contentPreferences: ContentPreference[] = [],
    private _frequencyPreferences: FrequencyPreference[] = [],
    private _isActive: boolean = true,
    private _lastUpdatedAt: Date = new Date(),
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * 获取渠道偏好列表
   */
  get channelPreferences(): ChannelPreference[] {
    return [...this._channelPreferences];
  }

  /**
   * 获取时间偏好列表
   */
  get timePreferences(): TimePreference[] {
    return [...this._timePreferences];
  }

  /**
   * 获取内容偏好列表
   */
  get contentPreferences(): ContentPreference[] {
    return [...this._contentPreferences];
  }

  /**
   * 获取频率偏好列表
   */
  get frequencyPreferences(): FrequencyPreference[] {
    return [...this._frequencyPreferences];
  }

  /**
   * 是否激活
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * 最后更新时间
   */
  get lastUpdatedAt(): Date {
    return this._lastUpdatedAt;
  }

  /**
   * 验证实体状态
   */
  public validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new InvalidNotifPreferencesError('用户ID不能为空');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new InvalidNotifPreferencesError('租户ID不能为空');
    }

    // 验证渠道偏好
    this.validateChannelPreferences();
  }

  /**
   * 验证渠道偏好
   */
  private validateChannelPreferences(): void {
    const channelTypes = new Set<string>();

    for (const preference of this._channelPreferences) {
      if (channelTypes.has(preference.channelType)) {
        throw new InvalidNotifPreferencesError(
          `渠道类型 ${preference.channelType} 重复`,
        );
      }
      channelTypes.add(preference.channelType);
    }
  }

  /**
   * 更新渠道偏好
   */
  updateChannelPreferences(preferences: ChannelPreference[]): void {
    // 验证渠道偏好
    const channelTypes = new Set<string>();
    for (const preference of preferences) {
      if (channelTypes.has(preference.channelType)) {
        throw new InvalidNotifPreferencesError(
          `渠道类型 ${preference.channelType} 重复`,
        );
      }
      channelTypes.add(preference.channelType);
    }

    this._channelPreferences = [...preferences];
    this._lastUpdatedAt = new Date();
  }

  /**
   * 更新时间偏好
   */
  updateTimePreferences(preferences: TimePreference[]): void {
    this._timePreferences = [...preferences];
    this._lastUpdatedAt = new Date();
  }

  /**
   * 更新内容偏好
   */
  updateContentPreferences(preferences: ContentPreference[]): void {
    this._contentPreferences = [...preferences];
    this._lastUpdatedAt = new Date();
  }

  /**
   * 更新频率偏好
   */
  updateFrequencyPreferences(preferences: FrequencyPreference[]): void {
    this._frequencyPreferences = [...preferences];
    this._lastUpdatedAt = new Date();
  }

  /**
   * 激活偏好
   */
  activate(): void {
    this._isActive = true;
    this._lastUpdatedAt = new Date();
  }

  /**
   * 停用偏好
   */
  deactivate(): void {
    this._isActive = false;
    this._lastUpdatedAt = new Date();
  }

  /**
   * 获取指定渠道的偏好
   */
  getChannelPreference(channelType: string): ChannelPreference | undefined {
    return this._channelPreferences.find(p => p.channelType === channelType);
  }

  /**
   * 获取指定类型的时间偏好
   */
  getTimePreference(type: string): TimePreference | undefined {
    // 由于TimePreference没有type属性，这里返回第一个匹配的偏好
    // 或者可以根据具体业务需求调整逻辑
    return this._timePreferences.length > 0
      ? this._timePreferences[0]
      : undefined;
  }

  /**
   * 获取指定类型的内容偏好
   */
  getContentPreference(type: string): ContentPreference | undefined {
    // 由于ContentPreference没有type属性，这里返回第一个匹配的偏好
    // 或者可以根据具体业务需求调整逻辑
    return this._contentPreferences.length > 0
      ? this._contentPreferences[0]
      : undefined;
  }

  /**
   * 获取指定类型的频率偏好
   */
  getFrequencyPreference(type: string): FrequencyPreference | undefined {
    // 由于FrequencyPreference没有type属性，这里返回第一个匹配的偏好
    // 或者可以根据具体业务需求调整逻辑
    return this._frequencyPreferences.length > 0
      ? this._frequencyPreferences[0]
      : undefined;
  }

  /**
   * 检查是否允许通过指定渠道发送通知
   */
  isChannelEnabled(channelType: string): boolean {
    const preference = this.getChannelPreference(channelType);
    return preference ? preference.enabled : false;
  }

  /**
   * 检查是否在允许的时间范围内
   */
  isTimeAllowed(date: Date): boolean {
    if (this._timePreferences.length === 0) {
      return true; // 没有时间限制
    }

    return this._timePreferences.some(preference =>
      preference.isTimeAllowed(date),
    );
  }

  /**
   * 获取实体ID
   */
  public getEntityId(): string {
    return this.userId;
  }

  /**
   * 获取租户ID
   */
  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * 获取偏好摘要
   */
  getSummary(): object {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      channelPreferences: this._channelPreferences.map(p => p.getSummary()),
      timePreferences: this._timePreferences.map(p => p.getSummary()),
      contentPreferences: this._contentPreferences.map(p => p.getSummary()),
      frequencyPreferences: this._frequencyPreferences.map(p => p.getSummary()),
      isActive: this._isActive,
      lastUpdatedAt: this._lastUpdatedAt,
    };
  }
}

/**
 * 无效通知偏好错误
 */
export class InvalidNotifPreferencesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifPreferencesError';
  }
}
