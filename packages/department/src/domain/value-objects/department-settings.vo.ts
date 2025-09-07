import { ValueObject } from '@aiofix/core';

/**
 * @interface DepartmentSettingsData
 * @description 部门设置数据接口
 */
export interface DepartmentSettingsData {
  /** 是否允许用户自主加入 */
  allowSelfJoin: boolean;
  /** 是否需要审批加入 */
  requireApproval: boolean;
  /** 最大成员数量 */
  maxMembers: number;
  /** 是否允许创建子部门 */
  allowSubDepartments: boolean;
  /** 是否启用部门公告 */
  enableAnnouncements: boolean;
  /** 是否启用部门日历 */
  enableCalendar: boolean;
  /** 是否启用文件共享 */
  enableFileSharing: boolean;
  /** 是否启用项目管理 */
  enableProjectManagement: boolean;
  /** 默认语言设置 */
  defaultLanguage: string;
  /** 时区设置 */
  timezone: string;
  /** 部门层级限制 */
  maxDepth: number;
}

/**
 * @class DepartmentSettings
 * @description
 * 部门设置值对象，封装部门配置信息的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 部门设置一旦创建不可变更
 * 2. 设置值必须在有效范围内
 * 3. 设置之间必须保持逻辑一致性
 *
 * 相等性判断：
 * 1. 基于所有设置属性进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 深度比较所有配置项
 *
 * 业务概念封装：
 * 1. 封装部门配置验证逻辑
 * 2. 提供设置默认值方法
 * 3. 隐藏配置细节
 *
 * @property {DepartmentSettingsData} value 部门设置数据
 *
 * @example
 * ```typescript
 * const settings = new DepartmentSettings({
 *   allowSelfJoin: true,
 *   requireApproval: false,
 *   maxMembers: 50
 * });
 * console.log(settings.canJoinWithoutApproval()); // true
 * ```
 * @since 1.0.0
 */
export class DepartmentSettings extends ValueObject<DepartmentSettingsData> {
  constructor(data: DepartmentSettingsData) {
    const validatedData = DepartmentSettings.validateAndNormalizeSettings(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeSettings
   * @description 验证并标准化部门设置
   * @param {DepartmentSettingsData} data 原始设置数据
   * @returns {DepartmentSettingsData} 验证后的设置数据
   * @throws {InvalidDepartmentSettingsError} 当设置无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeSettings(
    data: DepartmentSettingsData,
  ): DepartmentSettingsData {
    if (!data || typeof data !== 'object') {
      throw new InvalidDepartmentSettingsError('部门设置不能为空');
    }

    // 验证最大成员数量
    if (data.maxMembers < 1 || data.maxMembers > 1000) {
      throw new InvalidDepartmentSettingsError('最大成员数量必须在1-1000之间');
    }

    // 验证部门层级限制
    if (data.maxDepth < 1 || data.maxDepth > 10) {
      throw new InvalidDepartmentSettingsError('部门层级限制必须在1-10之间');
    }

    // 验证语言设置
    if (!data.defaultLanguage || typeof data.defaultLanguage !== 'string') {
      throw new InvalidDepartmentSettingsError('默认语言不能为空');
    }

    // 验证时区设置
    if (!data.timezone || typeof data.timezone !== 'string') {
      throw new InvalidDepartmentSettingsError('时区设置不能为空');
    }

    // 逻辑一致性验证
    if (data.allowSelfJoin && data.requireApproval) {
      throw new InvalidDepartmentSettingsError(
        '允许自主加入和需要审批不能同时为true',
      );
    }

    return {
      allowSelfJoin: Boolean(data.allowSelfJoin),
      requireApproval: Boolean(data.requireApproval),
      maxMembers: Math.max(1, Math.min(1000, data.maxMembers)),
      allowSubDepartments: Boolean(data.allowSubDepartments),
      enableAnnouncements: Boolean(data.enableAnnouncements),
      enableCalendar: Boolean(data.enableCalendar),
      enableFileSharing: Boolean(data.enableFileSharing),
      enableProjectManagement: Boolean(data.enableProjectManagement),
      defaultLanguage: data.defaultLanguage.trim(),
      timezone: data.timezone.trim(),
      maxDepth: Math.max(1, Math.min(10, data.maxDepth)),
    };
  }

  /**
   * @method canJoinWithoutApproval
   * @description 判断是否可以无需审批加入
   * @returns {boolean} 是否可以无需审批加入
   */
  canJoinWithoutApproval(): boolean {
    return this.value.allowSelfJoin && !this.value.requireApproval;
  }

  /**
   * @method canCreateSubDepartments
   * @description 判断是否可以创建子部门
   * @returns {boolean} 是否可以创建子部门
   */
  canCreateSubDepartments(): boolean {
    return this.value.allowSubDepartments;
  }

  /**
   * @method isFeatureEnabled
   * @description 判断指定功能是否启用
   * @param {string} feature 功能名称
   * @returns {boolean} 功能是否启用
   */
  isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case 'announcements':
        return this.value.enableAnnouncements;
      case 'calendar':
        return this.value.enableCalendar;
      case 'fileSharing':
        return this.value.enableFileSharing;
      case 'projectManagement':
        return this.value.enableProjectManagement;
      default:
        return false;
    }
  }

  /**
   * @method getMaxMembers
   * @description 获取最大成员数量
   * @returns {number} 最大成员数量
   */
  getMaxMembers(): number {
    return this.value.maxMembers;
  }

  /**
   * @method getMaxDepth
   * @description 获取最大层级深度
   * @returns {number} 最大层级深度
   */
  getMaxDepth(): number {
    return this.value.maxDepth;
  }

  /**
   * @method getDefaultLanguage
   * @description 获取默认语言
   * @returns {string} 默认语言
   */
  getDefaultLanguage(): string {
    return this.value.defaultLanguage;
  }

  /**
   * @method getTimezone
   * @description 获取时区设置
   * @returns {string} 时区
   */
  getTimezone(): string {
    return this.value.timezone;
  }

  /**
   * @method createDefault
   * @description 创建默认部门设置
   * @returns {DepartmentSettings} 默认设置实例
   * @static
   */
  static createDefault(): DepartmentSettings {
    return new DepartmentSettings({
      allowSelfJoin: false,
      requireApproval: true,
      maxMembers: 50,
      allowSubDepartments: true,
      enableAnnouncements: true,
      enableCalendar: true,
      enableFileSharing: true,
      enableProjectManagement: false,
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      maxDepth: 5,
    });
  }

  /**
   * @method isValid
   * @description 验证数据是否为有效的部门设置格式
   * @param {DepartmentSettingsData} data 待验证的数据
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(data: DepartmentSettingsData): boolean {
    try {
      new DepartmentSettings(data);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidDepartmentSettingsError
 * @description 无效部门设置异常类
 * @extends Error
 */
export class InvalidDepartmentSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentSettingsError';
  }
}
