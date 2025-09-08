import { ValueObject } from '@aiofix/core';

/**
 * @enum AnalyticsDimensionType
 * @description 分析维度类型枚举
 */
export enum AnalyticsDimensionType {
  CHANNEL = 'channel',
  USER = 'user',
  TENANT = 'tenant',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  NOTIFICATION_TYPE = 'notification_type',
  PRIORITY = 'priority',
  STRATEGY = 'strategy',
  TIME = 'time',
  GEOGRAPHY = 'geography',
  DEVICE = 'device',
  PLATFORM = 'platform',
}

/**
 * @enum AnalyticsDimensionValueType
 * @description 分析维度值类型枚举
 */
export enum AnalyticsDimensionValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ENUM = 'enum',
}

/**
 * @interface AnalyticsDimensionProps
 * @description 分析维度属性接口
 */
export interface AnalyticsDimensionProps {
  readonly type: AnalyticsDimensionType;
  readonly name: string;
  readonly value: string | number | boolean | Date;
  readonly valueType: AnalyticsDimensionValueType;
  readonly displayName?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class AnalyticsDimension
 * @description 分析维度值对象，封装通知分析维度数据
 *
 * 业务规则：
 * 1. 维度名称不能为空
 * 2. 维度值必须与值类型匹配
 * 3. 枚举类型维度值必须在预定义范围内
 * 4. 日期类型维度值必须是有效日期
 *
 * 不变性约束：
 * 1. 维度值一旦创建不可变更
 * 2. 维度类型和值类型必须匹配
 * 3. 维度名称不可修改
 */
export class AnalyticsDimension extends ValueObject<AnalyticsDimensionProps> {
  /**
   * @method create
   * @description 创建分析维度实例
   * @param {AnalyticsDimensionProps} props 维度属性
   * @returns {AnalyticsDimension} 分析维度实例
   * @throws {InvalidAnalyticsDimensionError} 当维度数据无效时抛出
   */
  public static create(props: AnalyticsDimensionProps): AnalyticsDimension {
    this.validateDimension(props);
    return new AnalyticsDimension(props);
  }

