/**
 * @class ChannelPreference
 * @description
 * 渠道偏好值对象，封装用户对特定通知渠道的偏好设置。
 *
 * 渠道偏好包含：
 * 1. 渠道类型：email、push、sms、webhook等
 * 2. 启用状态：是否启用该渠道
 * 3. 优先级：high、medium、low
 * 4. 配置参数：渠道特定的配置选项
 *
 * 业务规则：
 * 1. 渠道类型必须为有效的通知渠道
 * 2. 优先级必须是预定义的值
 * 3. 配置参数必须符合渠道要求
 *
 * @property {string} channelType 通知渠道类型
 * @property {boolean} enabled 是否启用
 * @property {string} priority 优先级
 * @property {Record<string, any>} config 渠道配置参数
 *
 * @example
 * ```typescript
 * const emailPreference = new ChannelPreference('email', true, 'high', {
 *   templateId: 'welcome-template',
 *   sendTime: 'immediate'
 * });
 * ```
 * @since 1.0.0
 */
export class ChannelPreference {
  constructor(
    public readonly channelType: string,
    public readonly enabled: boolean,
    public readonly priority: string,
    public readonly config: Record<string, unknown> = {},
  ) {
    this.validateChannel(channelType);
    this.validatePriority(priority);
    this.validateConfig(config);
  }

  /**
   * @method equals
   * @description 比较两个渠道偏好是否相等
   * @param {ChannelPreference} other 另一个渠道偏好对象
   * @returns {boolean} 是否相等
   */
  equals(other: ChannelPreference): boolean {
    if (!other) return false;

    return (
      this.channelType === other.channelType &&
      this.enabled === other.enabled &&
      this.priority === other.priority &&
      JSON.stringify(this.config) === JSON.stringify(other.config)
    );
  }

  /**
   * @method isEnabled
   * @description 检查渠道是否启用
   * @returns {boolean} 是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * @method isHighPriority
   * @description 检查是否为高优先级
   * @returns {boolean} 是否为高优先级
   */
  isHighPriority(): boolean {
    return this.priority === 'high';
  }

  /**
   * @method getConfigValue
   * @description 获取配置参数值
   * @param {string} key 配置键
   * @param {any} defaultValue 默认值
   * @returns {any} 配置值
   */
  getConfigValue(key: string, defaultValue?: unknown): unknown {
    return this.config[key] ?? defaultValue;
  }

  /**
   * @method validateChannel
   * @description 验证渠道类型
   * @param {string} channel 渠道类型
   * @returns {void}
   * @throws {Error} 当渠道类型无效时抛出
   * @private
   */
  private validateChannel(channel: string): void {
    const validChannels = ['email', 'push', 'sms', 'webhook', 'in-app'];

    if (!validChannels.includes(channel)) {
      throw new Error(
        `Invalid channel type: ${channel}. Valid channels are: ${validChannels.join(', ')}`,
      );
    }
  }

  /**
   * @method validatePriority
   * @description 验证优先级
   * @param {string} priority 优先级
   * @returns {void}
   * @throws {Error} 当优先级无效时抛出
   * @private
   */
  private validatePriority(priority: string): void {
    const validPriorities = ['high', 'medium', 'low'];

    if (!validPriorities.includes(priority)) {
      throw new Error(
        `Invalid priority: ${priority}. Valid priorities are: ${validPriorities.join(', ')}`,
      );
    }
  }

  /**
   * @method validateConfig
   * @description 验证配置参数
   * @param {Record<string, any>} config 配置参数
   * @returns {void}
   * @throws {Error} 当配置参数无效时抛出
   * @private
   */
  private validateConfig(config: Record<string, unknown>): void {
    if (typeof config !== 'object' || config === null) {
      throw new Error('Config must be a valid object');
    }

    // 验证配置参数不能包含循环引用
    try {
      JSON.stringify(config);
    } catch {
      throw new Error('Config contains circular references');
    }
  }

  /**
   * @method getSummary
   * @description 获取渠道偏好摘要
   * @returns {object} 渠道偏好摘要
   */
  getSummary(): object {
    return {
      channelType: this.channelType,
      enabled: this.enabled,
      priority: this.priority,
      config: this.config,
    };
  }
}
