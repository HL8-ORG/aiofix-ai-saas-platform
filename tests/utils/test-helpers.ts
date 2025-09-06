/**
 * 测试辅助工具
 *
 * 提供测试环境下的通用辅助功能，包括：
 * - 测试数据生成
 * - 测试环境管理
 * - 测试断言工具
 * - 测试时间管理
 *
 * @fileoverview 测试辅助工具
 * @author AI开发团队
 * @since 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 测试时间管理工具
 */
export class TestTimeUtils {
  private static mockDate: Date | null = null;

  /**
   * 设置模拟时间
   */
  static setMockDate(date: Date): void {
    this.mockDate = date;
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  /**
   * 清除模拟时间
   */
  static clearMockDate(): void {
    this.mockDate = null;
    jest.useRealTimers();
  }

  /**
   * 获取当前时间
   */
  static now(): Date {
    return this.mockDate || new Date();
  }

  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 快进时间
   */
  static advanceTime(ms: number): void {
    if (jest.isMockFunction(setTimeout)) {
      jest.advanceTimersByTime(ms);
    }
  }
}

/**
 * 测试数据生成工具
 */
export class TestDataGenerator {
  /**
   * 生成随机字符串
   */
  static randomString(length = 10): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成随机邮箱
   */
  static randomEmail(): string {
    return `test-${this.randomString(8)}@example.com`;
  }

  /**
   * 生成随机手机号
   */
  static randomPhone(): string {
    const prefixes = ['138', '139', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0');
    return `+86${prefix}${suffix}`;
  }

  /**
   * 生成随机UUID
   */
  static randomUuid(): string {
    return uuidv4();
  }

  /**
   * 生成随机数字
   */
  static randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成随机布尔值
   */
  static randomBoolean(): boolean {
    return Math.random() > 0.5;
  }

  /**
   * 从数组中随机选择元素
   */
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 生成随机日期
   */
  static randomDate(start?: Date, end?: Date): Date {
    const startDate = start || new Date('2020-01-01');
    const endDate = end || new Date();
    const time =
      startDate.getTime() +
      Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(time);
  }
}

/**
 * 测试断言工具
 */
export class TestAssertions {
  /**
   * 断言对象包含指定属性
   */
  static assertHasProperties(obj: any, properties: string[]): void {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  }

  /**
   * 断言对象不包含指定属性
   */
  static assertNotHasProperties(obj: any, properties: string[]): void {
    properties.forEach(prop => {
      expect(obj).not.toHaveProperty(prop);
    });
  }

  /**
   * 断言数组包含指定元素
   */
  static assertArrayContains<T>(array: T[], element: T): void {
    expect(array).toContain(element);
  }

  /**
   * 断言数组不包含指定元素
   */
  static assertArrayNotContains<T>(array: T[], element: T): void {
    expect(array).not.toContain(element);
  }

  /**
   * 断言函数抛出指定错误
   */
  static async assertThrows(
    fn: () => Promise<any> | any,
    expectedError?: string | RegExp | Error,
  ): Promise<void> {
    if (expectedError) {
      await expect(fn).rejects.toThrow(expectedError);
    } else {
      await expect(fn).rejects.toThrow();
    }
  }

  /**
   * 断言函数不抛出错误
   */
  static async assertNotThrows(fn: () => Promise<any> | any): Promise<void> {
    await expect(fn).resolves.not.toThrow();
  }

  /**
   * 断言对象是有效的日期
   */
  static assertValidDate(date: any): void {
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).not.toBeNaN();
  }

  /**
   * 断言对象是有效的UUID
   */
  static assertValidUuid(uuid: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  }

  /**
   * 断言对象是有效的邮箱
   */
  static assertValidEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(email).toMatch(emailRegex);
  }
}

/**
 * 测试环境管理工具
 */
export class TestEnvironmentManager {
  private static originalEnv: NodeJS.ProcessEnv = {};

  /**
   * 设置测试环境变量
   */
  static setEnv(key: string, value: string): void {
    if (!this.originalEnv[key]) {
      this.originalEnv[key] = process.env[key];
    }
    process.env[key] = value;
  }

  /**
   * 批量设置环境变量
   */
  static setEnvs(envs: Record<string, string>): void {
    Object.entries(envs).forEach(([key, value]) => {
      this.setEnv(key, value);
    });
  }

  /**
   * 恢复环境变量
   */
  static restoreEnv(key: string): void {
    if (this.originalEnv[key] !== undefined) {
      process.env[key] = this.originalEnv[key];
    } else {
      delete process.env[key];
    }
  }

  /**
   * 恢复所有环境变量
   */
  static restoreAllEnvs(): void {
    Object.keys(this.originalEnv).forEach(key => {
      this.restoreEnv(key);
    });
    this.originalEnv = {};
  }

  /**
   * 设置测试环境
   */
  static setupTestEnvironment(): void {
    this.setEnvs({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL: 'redis://localhost:6379/1',
    });
  }
}

/**
 * 测试性能工具
 */
export class TestPerformanceUtils {
  /**
   * 测量函数执行时间
   */
  static async measureTime<T>(
    fn: () => Promise<T> | T,
  ): Promise<{ result: T; duration: number }> {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒

    return { result, duration };
  }

  /**
   * 断言函数执行时间在指定范围内
   */
  static async assertExecutionTime(
    fn: () => Promise<any> | any,
    maxDuration: number,
  ): Promise<void> {
    const { duration } = await this.measureTime(fn);
    expect(duration).toBeLessThan(maxDuration);
  }

  /**
   * 内存使用情况
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * 断言内存使用在合理范围内
   */
  static assertMemoryUsage(maxMemoryMB = 100): void {
    const usage = this.getMemoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    expect(heapUsedMB).toBeLessThan(maxMemoryMB);
  }
}

/**
 * 测试清理工具
 */
export class TestCleanupUtils {
  private static cleanupFunctions: (() => void | Promise<void>)[] = [];

  /**
   * 注册清理函数
   */
  static registerCleanup(fn: () => void | Promise<void>): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * 执行所有清理函数
   */
  static async cleanup(): Promise<void> {
    for (const fn of this.cleanupFunctions.reverse()) {
      try {
        await fn();
      } catch (error) {
        console.warn('清理函数执行失败:', error);
      }
    }
    this.cleanupFunctions = [];
  }

  /**
   * 清理所有Mock
   */
  static cleanupMocks(): void {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }

  /**
   * 清理定时器
   */
  static cleanupTimers(): void {
    jest.clearAllTimers();
    jest.useRealTimers();
  }
}

/**
 * 测试工具集合
 */
export const TestUtils = {
  Time: TestTimeUtils,
  Data: TestDataGenerator,
  Assert: TestAssertions,
  Environment: TestEnvironmentManager,
  Performance: TestPerformanceUtils,
  Cleanup: TestCleanupUtils,
};

/**
 * 全局测试设置
 */
export function setupGlobalTestEnvironment(): void {
  // 设置测试环境变量
  TestEnvironmentManager.setupTestEnvironment();

  // 设置全局测试超时
  jest.setTimeout(10000);

  // 注册全局清理函数
  TestCleanupUtils.registerCleanup(() => {
    TestEnvironmentManager.restoreAllEnvs();
    TestTimeUtils.clearMockDate();
    TestCleanupUtils.cleanupMocks();
    TestCleanupUtils.cleanupTimers();
  });
}

/**
 * 测试装饰器
 */
export function withCleanup(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await method.apply(this, args);
    } finally {
      await TestCleanupUtils.cleanup();
    }
  };

  return descriptor;
}
