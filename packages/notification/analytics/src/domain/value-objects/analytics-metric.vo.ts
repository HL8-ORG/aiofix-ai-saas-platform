import { ValueObject } from '@aiofix/core';

/**
 * @enum AnalyticsMetricType
 * @description 分析指标类型枚举
 */
export enum AnalyticsMetricType {
  DELIVERY_RATE = 'delivery_rate',
  OPEN_RATE = 'open_rate',
  CLICK_RATE = 'click_rate',
  CONVERSION_RATE = 'conversion_rate',
  BOUNCE_RATE = 'bounce_rate',
  UNSUBSCRIBE_RATE = 'unsubscribe_rate',
  RESPONSE_TIME = 'response_time',
  ERROR_RATE = 'error_rate',
  VOLUME = 'volume',
  REVENUE = 'revenue',
}

/**
 * @enum AnalyticsTimeRange
 * @description 分析时间范围枚举
 */
export enum AnalyticsTimeRange {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * @interface AnalyticsMetricProps
 * @description 分析指标属性接口
 */
export interface AnalyticsMetricProps {
  readonly type: AnalyticsMetricType;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: Date;
  readonly timeRange: AnalyticsTimeRange;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class AnalyticsMetric
 * @description 分析指标值对象，封装通知分析指标数据
 *
 * 业务规则：
 * 1. 指标值必须为非负数
 * 2. 百分比类型指标值必须在0-100之间
 * 3. 时间戳不能是未来时间
 * 4. 指标类型和单位必须匹配
 *
 * 不变性约束：
 * 1. 指标值一旦创建不可变更
 * 2. 时间戳不可修改
 * 3. 指标类型和单位组合必须有效
 */
export class AnalyticsMetric extends ValueObject<AnalyticsMetricProps> {
  /**
   * @method create
   * @description 创建分析指标实例
   * @param {AnalyticsMetricProps} props 指标属性
   * @returns {AnalyticsMetric} 分析指标实例
   * @throws {InvalidAnalyticsMetricError} 当指标数据无效时抛出
   */
  public static create(props: AnalyticsMetricProps): AnalyticsMetric {
    this.validateMetric(props);
    return new AnalyticsMetric(props);
  }

  /**
   * @method createDeliveryRate
   * @description 创建送达率指标
   * @param {number} value 送达率值 (0-100)
   * @param {Date} timestamp 时间戳
   * @param {AnalyticsTimeRange} timeRange 时间范围
   * @returns {AnalyticsMetric} 送达率指标
   */
  public static createDeliveryRate(
    value: number,
    timestamp: Date,
    timeRange: AnalyticsTimeRange,
  ): AnalyticsMetric {
    return this.create({
      type: AnalyticsMetricType.DELIVERY_RATE,
      value,
      unit: '%',
      timestamp,
      timeRange,
    });
  }

  /**
   * @method createOpenRate
   * @description 创建打开率指标
   * @param {number} value 打开率值 (0-100)
   * @param {Date} timestamp 时间戳
   * @param {AnalyticsTimeRange} timeRange 时间范围
   * @returns {AnalyticsMetric} 打开率指标
   */
  public static createOpenRate(
    value: number,
    timestamp: Date,
    timeRange: AnalyticsTimeRange,
  ): AnalyticsMetric {
    return this.create({
      type: AnalyticsMetricType.OPEN_RATE,
      value,
      unit: '%',
      timestamp,
      timeRange,
    });
  }

  /**
   * @method createClickRate
   * @description 创建点击率指标
   * @param {number} value 点击率值 (0-100)
   * @param {Date} timestamp 时间戳
   * @param {AnalyticsTimeRange} timeRange 时间范围
   * @returns {AnalyticsMetric} 点击率指标
   */
  public static createClickRate(
    value: number,
    timestamp: Date,
    timeRange: AnalyticsTimeRange,
  ): AnalyticsMetric {
    return this.create({
      type: AnalyticsMetricType.CLICK_RATE,
      value,
      unit: '%',
      timestamp,
      timeRange,
    });
  }

  /**
   * @method createVolume
   * @description 创建数量指标
   * @param {number} value 数量值
   * @param {string} unit 单位
   * @param {Date} timestamp 时间戳
   * @param {AnalyticsTimeRange} timeRange 时间范围
   * @returns {AnalyticsMetric} 数量指标
   */
  public static createVolume(
    value: number,
    unit: string,
    timestamp: Date,
    timeRange: AnalyticsTimeRange,
  ): AnalyticsMetric {
    return this.create({
      type: AnalyticsMetricType.VOLUME,
      value,
      unit,
      timestamp,
      timeRange,
    });
  }

  /**
   * @method createResponseTime
   * @description 创建响应时间指标
   * @param {number} value 响应时间值 (毫秒)
   * @param {Date} timestamp 时间戳
   * @param {AnalyticsTimeRange} timeRange 时间范围
   * @returns {AnalyticsMetric} 响应时间指标
   */
  public static createResponseTime(
    value: number,
    timestamp: Date,
    timeRange: AnalyticsTimeRange,
  ): AnalyticsMetric {
    return this.create({
      type: AnalyticsMetricType.RESPONSE_TIME,
      value,
      unit: 'ms',
      timestamp,
      timeRange,
    });
  }

