# 测试配置指南

## 概述

本文档总结了Aiofix AI SAAS平台项目中各个包的测试配置方法，避免因配置问题影响开发进度。本指南涵盖了包配置、构建输出、模块引用等关键配置项，确保项目的一致性和可维护性。

## 项目结构

```
aiofix-ai-saas-platform/
├── jest.config.js              # 根目录Jest配置
├── jest.setup.js               # Jest全局设置
├── tsconfig.json               # 根目录TypeScript配置
├── tsconfig.build.json         # 构建配置
└── packages/
    ├── auth/                   # 认证模块 ✅ 已配置
    ├── cache/                  # 缓存模块 ✅ 已配置
    ├── common/                 # 公共模块 ✅ 已配置
    ├── config/                 # 配置模块 ✅ 已配置
    ├── core/                   # 核心模块 ✅ 已配置
    ├── database/               # 数据库模块 ✅ 已配置
    ├── department/             # 部门模块 ✅ 已配置
    ├── logging/                # 日志模块 ✅ 已配置
    ├── notification/           # 通知模块 ✅ 已配置
    │   ├── analytics/          # 通知分析子模块 ✅ 已配置
    │   ├── email/              # 邮件通知子模块 ✅ 已配置
    │   ├── in-app/             # 站内通知子模块 ✅ 已配置
    │   ├── orchestration/      # 通知编排子模块 ✅ 已配置
    │   ├── preferences/        # 通知偏好子模块 ✅ 已配置
    │   ├── push/               # 推送通知子模块 ✅ 已配置
    │   ├── sms/                # 短信通知子模块 ✅ 已配置
    │   └── template/           # 通知模板子模块 ✅ 已配置
    ├── organization/           # 组织模块 ✅ 已配置
    ├── permission/             # 权限模块 ✅ 已配置
    ├── platform/               # 平台模块 ✅ 已配置
    ├── role/                   # 角色模块 ✅ 已配置
    ├── shared/                 # 共享模块 ✅ 已配置
    ├── tenant/                 # 租户模块 ✅ 已配置
    └── user/                   # 用户模块 ✅ 已配置
```

## 包配置标准

### 包配置的重要性

正确的包配置是项目正常运行的基础，包括：

1. **构建输出路径一致性** - 确保 `package.json` 中的 `main` 和 `types` 字段与实际构建输出匹配
2. **模块入口文件** - 每个包都必须有 `src/index.ts` 作为入口文件
3. **TypeScript配置** - 确保 `tsconfig.json` 正确继承构建配置
4. **依赖管理** - 正确配置内部包依赖和外部依赖

### 标准包结构

```
packages/{package-name}/
├── package.json              # 包配置，包含正确的main/types路径
├── tsconfig.json             # TypeScript配置，继承构建配置
├── src/
│   ├── index.ts              # 包入口文件（必需）
│   ├── domain/               # 领域层
│   ├── application/          # 应用层
│   ├── infrastructure/       # 基础设施层
│   └── interfaces/           # 接口层
├── dist/                     # 构建输出目录
│   └── {package-name}/
│       └── src/
│           ├── index.js      # 构建后的入口文件
│           └── index.d.ts    # 类型定义文件
└── tests/                    # 测试文件
```

### 标准package.json配置

```json
{
  "name": "@aiofix/{package-name}",
  "version": "1.0.0",
  "description": "包描述",
  "main": "dist/{package-name}/src/index.js",
  "types": "dist/{package-name}/src/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist",
    "test": "jest --config ../../jest.config.js",
    "test:watch": "jest --config ../../jest.config.js --watch",
    "test:coverage": "jest --config ../../jest.config.js --coverage"
  },
  "dependencies": {
    "@aiofix/core": "workspace:*",
    "@aiofix/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^22.16.0",
    "jest": "^30.1.3",
    "ts-jest": "^29.4.1",
    "typescript": "~5.9.2"
  }
}
```

### 标准tsconfig.json配置

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**重要说明：**

- 子包继承根目录的 `tsconfig.json`（包含路径映射）
- 子包覆盖 `noEmit: false` 以启用构建输出
- **不要**在子包中重复定义 `paths` 配置，因为根目录已经提供了完整的路径映射
- 这样既保持了路径映射，又确保了构建功能，同时避免了配置重复

### 标准src/index.ts配置

