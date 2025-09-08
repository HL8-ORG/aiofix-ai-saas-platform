import { ValueObject } from '@aiofix/core';

/**
 * @interface PerformanceMetricsData
 * @description 性能指标数据结构
 */
export interface PerformanceMetricsData {
  readonly cpuUsage: number; // 百分比
  readonly memoryUsage: number; // 百分比
  readonly diskUsage: number; // 百分比
  readonly networkLatency: number; // 毫秒
  readonly responseTime: number; // 毫秒
  readonly throughput: number; // 请求/秒
  readonly errorRate: number; // 百分比
  readonly uptime: number; // 秒
}

/**
 * @interface UserActivityData
 * @description 用户活动数据结构
 */
export interface UserActivityData {
  readonly activeUsers: number;
  readonly newUsers: number;
  readonly totalUsers: number;
  readonly loginCount: number;
  readonly sessionDuration: number; // 平均会话时长（分钟）
  readonly pageViews: number;
  readonly uniqueVisitors: number;
  readonly bounceRate: number; // 百分比
}

/**
 * @interface SystemCapacityData
 * @description 系统容量数据结构
 */
export interface SystemCapacityData {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly totalOrganizations: number;
  readonly totalDepartments: number;
  readonly totalRoles: number;
  readonly totalPermissions: number;
  readonly storageUsed: number; // MB
  readonly bandwidthUsed: number; // MB
  readonly apiCallsUsed: number;
}

/**
 * @interface SystemMetricsData
 * @description 系统指标数据结构
 */
export interface SystemMetricsData {
  readonly performanceMetrics: PerformanceMetricsData;
  readonly userActivity: UserActivityData;
  readonly systemCapacity: SystemCapacityData;
  readonly timestamp: Date;
  readonly dataCenter: string;
  readonly environment: string;
}

/**
 * @class SystemMetrics
 * @description
 * 系统指标值对象，封装系统监控指标的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 所有百分比值必须在0-100之间
 * 2. 时间值必须为非负数
 * 3. 计数值必须为非负数
 * 4. 时间戳必须为有效日期
 *
 * 相等性判断：
 * 1. 基于指标内容和时间戳进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装指标验证逻辑
 * 2. 提供指标计算和分析方法
 * 3. 隐藏指标格式细节
 *
 * @property {SystemMetricsData} value 指标数据
 *
 * @example
 * ```typescript
 * const metrics = new SystemMetrics({
 *   performanceMetrics: {
 *     cpuUsage: 45.2,
 *     memoryUsage: 67.8,
 *     diskUsage: 23.1,
 *     networkLatency: 120,
 *     responseTime: 250,
 *     throughput: 1500,
 *     errorRate: 0.5,
 *     uptime: 86400
 *   },
 *   userActivity: {
 *     activeUsers: 1250,
 *     newUsers: 45,
 *     totalUsers: 5670,
 *     loginCount: 8900,
 *     sessionDuration: 25.5,
 *     pageViews: 45600,
 *     uniqueVisitors: 2100,
 *     bounceRate: 35.2
 *   },
 *   systemCapacity: {
 *     totalTenants: 150,
 *     activeTenants: 142,
 *     totalUsers: 5670,
 *     activeUsers: 1250,
 *     totalOrganizations: 890,
 *     totalDepartments: 2340,
 *     totalRoles: 450,
 *     totalPermissions: 1200,
 *     storageUsed: 1024000,
 *     bandwidthUsed: 512000,
 *     apiCallsUsed: 1500000
 *   },
 *   timestamp: new Date(),
 *   dataCenter: 'us-east-1',
 *   environment: 'production'
 * });
 * ```
 * @since 1.0.0
 */
