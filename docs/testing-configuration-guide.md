# 测试配置指南

## 概述

本文档总结了Aiofix AI SAAS平台项目中各个包的测试配置方法，避免因配置问题影响开发进度。

## 项目结构

```
aiofix-ai-saas-platform/
├── jest.config.js              # 根目录Jest配置
├── jest.setup.js               # Jest全局设置
├── tsconfig.json               # 根目录TypeScript配置
├── tsconfig.build.json         # 构建配置
└── packages/
    ├── logging/                # 日志模块 ✅ 已配置
    ├── config/                 # 配置模块 ✅ 已配置
    ├── common/                 # 公共模块 ✅ 已配置
    ├── core/                   # 核心模块 ✅ 已配置
    ├── database/               # 数据库模块 ✅ 已配置
    ├── cache/                  # 缓存模块 ✅ 已配置
    ├── notification/           # 通知模块 ✅ 已配置
    └── shared/                 # 共享模块 📝 私有包
```

## 标准配置方法

### 1. 根目录配置

#### Jest配置 (`jest.config.js`)

```javascript
module.exports = {
  // 测试环境
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 禁用Babel，强制使用ts-jest
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],

  // 项目根目录
  rootDir: '.',

  // 测试文件匹配模式
  testMatch: ['<rootDir>/packages/**/*.spec.ts', '<rootDir>/apps/**/*.spec.ts'],

  // 模块名映射 - 重要：每个新包都需要添加映射
  moduleNameMapper: {
    '^@aiofix/core$': '<rootDir>/packages/core/src',
    '^@aiofix/common$': '<rootDir>/packages/common/src',
    '^@aiofix/logging$': '<rootDir>/packages/logging/src',
    '^@aiofix/config$': '<rootDir>/packages/config/src',
    '^@aiofix/database$': '<rootDir>/packages/database/src',
    '^@aiofix/cache$': '<rootDir>/packages/cache/src',
    '^@aiofix/notification$': '<rootDir>/packages/notification/src',
    '^@aiofix/(.*)$': '<rootDir>/packages/$1/src',
  },

  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: false,
        isolatedModules: true,
        tsconfig: {
          compilerOptions: {
            module: 'commonjs',
            target: 'es2020',
            strict: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            types: ['jest', 'node'],
          },
        },
      },
    ],
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
};
```

#### TypeScript配置 (`tsconfig.json`)

```json
{
  "extends": "./tsconfig.build.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@aiofix/logging": ["packages/logging/src"],
      "@aiofix/config": ["packages/config/src"],
      "@aiofix/core": ["packages/core/src"],
      "@aiofix/common": ["packages/common/src"],
      "@aiofix/database": ["packages/database/src"],
      "@aiofix/cache": ["packages/cache/src"],
      "@aiofix/notification": ["packages/notification/src"],
      "@aiofix/*": ["packages/*/src"]
    },
    "noEmit": true
  }
}
```

### 2. 包级别配置

#### package.json 测试脚本配置

```json
{
  "scripts": {
    "test": "jest --config ../../jest.config.js",
    "test:watch": "jest --config ../../jest.config.js --watch",
    "test:coverage": "jest --config ../../jest.config.js --coverage",
    "test:debug": "jest --config ../../jest.config.js --detectOpenHandles --forceExit",
    "test:ci": "jest --config ../../jest.config.js --ci --coverage --watchAll=false",
    "test:unit": "jest --config ../../jest.config.js --testPathPattern=spec",
    "test:integration": "jest --config ../../jest.config.js --testPathPattern=integration",
    "test:verbose": "jest --config ../../jest.config.js --verbose",
    "test:silent": "jest --config ../../jest.config.js --silent"
  }
}
```

#### 必需的devDependencies

```json
{
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^22.16.0",
    "jest": "^30.1.3",
    "ts-jest": "^29.4.1",
    "typescript": "~5.9.2"
  }
}
```

### 3. 测试文件配置

#### 测试文件头部配置

```typescript
/// <reference types="jest" />
/* eslint-env jest */
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

/**
 * @file example.spec.ts
 * @description 示例测试文件
 */
```

#### 类型断言最佳实践

```typescript
// ✅ 推荐：使用 as any 进行类型断言
const mockService = {
  method: jest.fn(),
} as any;

// ❌ 避免：使用 as unknown 可能导致类型错误
const mockService = {
  method: jest.fn(),
} as unknown as SomeService;
```