```typescript
/**
 * @fileoverview {包名}模块入口文件
 * 导出{包名}相关的所有公共API
 */

// 导出值对象
export * from './domain/value-objects';

// 导出枚举
export * from './domain/enums';

// 导出聚合根
export * from './domain/aggregates';

// 导出事件
export * from './domain/events';

// 导出服务
export * from './application/services';

// 导出接口
export * from './interfaces';
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
    // 核心包
    '^@aiofix/core$': '<rootDir>/packages/core/src',
    '^@aiofix/shared$': '<rootDir>/packages/shared/src',
    '^@aiofix/common$': '<rootDir>/packages/common/src',

    // 基础设施包
    '^@aiofix/logging$': '<rootDir>/packages/logging/src',
    '^@aiofix/config$': '<rootDir>/packages/config/src',
    '^@aiofix/database$': '<rootDir>/packages/database/src',
    '^@aiofix/cache$': '<rootDir>/packages/cache/src',
    '^@aiofix/platform$': '<rootDir>/packages/platform/src',

    // 业务包
    '^@aiofix/auth$': '<rootDir>/packages/auth/src',
    '^@aiofix/user$': '<rootDir>/packages/user/src',
    '^@aiofix/tenant$': '<rootDir>/packages/tenant/src',
    '^@aiofix/organization$': '<rootDir>/packages/organization/src',
    '^@aiofix/department$': '<rootDir>/packages/department/src',
    '^@aiofix/role$': '<rootDir>/packages/role/src',
    '^@aiofix/permission$': '<rootDir>/packages/permission/src',

    // 通知子模块
    '^@aiofix/notif-analytics$':
      '<rootDir>/packages/notification/analytics/src',
    '^@aiofix/notif-email$': '<rootDir>/packages/notification/email/src',
    '^@aiofix/notif-in-app$': '<rootDir>/packages/notification/in-app/src',
    '^@aiofix/notif-orchestration$':
      '<rootDir>/packages/notification/orchestration/src',
    '^@aiofix/notif-preferences$':
      '<rootDir>/packages/notification/preferences/src',
    '^@aiofix/notif-push$': '<rootDir>/packages/notification/push/src',
    '^@aiofix/notif-sms$': '<rootDir>/packages/notification/sms/src',
    '^@aiofix/notif-template$': '<rootDir>/packages/notification/template/src',

    // 通用映射（放在最后）
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
      // 核心包
      "@aiofix/core": ["packages/core/src"],
      "@aiofix/shared": ["packages/shared/src"],
      "@aiofix/common": ["packages/common/src"],

      // 基础设施包
      "@aiofix/logging": ["packages/logging/src"],
      "@aiofix/config": ["packages/config/src"],
      "@aiofix/database": ["packages/database/src"],
      "@aiofix/cache": ["packages/cache/src"],
      "@aiofix/platform": ["packages/platform/src"],

      // 业务包
      "@aiofix/auth": ["packages/auth/src"],
      "@aiofix/user": ["packages/user/src"],
      "@aiofix/tenant": ["packages/tenant/src"],
      "@aiofix/organization": ["packages/organization/src"],
      "@aiofix/department": ["packages/department/src"],
      "@aiofix/role": ["packages/role/src"],
      "@aiofix/permission": ["packages/permission/src"],

      // 通知子模块
      "@aiofix/notif-analytics": ["packages/notification/analytics/src"],
      "@aiofix/notif-email": ["packages/notification/email/src"],
      "@aiofix/notif-in-app": ["packages/notification/in-app/src"],
      "@aiofix/notif-orchestration": [
        "packages/notification/orchestration/src"
      ],
      "@aiofix/notif-preferences": ["packages/notification/preferences/src"],
      "@aiofix/notif-push": ["packages/notification/push/src"],
      "@aiofix/notif-sms": ["packages/notification/sms/src"],
      "@aiofix/notif-template": ["packages/notification/template/src"],

      // 通用映射（放在最后）
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

### 1. 包配置问题

#### 1.1 构建输出路径不匹配

**问题**: `Cannot find module '@aiofix/xxx'` 或 `Module not found`
**原因**: `package.json` 中的 `main` 和 `types` 字段与实际构建输出不匹配
**解决**:

```bash
# 检查实际构建输出
ls -la packages/{package-name}/dist/

