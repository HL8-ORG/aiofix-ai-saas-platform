/**
 * Jest全局设置文件
 *
 * 配置Jest测试环境的全局设置，包括：
 * - 全局变量设置
 * - 模拟配置
 * - 测试工具函数
 *
 * @fileoverview Jest测试环境设置
 * @author AI开发团队
 * @since 1.0.0
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// 全局测试超时时间
jest.setTimeout(10000);

// 全局模拟
global.console = {
  ...console,
  // 在测试中静默console.log，除非明确需要
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 模拟Date.now()为固定值，确保测试的可重复性
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// 模拟Math.random()为固定值
global.Math.random = jest.fn(() => 0.5);

// 全局测试工具函数
global.testUtils = {
  /**
   * 创建测试用户数据
   */
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
    ...overrides,
  }),

  /**
   * 创建测试租户数据
   */
  createTestTenant: (overrides = {}) => ({
    name: 'Test Tenant',
    type: 'enterprise',
    status: 'active',
    ...overrides,
  }),

  /**
   * 等待指定时间
   */
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 生成随机字符串
   */
  randomString: (length = 10) => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 生成随机邮箱
   */
  randomEmail: () => `test-${global.testUtils.randomString()}@example.com`,

  /**
   * 生成随机UUID
   */
  randomUuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  },
};

// 全局测试钩子
beforeAll(() => {
  // 全局测试开始前的设置
  console.log('🚀 开始运行测试套件');
});

afterAll(() => {
  // 全局测试结束后的清理
  console.log('✅ 测试套件运行完成');
});

beforeEach(() => {
  // 每个测试前的设置
  jest.clearAllMocks();
});

afterEach(() => {
  // 每个测试后的清理
  jest.restoreAllMocks();
});

// 处理未捕获的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 在测试环境中，这通常表示测试失败
  throw reason;
});

// 处理未捕获的异常
process.on('uncaughtException', error => {
  console.error('未捕获的异常:', error);
  // 在测试环境中，这通常表示测试失败
  throw error;
});