export class SystemMetrics extends ValueObject<SystemMetricsData> {
  constructor(data: SystemMetricsData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证指标数据的有效性
   * @returns {void}
   * @throws {Error} 当指标数据无效时抛出
   * @private
   */
  private validate(): void {
    const { performanceMetrics, userActivity, systemCapacity, timestamp } =
      this.value;

    // 验证性能指标
    this.validatePercentage(performanceMetrics.cpuUsage, 'CPU使用率');
    this.validatePercentage(performanceMetrics.memoryUsage, '内存使用率');
    this.validatePercentage(performanceMetrics.diskUsage, '磁盘使用率');
    this.validatePercentage(performanceMetrics.errorRate, '错误率');
    this.validateNonNegative(performanceMetrics.networkLatency, '网络延迟');
    this.validateNonNegative(performanceMetrics.responseTime, '响应时间');
    this.validateNonNegative(performanceMetrics.throughput, '吞吐量');
    this.validateNonNegative(performanceMetrics.uptime, '运行时间');

    // 验证用户活动
    this.validateNonNegative(userActivity.activeUsers, '活跃用户数');
    this.validateNonNegative(userActivity.newUsers, '新用户数');
    this.validateNonNegative(userActivity.totalUsers, '总用户数');
    this.validateNonNegative(userActivity.loginCount, '登录次数');
    this.validateNonNegative(userActivity.sessionDuration, '会话时长');
    this.validateNonNegative(userActivity.pageViews, '页面浏览量');
    this.validateNonNegative(userActivity.uniqueVisitors, '独立访客数');
    this.validatePercentage(userActivity.bounceRate, '跳出率');

    // 验证系统容量
    this.validateNonNegative(systemCapacity.totalTenants, '总租户数');
    this.validateNonNegative(systemCapacity.activeTenants, '活跃租户数');
    this.validateNonNegative(systemCapacity.totalUsers, '总用户数');
    this.validateNonNegative(systemCapacity.activeUsers, '活跃用户数');
    this.validateNonNegative(systemCapacity.totalOrganizations, '总组织数');
    this.validateNonNegative(systemCapacity.totalDepartments, '总部门数');
    this.validateNonNegative(systemCapacity.totalRoles, '总角色数');
    this.validateNonNegative(systemCapacity.totalPermissions, '总权限数');
    this.validateNonNegative(systemCapacity.storageUsed, '已用存储');
    this.validateNonNegative(systemCapacity.bandwidthUsed, '已用带宽');
    this.validateNonNegative(systemCapacity.apiCallsUsed, '已用API调用');

    // 验证时间戳
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      throw new Error('时间戳必须是有效的日期');
    }
  }

  /**
   * @method validatePercentage
   * @description 验证百分比值
   * @param {number} value 值
   * @param {string} fieldName 字段名
   * @returns {void}
   * @throws {Error} 当值无效时抛出
   * @private
   */
  private validatePercentage(value: number, fieldName: string): void {
    if (value < 0 || value > 100) {
      throw new Error(`${fieldName}必须在0-100之间`);
    }
  }

  /**
   * @method validateNonNegative
   * @description 验证非负数值
   * @param {number} value 值
   * @param {string} fieldName 字段名
   * @returns {void}
   * @throws {Error} 当值无效时抛出
   * @private
   */
  private validateNonNegative(value: number, fieldName: string): void {
    if (value < 0) {
      throw new Error(`${fieldName}不能为负数`);
    }
  }

  /**
   * @getter performanceMetrics
   * @description 获取性能指标
   * @returns {PerformanceMetricsData} 性能指标
   */
  get performanceMetrics(): PerformanceMetricsData {
    return this.value.performanceMetrics;
  }

  /**
   * @getter userActivity
   * @description 获取用户活动
   * @returns {UserActivityData} 用户活动
   */
  get userActivity(): UserActivityData {
    return this.value.userActivity;
  }

  /**
   * @getter systemCapacity
   * @description 获取系统容量
   * @returns {SystemCapacityData} 系统容量
   */
  get systemCapacity(): SystemCapacityData {
    return this.value.systemCapacity;
  }

