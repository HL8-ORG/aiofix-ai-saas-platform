module.exports = {
  // 继承基础配置
  ...require('./jest.config.js'),

  // E2E测试特定配置
  displayName: 'E2E Tests',

  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/packages/**/*.e2e.spec.ts',
    '<rootDir>/apps/**/*.e2e.spec.ts',
  ],

  // 测试环境
  testEnvironment: 'node',

  // 更长的超时时间，因为E2E测试通常需要更多时间
  testTimeout: 60000,

  // 串行执行E2E测试
  maxWorkers: 1,

  // E2E测试的覆盖率配置
  collectCoverage: false, // E2E测试通常不收集覆盖率

  // 全局设置
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.e2e.setup.js',
  ],

  // 测试结果处理器
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit-e2e.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
};