  /**
   * @method getType
   * @description 获取指标类型
   * @returns {AnalyticsMetricType} 指标类型
   */
  public getType(): AnalyticsMetricType {
    return this.value.type;
  }

  /**
   * @method getValue
   * @description 获取指标值
   * @returns {number} 指标值
   */
  public getValue(): number {
    return this.value.value;
  }

  /**
   * @method getUnit
   * @description 获取指标单位
   * @returns {string} 指标单位
   */
  public getUnit(): string {
    return this.value.unit;
  }

  /**
   * @method getTimestamp
   * @description 获取时间戳
   * @returns {Date} 时间戳
   */
  public getTimestamp(): Date {
    return this.value.timestamp;
  }

  /**
   * @method getTimeRange
   * @description 获取时间范围
   * @returns {AnalyticsTimeRange} 时间范围
   */
  public getTimeRange(): AnalyticsTimeRange {
    return this.value.timeRange;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, unknown> | undefined} 元数据
   */
  public getMetadata(): Record<string, unknown> | undefined {
    return this.value.metadata;
  }

  /**
   * @method isPercentage
   * @description 判断是否为百分比指标
   * @returns {boolean} 是否为百分比指标
   */
  public isPercentage(): boolean {
    return this.value.unit === '%';
  }

  /**
   * @method isRate
   * @description 判断是否为比率指标
   * @returns {boolean} 是否为比率指标
   */
  public isRate(): boolean {
    const rateTypes = [
      AnalyticsMetricType.DELIVERY_RATE,
      AnalyticsMetricType.OPEN_RATE,
      AnalyticsMetricType.CLICK_RATE,
      AnalyticsMetricType.CONVERSION_RATE,
      AnalyticsMetricType.BOUNCE_RATE,
      AnalyticsMetricType.UNSUBSCRIBE_RATE,
      AnalyticsMetricType.ERROR_RATE,
    ];
    return rateTypes.includes(this.value.type);
  }

  /**
   * @method isVolume
   * @description 判断是否为数量指标
   * @returns {boolean} 是否为数量指标
   */
  public isVolume(): boolean {
    return this.value.type === AnalyticsMetricType.VOLUME;
  }

  /**
   * @method isPerformance
   * @description 判断是否为性能指标
   * @returns {boolean} 是否为性能指标
   */
  public isPerformance(): boolean {
    return this.value.type === AnalyticsMetricType.RESPONSE_TIME;
  }

  /**
   * @method validateMetric
   * @description 验证指标数据
   * @param {AnalyticsMetricProps} props 指标属性
   * @throws {InvalidAnalyticsMetricError} 当指标数据无效时抛出
   * @private
   * @static
   */
  private static validateMetric(props: AnalyticsMetricProps): void {
    // 验证指标值
    if (props.value < 0) {
      throw new InvalidAnalyticsMetricError('指标值不能为负数');
    }

    // 验证百分比指标
    if (props.unit === '%' && props.value > 100) {
      throw new InvalidAnalyticsMetricError('百分比指标值不能超过100');
    }

    // 验证时间戳
    if (props.timestamp > new Date()) {
      throw new InvalidAnalyticsMetricError('时间戳不能是未来时间');
    }

    // 验证指标类型和单位匹配
    this.validateTypeUnitMatch(props.type, props.unit);
  }

  /**
   * @method validateTypeUnitMatch
   * @description 验证指标类型和单位匹配
   * @param {AnalyticsMetricType} type 指标类型
   * @param {string} unit 单位
   * @throws {InvalidAnalyticsMetricError} 当类型和单位不匹配时抛出
   * @private
   * @static
   */
  private static validateTypeUnitMatch(
    type: AnalyticsMetricType,
    unit: string,
  ): void {
    const typeUnitMap: Record<AnalyticsMetricType, string[]> = {
      [AnalyticsMetricType.DELIVERY_RATE]: ['%'],
      [AnalyticsMetricType.OPEN_RATE]: ['%'],
      [AnalyticsMetricType.CLICK_RATE]: ['%'],
      [AnalyticsMetricType.CONVERSION_RATE]: ['%'],
      [AnalyticsMetricType.BOUNCE_RATE]: ['%'],
      [AnalyticsMetricType.UNSUBSCRIBE_RATE]: ['%'],
      [AnalyticsMetricType.RESPONSE_TIME]: ['ms', 's'],
      [AnalyticsMetricType.ERROR_RATE]: ['%'],
      [AnalyticsMetricType.VOLUME]: ['count', 'messages', 'users'],
      [AnalyticsMetricType.REVENUE]: ['USD', 'CNY', 'EUR'],
    };

    const validUnits = typeUnitMap[type];
    if (!validUnits.includes(unit)) {
      throw new InvalidAnalyticsMetricError(
        `指标类型 ${type} 不支持单位 ${unit}，支持的单位: ${validUnits.join(', ')}`,
      );
    }
  }
}

/**
 * @class InvalidAnalyticsMetricError
 * @description 无效分析指标错误
 */
export class InvalidAnalyticsMetricError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAnalyticsMetricError';
  }
}
