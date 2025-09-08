import { EventSourcedAggregateRoot } from '@aiofix/core';
import { NotifPreferencesEntity } from '../entities/notif-preferences.entity';
import { ChannelPreference } from '../value-objects/channel-preference.vo';
import { TimePreference } from '../value-objects/time-preference.vo';
import { ContentPreference } from '../value-objects/content-preference.vo';
import { FrequencyPreference } from '../value-objects/frequency-preference.vo';
import { NotifPreferencesCreatedEvent } from '../events/notif-preferences-created.event';
import { NotifPreferencesUpdatedEvent } from '../events/notif-preferences-updated.event';

/**
 * 用户通知偏好聚合根
 * 负责管理用户通知偏好的业务协调和事件发布
 *
 * 聚合根职责：
 * - 协调用户偏好的创建、更新和状态管理
 * - 发布用户偏好相关的领域事件
 * - 维护用户偏好的业务不变性
 * - 处理用户偏好的复杂业务逻辑
 *
 * 业务协调：
 * - 用户偏好创建和初始化
 * - 用户偏好更新和验证
 * - 用户偏好状态管理
 * - 用户偏好业务规则验证
 *
 * 事件发布：
 * - 用户偏好创建事件
 * - 用户偏好更新事件
 * - 用户偏好状态变更事件
 *
 * @property {NotifPreferencesEntity} preferences 用户偏好实体
 */
export class NotifPreferences extends EventSourcedAggregateRoot {
  constructor(public readonly preferences: NotifPreferencesEntity) {
    super();
  }

  /**
   * 创建用户偏好聚合根
   *
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {ChannelPreference[]} [channelPreferences] 渠道偏好列表
   * @param {TimePreference[]} [timePreferences] 时间偏好列表
   * @param {ContentPreference[]} [contentPreferences] 内容偏好列表
   * @param {FrequencyPreference[]} [frequencyPreferences] 频率偏好列表
   * @param {string} [createdBy] 创建者
   * @returns {NotifPreferences} 用户偏好聚合根
   */
  public static create(
    userId: string,
    tenantId: string,
    channelPreferences: ChannelPreference[] = [],
    timePreferences: TimePreference[] = [],
    contentPreferences: ContentPreference[] = [],
    frequencyPreferences: FrequencyPreference[] = [],
    createdBy: string = 'system',
  ): NotifPreferences {
    const preferences = new NotifPreferencesEntity(
      userId,
      tenantId,
      channelPreferences,
      timePreferences,
      contentPreferences,
      frequencyPreferences,
      true,
      new Date(),
      createdBy,
    );

    const aggregate = new NotifPreferences(preferences);

    // 发布创建事件
    aggregate.addDomainEvent(
      new NotifPreferencesCreatedEvent(
        userId,
        tenantId,
        channelPreferences,
        timePreferences,
        contentPreferences,
        frequencyPreferences,
        createdBy,
      ),
    );

    return aggregate;
  }

  /**
   * 从实体重建聚合根
   *
   * @param {NotifPreferencesEntity} preferences 用户偏好实体
   * @returns {NotifPreferences} 用户偏好聚合根
   */
  public static fromEntity(
    preferences: NotifPreferencesEntity,
  ): NotifPreferences {
    return new NotifPreferences(preferences);
  }

  /**
   * 获取用户ID
   */
  public getUserId(): string {
    return this.preferences.userId;
  }

  /**
   * 获取租户ID
   */
  public getTenantId(): string {
    return this.preferences.tenantId;
  }

  /**
   * 获取渠道偏好列表
   */
  public getChannelPreferences(): ChannelPreference[] {
    return this.preferences.channelPreferences;
  }

  /**
   * 获取时间偏好列表
   */
  public getTimePreferences(): TimePreference[] {
    return this.preferences.timePreferences;
  }

  /**
   * 获取内容偏好列表
   */
  public getContentPreferences(): ContentPreference[] {
    return this.preferences.contentPreferences;
  }

  /**
   * 获取频率偏好列表
   */
  public getFrequencyPreferences(): FrequencyPreference[] {
    return this.preferences.frequencyPreferences;
  }

