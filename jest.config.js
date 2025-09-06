module.exports = {
  // 测试环境
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 项目根目录
  rootDir: '.',

  // 测试文件匹配模式
  testMatch: ['<rootDir>/packages/**/*.spec.ts', '<rootDir>/apps/**/*.spec.ts'],

  // 忽略的测试文件
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/'],

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // 模块名映射
  moduleNameMapping: {
    '^@aiofix/core$': '<rootDir>/packages/core/src',
    '^@aiofix/common$': '<rootDir>/packages/common/src',
    '^@aiofix/(.*)$': '<rootDir>/packages/$1/src',
  },

  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/*.spec.ts',
    '/examples/',
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
    // 核心包要求更高的覆盖率
    'packages/core/src/**/*.ts': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },

  // 测试超时时间
  testTimeout: 10000,

  // 清理模拟
  clearMocks: true,
  restoreMocks: true,

  // 详细输出
  verbose: true,

  // 错误处理
  errorOnDeprecated: true,

  // 并行测试
  maxWorkers: '50%',

  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 全局设置
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 模块路径
  modulePaths: ['<rootDir>/packages'],

  // 测试结果处理器
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
};