## 各包配置状态

### ✅ 已正确配置的包

#### 1. logging包

- **测试脚本**: ✅ 正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 包含所有必需的测试依赖
- **测试文件**: ✅ 语法正确

#### 2. config包

- **测试脚本**: ✅ 正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 包含所有必需的测试依赖
- **测试文件**: ✅ 语法正确

#### 3. common包

- **测试脚本**: ✅ 正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 包含所有必需的测试依赖
- **测试文件**: ✅ 语法正确

#### 4. database包

- **测试脚本**: ✅ 已修复，正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 包含所有必需的测试依赖
- **测试文件**: ✅ 已修复类型错误

#### 5. cache包

- **测试脚本**: ✅ 正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 包含所有必需的测试依赖
- **测试文件**: ✅ 语法正确

#### 6. core包

- **测试脚本**: ✅ 已修复，正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 已添加所有必需的测试依赖
- **测试文件**: ✅ 语法正确

#### 7. notification包

- **测试脚本**: ✅ 已修复，正确配置 `--config ../../jest.config.js`
- **模块映射**: ✅ 已在根目录配置
- **依赖**: ✅ 已添加所有必需的测试依赖
- **测试文件**: ✅ 语法正确

### 📝 特殊包

#### 1. shared包

- **状态**: 私有包，目前无代码，待开发
- **说明**: 这是一个私有包，目前只有package.json文件，没有源代码。一旦开始开发代码，就需要按照标准配置方法添加测试配置

## 常见问题及解决方案

### 1. Jest使用Babel而不是ts-jest

**问题**: 错误信息显示 `@babel/parser` 而不是 `ts-jest`
**原因**: 包级别的测试脚本没有指定配置文件路径
**解决**: 在package.json的测试脚本中添加 `--config ../../jest.config.js`

### 2. 模块映射错误

**问题**: `Cannot resolve module '@aiofix/xxx'`
**原因**: 根目录jest.config.js中缺少模块映射
**解决**: 在moduleNameMapper中添加对应的映射

### 3. TypeScript类型错误

**问题**: `Type 'unknown' is not assignable to type 'xxx'`
**原因**: 测试文件中使用了不正确的类型断言
**解决**: 使用 `as any` 替代 `as unknown`

### 4. 测试文件语法错误

**问题**: `Missing semicolon` 或 `Unexpected token`
**原因**: Jest无法正确解析TypeScript语法
**解决**: 确保测试文件头部包含正确的Jest类型引用

### 5. Jest配置警告

**问题**: `Unknown option "babelConfig" with value false`
**原因**: Jest不识别babelConfig选项
**解决**: 注释掉或删除babelConfig配置

## 新包配置检查清单

创建新包时，请按以下清单检查测试配置：

- [ ] 在根目录 `jest.config.js` 中添加模块映射
- [ ] 在根目录 `tsconfig.json` 中添加路径映射
- [ ] 在包的 `package.json` 中配置测试脚本（包含 `--config ../../jest.config.js`）
- [ ] 在包的 `package.json` 中添加必需的测试依赖
- [ ] 测试文件头部包含正确的Jest类型引用
- [ ] 测试文件中的类型断言使用 `as any`
- [ ] 运行 `pnpm test` 验证配置正确

## 运行测试命令

### 从根目录运行

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm test packages/database

# 运行特定测试文件
pnpm test packages/database/src/adapters/postgresql.adapter.spec.ts
```

### 从包目录运行

```bash
cd packages/database

# 运行测试
pnpm test

# 监视模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

## 配置验证

### 验证所有包的测试配置

```bash
# 验证所有包的测试配置
for pkg in packages/*/; do
  echo "Testing $pkg"
  cd "$pkg"
  pnpm test --passWithNoTests
  cd ../..
done
```

### 验证特定包的配置

```bash
# 验证特定包
cd packages/database
pnpm test --passWithNoTests
```

## 总结

正确的测试配置需要：

1. **根目录配置**: Jest和TypeScript配置正确
2. **包级别配置**: 测试脚本指向根目录配置
3. **模块映射**: 所有包都在根目录配置中有映射
4. **依赖管理**: 包含所有必需的测试依赖
5. **测试文件**: 正确的语法和类型断言

遵循这个配置方法可以避免大部分测试配置问题，提高开发效率。

---

**最后更新**: 2024-01-01  
**维护者**: AI开发团队  
**状态**: 所有包已正确配置测试环境