  /**
   * 是否激活
   */
  public isActive(): boolean {
    return this.preferences.isActive;
  }

  /**
   * 最后更新时间
   */
  public getLastUpdatedAt(): Date {
    return this.preferences.lastUpdatedAt;
  }

  /**
   * 更新渠道偏好
   *
   * @param {ChannelPreference[]} preferences 新的渠道偏好列表
   */
  public updateChannelPreferences(preferences: ChannelPreference[]): void {
    this.preferences.updateChannelPreferences(preferences);

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'channelPreferences',
        preferences,
        'system',
      ),
    );
  }

  /**
   * 更新时间偏好
   *
   * @param {TimePreference[]} preferences 新的时间偏好列表
   */
  public updateTimePreferences(preferences: TimePreference[]): void {
    this.preferences.updateTimePreferences(preferences);

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'timePreferences',
        preferences,
        'system',
      ),
    );
  }

  /**
   * 更新内容偏好
   *
   * @param {ContentPreference[]} preferences 新的内容偏好列表
   */
  public updateContentPreferences(preferences: ContentPreference[]): void {
    this.preferences.updateContentPreferences(preferences);

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'contentPreferences',
        preferences,
        'system',
      ),
    );
  }

  /**
   * 更新频率偏好
   *
   * @param {FrequencyPreference[]} preferences 新的频率偏好列表
   */
  public updateFrequencyPreferences(preferences: FrequencyPreference[]): void {
    this.preferences.updateFrequencyPreferences(preferences);

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'frequencyPreferences',
        preferences,
        'system',
      ),
    );
  }

  /**
   * 激活偏好
   */
  public activate(): void {
    if (this.preferences.isActive) {
      return; // 已经激活
    }

    this.preferences.activate();

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'isActive',
        true,
        'system',
      ),
    );
  }

  /**
   * 停用偏好
   */
  public deactivate(): void {
    if (!this.preferences.isActive) {
      return; // 已经停用
    }

    this.preferences.deactivate();

    // 发布更新事件
    this.addDomainEvent(
      new NotifPreferencesUpdatedEvent(
        this.getUserId(),
        this.getTenantId(),
        'isActive',
        false,
        'system',
      ),
    );
  }

  /**
   * 获取指定渠道的偏好
   *
   * @param {string} channelType 渠道类型
   * @returns {ChannelPreference | undefined} 渠道偏好
   */
  public getChannelPreference(
    channelType: string,
  ): ChannelPreference | undefined {
    return this.preferences.getChannelPreference(channelType);
  }

  /**
   * 获取指定类型的时间偏好
   *
   * @param {string} type 偏好类型
   * @returns {TimePreference | undefined} 时间偏好
   */
  public getTimePreference(type: string): TimePreference | undefined {
    return this.preferences.getTimePreference(type);
  }

  /**
   * 获取指定类型的内容偏好
   *
   * @param {string} type 偏好类型
   * @returns {ContentPreference | undefined} 内容偏好
   */
  public getContentPreference(type: string): ContentPreference | undefined {
    return this.preferences.getContentPreference(type);
  }

  /**
   * 获取指定类型的频率偏好
   *
   * @param {string} type 偏好类型
   * @returns {FrequencyPreference | undefined} 频率偏好
   */
  public getFrequencyPreference(type: string): FrequencyPreference | undefined {
    return this.preferences.getFrequencyPreference(type);
  }

  /**
   * 检查是否允许通过指定渠道发送通知
   *
   * @param {string} channelType 渠道类型
   * @returns {boolean} 是否允许
   */
  public isChannelEnabled(channelType: string): boolean {
    return this.preferences.isChannelEnabled(channelType);
  }

  /**
   * 检查是否在允许的时间范围内
   *
   * @param {Date} date 时间
   * @returns {boolean} 是否允许
   */
  public isTimeAllowed(date: Date): boolean {
    return this.preferences.isTimeAllowed(date);
  }

  /**
   * 获取偏好摘要
   *
   * @returns {object} 偏好摘要
   */
  public getSummary(): object {
    return this.preferences.getSummary();
  }
}