  /**
   * @method createChannel
   * @description 创建频道维度
   * @param {string} channelType 频道类型
   * @returns {AnalyticsDimension} 频道维度
   */
  public static createChannel(channelType: string): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.CHANNEL,
      name: 'channel',
      value: channelType,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '通知频道',
    });
  }

  /**
   * @method createUser
   * @description 创建用户维度
   * @param {string} userId 用户ID
   * @returns {AnalyticsDimension} 用户维度
   */
  public static createUser(userId: string): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.USER,
      name: 'user_id',
      value: userId,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '用户',
    });
  }

  /**
   * @method createTenant
   * @description 创建租户维度
   * @param {string} tenantId 租户ID
   * @returns {AnalyticsDimension} 租户维度
   */
  public static createTenant(tenantId: string): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.TENANT,
      name: 'tenant_id',
      value: tenantId,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '租户',
    });
  }

  /**
   * @method createNotificationType
   * @description 创建通知类型维度
   * @param {string} notificationType 通知类型
   * @returns {AnalyticsDimension} 通知类型维度
   */
  public static createNotificationType(
    notificationType: string,
  ): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.NOTIFICATION_TYPE,
      name: 'notification_type',
      value: notificationType,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '通知类型',
    });
  }

  /**
   * @method createPriority
   * @description 创建优先级维度
   * @param {string} priority 优先级
   * @returns {AnalyticsDimension} 优先级维度
   */
  public static createPriority(priority: string): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.PRIORITY,
      name: 'priority',
      value: priority,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '优先级',
    });
  }

  /**
   * @method createTime
   * @description 创建时间维度
   * @param {Date} date 日期
   * @returns {AnalyticsDimension} 时间维度
   */
  public static createTime(date: Date): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.TIME,
      name: 'time',
      value: date,
      valueType: AnalyticsDimensionValueType.DATE,
      displayName: '时间',
    });
  }

  /**
   * @method createGeography
   * @description 创建地理维度
   * @param {string} country 国家
   * @param {string} [region] 地区
   * @param {string} [city] 城市
   * @returns {AnalyticsDimension} 地理维度
   */
  public static createGeography(
    country: string,
    region?: string,
    city?: string,
  ): AnalyticsDimension {
    const location = [country, region, city].filter(Boolean).join(', ');
    return this.create({
      type: AnalyticsDimensionType.GEOGRAPHY,
      name: 'geography',
      value: location,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '地理位置',
      metadata: { country, region, city },
    });
  }

  /**
   * @method createDevice
   * @description 创建设备维度
   * @param {string} deviceType 设备类型
   * @param {string} [platform] 平台
   * @returns {AnalyticsDimension} 设备维度
   */
  public static createDevice(
    deviceType: string,
    platform?: string,
  ): AnalyticsDimension {
    return this.create({
      type: AnalyticsDimensionType.DEVICE,
      name: 'device',
      value: deviceType,
      valueType: AnalyticsDimensionValueType.STRING,
      displayName: '设备',
      metadata: { deviceType, platform },
    });
  }

  /**
   * @method getType
   * @description 获取维度类型
   * @returns {AnalyticsDimensionType} 维度类型
   */
  public getType(): AnalyticsDimensionType {
    return this.value.type;
  }

  /**
   * @method getName
   * @description 获取维度名称
   * @returns {string} 维度名称
   */
  public getName(): string {
    return this.value.name;
  }

  /**
   * @method getValue
   * @description 获取维度值
   * @returns {string | number | boolean | Date} 维度值
   */
  public getValue(): string | number | boolean | Date {
    return this.value.value;
  }

  /**
   * @method getValueType
   * @description 获取维度值类型
   * @returns {AnalyticsDimensionValueType} 维度值类型
   */
  public getValueType(): AnalyticsDimensionValueType {
    return this.value.valueType;
  }

  /**
   * @method getDisplayName
   * @description 获取显示名称
   * @returns {string | undefined} 显示名称
   */
  public getDisplayName(): string | undefined {
    return this.value.displayName;
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
   * @method getStringValue
   * @description 获取字符串值
   * @returns {string} 字符串值
   */
  public getStringValue(): string {
    if (this.value.valueType === AnalyticsDimensionValueType.DATE) {
      return (this.value.value as Date).toISOString();
    }
    return String(this.value.value);
  }

  /**
   * @method getNumericValue
   * @description 获取数值
   * @returns {number | null} 数值，如果不是数值类型则返回null
   */
  public getNumericValue(): number | null {
    if (this.value.valueType === AnalyticsDimensionValueType.NUMBER) {
      return this.value.value as number;
    }
    return null;
  }

  /**
   * @method getBooleanValue
   * @description 获取布尔值
   * @returns {boolean | null} 布尔值，如果不是布尔类型则返回null
   */
  public getBooleanValue(): boolean | null {
    if (this.value.valueType === AnalyticsDimensionValueType.BOOLEAN) {
      return this.value.value as boolean;
    }
    return null;
  }

  /**
   * @method getDateValue
   * @description 获取日期值
   * @returns {Date | null} 日期值，如果不是日期类型则返回null
   */
  public getDateValue(): Date | null {
    if (this.value.valueType === AnalyticsDimensionValueType.DATE) {
      return this.value.value as Date;
    }
    return null;
  }

  /**
   * @method isString
   * @description 判断是否为字符串类型
   * @returns {boolean} 是否为字符串类型
   */
  public isString(): boolean {
    return this.value.valueType === AnalyticsDimensionValueType.STRING;
  }

  /**
   * @method isNumber
   * @description 判断是否为数值类型
   * @returns {boolean} 是否为数值类型
   */
  public isNumber(): boolean {
    return this.value.valueType === AnalyticsDimensionValueType.NUMBER;
  }

  /**
   * @method isBoolean
   * @description 判断是否为布尔类型
   * @returns {boolean} 是否为布尔类型
   */
  public isBoolean(): boolean {
    return this.value.valueType === AnalyticsDimensionValueType.BOOLEAN;
  }

  /**
   * @method isDate
   * @description 判断是否为日期类型
   * @returns {boolean} 是否为日期类型
   */
  public isDate(): boolean {
    return this.value.valueType === AnalyticsDimensionValueType.DATE;
  }

  /**
   * @method validateDimension
   * @description 验证维度数据
   * @param {AnalyticsDimensionProps} props 维度属性
   * @throws {InvalidAnalyticsDimensionError} 当维度数据无效时抛出
   * @private
   * @static
   */
  private static validateDimension(props: AnalyticsDimensionProps): void {
    // 验证维度名称
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidAnalyticsDimensionError('维度名称不能为空');
    }

    // 验证维度值类型匹配
    this.validateValueTypeMatch(props.value, props.valueType);

    // 验证枚举类型维度值
    if (props.valueType === AnalyticsDimensionValueType.ENUM) {
      this.validateEnumValue(props.type, props.value as string);
    }
  }

  /**
   * @method validateValueTypeMatch
   * @description 验证维度值类型匹配
   * @param {string | number | boolean | Date} value 维度值
   * @param {AnalyticsDimensionValueType} valueType 值类型
   * @throws {InvalidAnalyticsDimensionError} 当类型不匹配时抛出
   * @private
   * @static
   */
  private static validateValueTypeMatch(
    value: string | number | boolean | Date,
    valueType: AnalyticsDimensionValueType,
  ): void {
    switch (valueType) {
      case AnalyticsDimensionValueType.STRING:
        if (typeof value !== 'string') {
          throw new InvalidAnalyticsDimensionError(
            '字符串类型维度值必须是字符串',
          );
        }
        break;
      case AnalyticsDimensionValueType.NUMBER:
        if (typeof value !== 'number' || isNaN(value)) {
          throw new InvalidAnalyticsDimensionError(
            '数值类型维度值必须是有效数字',
          );
        }
        break;
      case AnalyticsDimensionValueType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new InvalidAnalyticsDimensionError(
            '布尔类型维度值必须是布尔值',
          );
        }
        break;
      case AnalyticsDimensionValueType.DATE:
        if (!(value instanceof Date) || isNaN(value.getTime())) {
          throw new InvalidAnalyticsDimensionError(
            '日期类型维度值必须是有效日期',
          );
        }
        break;
    }
  }

  /**
   * @method validateEnumValue
   * @description 验证枚举类型维度值
   * @param {AnalyticsDimensionType} type 维度类型
   * @param {string} value 维度值
   * @throws {InvalidAnalyticsDimensionError} 当枚举值无效时抛出
   * @private
   * @static
   */
  private static validateEnumValue(
    type: AnalyticsDimensionType,
    value: string,
  ): void {
    const enumValues: Record<AnalyticsDimensionType, string[]> = {
      [AnalyticsDimensionType.CHANNEL]: ['email', 'push', 'sms', 'in-app'],
      [AnalyticsDimensionType.PRIORITY]: ['low', 'normal', 'high', 'urgent'],
      [AnalyticsDimensionType.STRATEGY]: ['immediate', 'delayed', 'batch'],
      [AnalyticsDimensionType.DEVICE]: ['mobile', 'desktop', 'tablet'],
      [AnalyticsDimensionType.PLATFORM]: ['web', 'ios', 'android'],
      [AnalyticsDimensionType.NOTIFICATION_TYPE]: [
        'system',
        'marketing',
        'transactional',
      ],
      [AnalyticsDimensionType.USER]: [],
      [AnalyticsDimensionType.TENANT]: [],
      [AnalyticsDimensionType.ORGANIZATION]: [],
      [AnalyticsDimensionType.DEPARTMENT]: [],
      [AnalyticsDimensionType.TIME]: [],
      [AnalyticsDimensionType.GEOGRAPHY]: [],
    };

    const validValues = enumValues[type];
    if (validValues.length > 0 && !validValues.includes(value)) {
      throw new InvalidAnalyticsDimensionError(
        `维度类型 ${type} 不支持值 ${value}，支持的值: ${validValues.join(', ')}`,
      );
    }
  }
}

/**
 * @class InvalidAnalyticsDimensionError
 * @description 无效分析维度错误
 */
export class InvalidAnalyticsDimensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAnalyticsDimensionError';
  }
}