# 修复package.json
# 将 main: "dist/index.js" 改为 main: "dist/{package-name}/src/index.js"
# 将 types: "dist/index.d.ts" 改为 types: "dist/{package-name}/src/index.d.ts"
```

#### 1.2 缺少入口文件

**问题**: `Cannot find module './src/index'`
**原因**: 包缺少 `src/index.ts` 入口文件
**解决**: 创建 `src/index.ts` 文件并导出所有公共API

#### 1.3 TypeScript配置继承错误

**问题**: `Cannot find module '@aiofix/core'` 或类型定义文件未生成
**原因**: 子包的 `tsconfig.json` 配置不正确，导致无法使用路径映射或无法生成类型文件
**解决**:

```json
{
  "extends": "../../tsconfig.json", // 继承根目录配置（包含路径映射）
  "compilerOptions": {
    "outDir": "./dist",
    "noEmit": false // 覆盖根目录的 noEmit: true
  }
}
```

**配置层次结构：**

1. `tsconfig.build.json` - 基础构建配置
2. `tsconfig.json` - 开发配置（继承基础配置 + 路径映射 + noEmit: true）
3. 子包配置 - 继承开发配置但覆盖 noEmit: false

**避免配置重复：**

- 子包**不要**重复定义 `paths` 配置
- 根目录的 `tsconfig.json` 已经提供了完整的路径映射
- 重复的 `paths` 配置会导致维护困难和潜在冲突

### 2. Jest配置问题

#### 2.1 Jest使用Babel而不是ts-jest

**问题**: 错误信息显示 `@babel/parser` 而不是 `ts-jest`
**原因**: 包级别的测试脚本没有指定配置文件路径
**解决**: 在package.json的测试脚本中添加 `--config ../../jest.config.js`

#### 2.2 模块映射错误

**问题**: `Cannot resolve module '@aiofix/xxx'`
**原因**: 根目录jest.config.js中缺少模块映射
**解决**: 在moduleNameMapper中添加对应的映射

#### 2.3 Jest配置警告

**问题**: `Unknown option "babelConfig" with value false`
**原因**: Jest不识别babelConfig选项
**解决**: 注释掉或删除babelConfig配置

### 3. TypeScript类型问题

#### 3.1 类型定义文件未生成

**问题**: `Cannot find module '@aiofix/core' or its corresponding type declarations`
**原因**: 依赖包的类型定义文件未生成或路径不正确
**解决**:

```bash
# 重新构建依赖包
cd packages/core && pnpm build
cd packages/shared && pnpm build

# 检查类型定义文件是否存在
ls -la packages/core/dist/core/src/index.d.ts
```

#### 3.2 类型断言错误

**问题**: `Type 'unknown' is not assignable to type 'xxx'`
**原因**: 测试文件中使用了不正确的类型断言
**解决**: 使用 `as any` 替代 `as unknown`

#### 3.3 测试文件语法错误

**问题**: `Missing semicolon` 或 `Unexpected token`
**原因**: Jest无法正确解析TypeScript语法
**解决**: 确保测试文件头部包含正确的Jest类型引用

### 4. 依赖管理问题

#### 4.1 内部包依赖未正确配置

**问题**: `Cannot resolve module '@aiofix/shared'`
**原因**: 包的 `package.json` 中缺少内部包依赖
**解决**: 在 `dependencies` 中添加 `"@aiofix/shared": "workspace:*"`

#### 4.2 循环依赖

**问题**: `Circular dependency detected`
**原因**: 包之间存在循环依赖
**解决**: 重构代码结构，消除循环依赖

### 5. 构建问题

#### 5.1 构建失败

**问题**: `TypeScript compilation failed`
**原因**: 代码中存在类型错误或语法错误
**解决**: 修复代码中的错误，确保所有类型都正确

#### 5.2 构建输出结构不正确

**问题**: 构建输出不是预期的 `dist/{package-name}/src/` 结构
**原因**: `tsconfig.json` 配置不正确
**解决**: 确保 `tsconfig.json` 正确配置 `outDir` 和 `rootDir`

## 新包配置检查清单

创建新包时，请按以下清单检查配置：

### 包基础配置

- [ ] 创建 `src/index.ts` 入口文件
- [ ] 在 `package.json` 中配置正确的 `main` 和 `types` 路径
- [ ] 在 `package.json` 中配置测试脚本（包含 `--config ../../jest.config.js`）
- [ ] 在 `package.json` 中添加必需的测试依赖
- [ ] 创建 `tsconfig.json` 并继承 `../../tsconfig.json`，覆盖 `noEmit: false`

### 根目录配置

- [ ] 在根目录 `jest.config.js` 中添加模块映射
- [ ] 在根目录 `tsconfig.json` 中添加路径映射

### 测试配置

- [ ] 测试文件头部包含正确的Jest类型引用
- [ ] 测试文件中的类型断言使用 `as any`
- [ ] 运行 `pnpm test` 验证配置正确

### 构建验证

- [ ] 运行 `pnpm build` 验证构建成功
- [ ] 检查构建输出结构是否为 `dist/{package-name}/src/`
- [ ] 验证类型定义文件是否正确生成

### 依赖验证

- [ ] 检查内部包依赖是否正确配置
- [ ] 验证包引用是否正常工作
- [ ] 运行测试确保所有依赖都能正确解析

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
