module.exports = {
  // 继承基础配置
  ...require('./jest.config.js'),

  // 集成测试特定配置
  displayName: 'Integration Tests',

  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/packages/**/*.integration.spec.ts',
    '<rootDir>/apps/**/*.integration.spec.ts',
  ],

  // 测试环境
  testEnvironment: 'node',

  // 更长的超时时间，因为集成测试通常需要更多时间
  testTimeout: 30000,

  // 串行执行集成测试，避免数据库冲突
  maxWorkers: 1,

  // 集成测试的覆盖率配置
  collectCoverage: false, // 集成测试通常不收集覆盖率

  // 全局设置
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.integration.setup.js',
  ],

  // 测试结果处理器
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit-integration.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
};
