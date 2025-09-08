/**
 * @class FrequencyPreference
 * @description
 * 频率偏好值对象，封装用户对通知频率的偏好设置。
 *
 * 频率偏好包含：
 * 1. 最大通知频率：用户每日/每周/每月愿意接收的最大通知数量
 * 2. 频率限制类型：daily、weekly、monthly
 * 3. 批量通知设置：是否允许批量发送通知
 * 4. 紧急通知例外：紧急通知是否不受频率限制
 * 5. 频率重置时间：频率限制的重置时间
 *
 * 业务规则：
 * 1. 最大通知频率必须大于0
 * 2. 频率限制类型必须是有效值
 * 3. 批量通知设置必须是布尔值
 * 4. 紧急通知例外必须是布尔值
 * 5. 频率重置时间必须是有效的时间格式
 *
 * @property {number} maxFrequency 最大通知频率
 * @property {string} frequencyType 频率限制类型
 * @property {boolean} allowBatching 是否允许批量通知
 * @property {boolean} emergencyException 紧急通知是否例外
 * @property {string} resetTime 频率重置时间
 *
 * @example
 * ```typescript
 * const frequencyPreference = new FrequencyPreference(
 *   10,
 *   'daily',
 *   true,
 *   true,
 *   '00:00'
 * );
 * ```
 * @since 1.0.0
 */
export class FrequencyPreference {
  constructor(
    public readonly maxFrequency: number,
    public readonly frequencyType: string,
    public readonly allowBatching: boolean,
    public readonly emergencyException: boolean,
    public readonly resetTime: string,
  ) {
    this.validateMaxFrequency(maxFrequency);
    this.validateFrequencyType(frequencyType);
    this.validateResetTime(resetTime);
  }

  /**
   * @method equals
   * @description 比较两个频率偏好是否相等
   * @param {FrequencyPreference} other 另一个频率偏好对象
   * @returns {boolean} 是否相等
   */
  equals(other: FrequencyPreference): boolean {
    if (!other) return false;

    return (
      this.maxFrequency === other.maxFrequency &&
      this.frequencyType === other.frequencyType &&
      this.allowBatching === other.allowBatching &&
      this.emergencyException === other.emergencyException &&
      this.resetTime === other.resetTime
    );
  }

  /**
   * @method canSendNotification
   * @description 检查是否可以发送通知
   * @param {number} currentCount 当前已发送数量
   * @param {boolean} isEmergency 是否为紧急通知
   * @returns {boolean} 是否可以发送
   */
  canSendNotification(
    currentCount: number,
    isEmergency: boolean = false,
  ): boolean {
    // 紧急通知例外
    if (isEmergency && this.emergencyException) {
      return true;
    }

    // 检查是否超过频率限制
    return currentCount < this.maxFrequency;
  }

  /**
   * @method getRemainingCount
   * @description 获取剩余可发送数量
   * @param {number} currentCount 当前已发送数量
   * @returns {number} 剩余可发送数量
   */
  getRemainingCount(currentCount: number): number {
    return Math.max(0, this.maxFrequency - currentCount);
  }

  /**
   * @method isDailyLimit
   * @description 检查是否为每日限制
   * @returns {boolean} 是否为每日限制
   */
  isDailyLimit(): boolean {
    return this.frequencyType === 'daily';
  }

  /**
   * @method isWeeklyLimit
   * @description 检查是否为每周限制
   * @returns {boolean} 是否为每周限制
   */
  isWeeklyLimit(): boolean {
    return this.frequencyType === 'weekly';
  }

  /**
   * @method isMonthlyLimit
   * @description 检查是否为每月限制
   * @returns {boolean} 是否为每月限制
   */
  isMonthlyLimit(): boolean {
    return this.frequencyType === 'monthly';
  }

  /**
   * @method shouldBatchNotifications
   * @description 检查是否应该批量发送通知
   * @returns {boolean} 是否应该批量发送
   */
  shouldBatchNotifications(): boolean {
    return this.allowBatching;
  }

  /**
   * @method getResetTimeInMinutes
   * @description 获取重置时间的分钟数
   * @returns {number} 重置时间的分钟数
   */
  getResetTimeInMinutes(): number {
    const [hours, minutes] = this.resetTime.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * @method validateMaxFrequency
   * @description 验证最大通知频率
   * @param {number} frequency 最大通知频率
   * @returns {void}
   * @throws {Error} 当最大通知频率无效时抛出
   * @private
   */
  private validateMaxFrequency(frequency: number): void {
    if (!Number.isInteger(frequency) || frequency <= 0) {
      throw new Error('Max frequency must be a positive integer');
    }

    if (frequency > 1000) {
      throw new Error('Max frequency cannot exceed 1000');
    }
  }

  /**
   * @method validateFrequencyType
   * @description 验证频率限制类型
   * @param {string} type 频率限制类型
   * @returns {void}
   * @throws {Error} 当频率限制类型无效时抛出
   * @private
   */
  private validateFrequencyType(type: string): void {
    const validTypes = ['daily', 'weekly', 'monthly'];

    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid frequency type: ${type}. Valid types are: ${validTypes.join(', ')}`,
      );
    }
  }

  /**
   * @method validateResetTime
   * @description 验证重置时间
   * @param {string} time 重置时间
   * @returns {void}
   * @throws {Error} 当重置时间无效时抛出
   * @private
   */
  private validateResetTime(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(time)) {
      throw new Error(
        `Invalid reset time format: ${time}. Expected format: HH:mm`,
      );
    }
  }

  /**
   * @method getSummary
   * @description 获取频率偏好摘要
   * @returns {object} 频率偏好摘要
   */
  getSummary(): object {
    return {
      maxFrequency: this.maxFrequency,
      frequencyType: this.frequencyType,
      allowBatching: this.allowBatching,
      emergencyException: this.emergencyException,
      resetTime: this.resetTime,
    };
  }
}
