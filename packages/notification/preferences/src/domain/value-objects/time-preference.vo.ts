/**
 * @class TimePreference
 * @description
 * 时间偏好值对象，封装用户接收通知的时间偏好设置。
 *
 * 时间偏好包含：
 * 1. 开始时间：每日开始接收通知的时间
 * 2. 结束时间：每日结束接收通知的时间
 * 3. 工作日：允许接收通知的工作日
 * 4. 时区：用户所在时区
 * 5. 免打扰模式：是否启用免打扰模式
 *
 * 业务规则：
 * 1. 开始时间必须早于结束时间
 * 2. 工作日必须是有效的星期值
 * 3. 时区必须是有效的时区标识
 * 4. 时间格式必须为HH:mm
 *
 * @property {string} startTime 开始时间 (HH:mm格式)
 * @property {string} endTime 结束时间 (HH:mm格式)
 * @property {string[]} workDays 工作日列表
 * @property {string} timezone 时区标识
 * @property {boolean} doNotDisturb 是否启用免打扰模式
 *
 * @example
 * ```typescript
 * const timePreference = new TimePreference(
 *   '09:00',
 *   '18:00',
 *   ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
 *   'Asia/Shanghai',
 *   false
 * );
 * ```
 * @since 1.0.0
 */
export class TimePreference {
  constructor(
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly workDays: string[],
    public readonly timezone: string,
    public readonly doNotDisturb: boolean = false,
  ) {
    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);
    this.validateTimeRange(startTime, endTime);
    this.validateWorkDays(workDays);
    this.validateTimezone(timezone);
  }

  /**
   * @method equals
   * @description 比较两个时间偏好是否相等
   * @param {TimePreference} other 另一个时间偏好对象
   * @returns {boolean} 是否相等
   */
  equals(other: TimePreference): boolean {
    if (!other) return false;

    return (
      this.startTime === other.startTime &&
      this.endTime === other.endTime &&
      JSON.stringify(this.workDays.sort()) ===
        JSON.stringify(other.workDays.sort()) &&
      this.timezone === other.timezone &&
      this.doNotDisturb === other.doNotDisturb
    );
  }

  /**
   * @method isWithinTimeRange
   * @description 检查指定时间是否在偏好时间范围内
   * @param {string} time 时间 (HH:mm格式)
   * @returns {boolean} 是否在时间范围内
   */
  isWithinTimeRange(time: string): boolean {
    this.validateTimeFormat(time);

    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    const checkMinutes = this.timeToMinutes(time);

    if (startMinutes <= endMinutes) {
      // 正常时间范围 (如 09:00 - 18:00)
      return checkMinutes >= startMinutes && checkMinutes <= endMinutes;
    } else {
      // 跨天时间范围 (如 22:00 - 06:00)
      return checkMinutes >= startMinutes || checkMinutes <= endMinutes;
    }
  }

  /**
   * @method isWorkDay
   * @description 检查指定日期是否为工作日
   * @param {string} day 星期几
   * @returns {boolean} 是否为工作日
   */
  isWorkDay(day: string): boolean {
    return this.workDays.includes(day.toLowerCase());
  }

  /**
   * @method canReceiveNotification
   * @description 检查当前时间是否可以接收通知
   * @param {Date} currentTime 当前时间
   * @returns {boolean} 是否可以接收通知
   */
  canReceiveNotification(currentTime: Date): boolean {
    if (this.doNotDisturb) {
      return false;
    }

    const dayOfWeek = this.getDayOfWeek(currentTime);
    if (!this.isWorkDay(dayOfWeek)) {
      return false;
    }

    const timeString = this.formatTime(currentTime);
    return this.isWithinTimeRange(timeString);
  }

  /**
   * @method timeToMinutes
   * @description 将时间字符串转换为分钟数
   * @param {string} time 时间字符串 (HH:mm格式)
   * @returns {number} 分钟数
   * @private
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * @method getDayOfWeek
   * @description 获取星期几
   * @param {Date} date 日期对象
   * @returns {string} 星期几
   * @private
   */
  private getDayOfWeek(date: Date): string {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    return days[date.getDay()];
  }

  /**
   * @method formatTime
   * @description 格式化时间为HH:mm格式
   * @param {Date} date 日期对象
   * @returns {string} 格式化的时间字符串
   * @private
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * @method validateTimeFormat
   * @description 验证时间格式
   * @param {string} time 时间字符串
   * @returns {void}
   * @throws {Error} 当时间格式无效时抛出
   * @private
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected format: HH:mm`);
    }
  }

  /**
   * @method validateTimeRange
   * @description 验证时间范围
   * @param {string} startTime 开始时间
   * @param {string} endTime 结束时间
   * @returns {void}
   * @throws {Error} 当时间范围无效时抛出
   * @private
   */
  private validateTimeRange(startTime: string, endTime: string): void {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // 允许跨天时间范围，但开始和结束时间不能相同
    if (startMinutes === endMinutes) {
      throw new Error('Start time and end time cannot be the same');
    }
  }

  /**
   * @method validateWorkDays
   * @description 验证工作日
   * @param {string[]} workDays 工作日列表
   * @returns {void}
   * @throws {Error} 当工作日无效时抛出
   * @private
   */
  private validateWorkDays(workDays: string[]): void {
    const validDays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    if (!Array.isArray(workDays)) {
      throw new Error('Work days must be an array');
    }

    if (workDays.length === 0) {
      throw new Error('Work days cannot be empty');
    }

    for (const day of workDays) {
      if (!validDays.includes(day.toLowerCase())) {
        throw new Error(
          `Invalid work day: ${day}. Valid days are: ${validDays.join(', ')}`,
        );
      }
    }
  }

  /**
   * @method validateTimezone
   * @description 验证时区
   * @param {string} timezone 时区标识
   * @returns {void}
   * @throws {Error} 当时区无效时抛出
   * @private
   */
  private validateTimezone(timezone: string): void {
    // 简单的时区格式验证
    const timezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$/;

    if (!timezoneRegex.test(timezone)) {
      throw new Error(
        `Invalid timezone format: ${timezone}. Expected format: Area/Location`,
      );
    }
  }

  /**
   * @method isTimeAllowed
   * @description 检查指定时间是否被允许
   * @param {Date} date 要检查的日期
   * @returns {boolean} 是否被允许
   */
  isTimeAllowed(date: Date): boolean {
    return this.canReceiveNotification(date);
  }

  /**
   * @method getSummary
   * @description 获取时间偏好摘要
   * @returns {object} 时间偏好摘要
   */
  getSummary(): object {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      workDays: this.workDays,
      timezone: this.timezone,
      doNotDisturb: this.doNotDisturb,
    };
  }
}