  /**
   * @getter timestamp
   * @description 获取时间戳
   * @returns {Date} 时间戳
   */
  get timestamp(): Date {
    return this.value.timestamp;
  }

  /**
   * @getter dataCenter
   * @description 获取数据中心
   * @returns {string} 数据中心
   */
  get dataCenter(): string {
    return this.value.dataCenter;
  }

  /**
   * @getter environment
   * @description 获取环境
   * @returns {string} 环境
   */
  get environment(): string {
    return this.value.environment;
  }

  /**
   * @method isSystemHealthy
   * @description 检查系统是否健康
   * @returns {boolean} 是否健康
   */
  isSystemHealthy(): boolean {
    const perf = this.performanceMetrics;
    return (
      perf.cpuUsage < 80 &&
      perf.memoryUsage < 85 &&
      perf.diskUsage < 90 &&
      perf.errorRate < 5 &&
      perf.responseTime < 1000
    );
  }

  /**
   * @method isPerformanceGood
   * @description 检查性能是否良好
   * @returns {boolean} 性能是否良好
   */
  isPerformanceGood(): boolean {
    const perf = this.performanceMetrics;
    return (
      perf.cpuUsage < 60 &&
      perf.memoryUsage < 70 &&
      perf.responseTime < 500 &&
      perf.errorRate < 2
    );
  }

  /**
   * @method isCapacityAdequate
   * @description 检查容量是否充足
   * @returns {boolean} 容量是否充足
   */
  isCapacityAdequate(): boolean {
    const capacity = this.systemCapacity;
    const perf = this.performanceMetrics;

    return (
      capacity.storageUsed < 10000000 && // 10GB
      capacity.bandwidthUsed < 1000000 && // 1TB
      perf.diskUsage < 80
    );
  }

  /**
   * @method getUserGrowthRate
   * @description 计算用户增长率
   * @returns {number} 用户增长率（百分比）
   */
  getUserGrowthRate(): number {
    const activity = this.userActivity;
    if (activity.totalUsers === 0) {
      return 0;
    }
    return (activity.newUsers / activity.totalUsers) * 100;
  }

  /**
   * @method getTenantUtilizationRate
   * @description 计算租户利用率
   * @returns {number} 租户利用率（百分比）
   */
  getTenantUtilizationRate(): number {
    const capacity = this.systemCapacity;
    if (capacity.totalTenants === 0) {
      return 0;
    }
    return (capacity.activeTenants / capacity.totalTenants) * 100;
  }

  /**
   * @method getResourceUtilizationRate
   * @description 计算资源利用率
   * @returns {object} 资源利用率
   */
  getResourceUtilizationRate(): object {
    const perf = this.performanceMetrics;
    return {
      cpu: perf.cpuUsage,
      memory: perf.memoryUsage,
      disk: perf.diskUsage,
      network: perf.networkLatency,
    };
  }

  /**
   * @method getSummary
   * @description 获取指标摘要信息
   * @returns {string} 指标摘要
   */
  getSummary(): string {
    const perf = this.performanceMetrics;
    const activity = this.userActivity;
    const capacity = this.systemCapacity;

    return (
      `系统状态: ${this.isSystemHealthy() ? '健康' : '异常'}, ` +
      `活跃用户: ${activity.activeUsers}, ` +
      `总租户: ${capacity.totalTenants}, ` +
      `CPU: ${perf.cpuUsage}%, ` +
      `内存: ${perf.memoryUsage}%`
    );
  }

  /**
   * @method equals
   * @description 比较两个指标对象是否相等
   * @param {SystemMetrics} other 另一个指标对象
   * @returns {boolean} 是否相等
   */
  equals(other: SystemMetrics): boolean {
    if (!(other instanceof SystemMetrics)) {
      return false;
    }

    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.dataCenter === other.dataCenter &&
      this.environment === other.environment
    );
  }
}
