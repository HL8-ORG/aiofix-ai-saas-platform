# ESLint配置指南 - 分层控制策略

## 概述

本文档详细说明了项目中ESLint的分层控制策略，包括全局配置、包级配置和领域层特殊规则。通过分层控制，我们可以在不同层次应用不同严格程度的代码质量规则。

## 配置层次结构

```
project-root/
├── eslint.config.mjs              # 全局基础配置
├── packages/
│   ├── user/
│   │   ├── eslint.config.mjs      # 用户模块配置（分层控制）
│   │   └── src/
│   │       ├── domain/            # 领域层（最严格）
│   │       ├── application/       # 应用层（中等严格）
│   │       ├── infrastructure/    # 基础设施层（相对宽松）
│   │       └── interfaces/        # 接口层（中等严格）
│   ├── core/
│   │   ├── eslint.config.mjs      # 核心模块配置
│   │   └── src/
│   │       ├── domain/            # 领域层（最严格）
│   │       └── application/       # 应用层（中等严格）
│   ├── common/
│   │   ├── eslint.config.mjs      # 通用模块配置
│   │   └── src/
│   ├── logging/
│   │   ├── eslint.config.mjs      # 日志模块配置
│   │   └── src/
│   └── ...
```

## 分层控制策略

### 1. 全局配置 (`eslint.config.mjs`)

**用途**: 提供基础规则和通用配置
**严格程度**: 中等

```javascript
// 基础规则
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/no-unsafe-assignment': 'warn',
'@typescript-eslint/no-unsafe-call': 'warn',
'@typescript-eslint/no-unsafe-member-access': 'warn',
'@typescript-eslint/no-unsafe-return': 'warn',
'@typescript-eslint/no-unsafe-argument': 'warn',
```

### 2. 包级配置 (`packages/*/eslint.config.mjs`)

**用途**: 继承全局配置 + 包特定规则
**严格程度**: 根据包类型调整

#### **领域模块** (user, core)

- **领域层**: 最严格规则
- **应用层**: 中等严格规则
- **基础设施层**: 相对宽松规则
- **接口层**: 中等严格规则

#### **基础模块** (common, logging, config)

- **通用规则**: 严格规则
- **测试文件**: 宽松规则

### 3. 领域层特殊规则

**用途**: 对业务核心代码执行最严格的规则控制
**严格程度**: 最高

```javascript
// 领域层绝对禁止的规则
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/no-unsafe-assignment': 'error',
'@typescript-eslint/no-unsafe-call': 'error',
'@typescript-eslint/no-unsafe-member-access': 'error',
'@typescript-eslint/no-unsafe-return': 'error',
'@typescript-eslint/no-unsafe-argument': 'error',

// 类型安全规则
'@typescript-eslint/strict-boolean-expressions': 'error',
'@typescript-eslint/prefer-nullish-coalescing': 'error',
'@typescript-eslint/prefer-optional-chain': 'error',
'@typescript-eslint/no-unnecessary-condition': 'error',
'@typescript-eslint/no-unnecessary-type-assertion': 'error',
'@typescript-eslint/no-non-null-assertion': 'error',

// 函数和类规则
'@typescript-eslint/explicit-function-return-type': 'error',
'@typescript-eslint/explicit-member-accessibility': 'error',
'@typescript-eslint/no-empty-function': 'error',
'@typescript-eslint/no-empty-interface': 'error',
```

## 规则严格程度对比

| 规则类型                        | 全局 | 领域层 | 应用层 | 基础设施层 | 接口层 | 测试文件 |
| ------------------------------- | ---- | ------ | ------ | ---------- | ------ | -------- |
| `no-explicit-any`               | warn | error  | warn   | warn       | warn   | off      |
| `no-unsafe-assignment`          | warn | error  | warn   | warn       | warn   | off      |
| `no-unsafe-call`                | warn | error  | warn   | warn       | warn   | off      |
| `no-unsafe-member-access`       | warn | error  | warn   | warn       | warn   | off      |
| `no-unsafe-return`              | warn | error  | warn   | warn       | warn   | off      |
| `no-unsafe-argument`            | warn | error  | warn   | warn       | warn   | off      |
| `explicit-function-return-type` | -    | error  | warn   | -          | warn   | -        |
| `explicit-member-accessibility` | -    | error  | warn   | -          | -      | -        |
| `no-console`                    | -    | error  | warn   | off        | warn   | off      |
| `no-debugger`                   | -    | error  | error  | warn       | error  | warn     |

## 命名约定规则

### 领域层命名约定

```javascript
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'class',
    format: ['PascalCase'],
    suffix: ['Aggregate', 'Entity', 'ValueObject', 'Service', 'Repository', 'Event', 'Command', 'Query'],
  },
  {
    selector: 'interface',
    format: ['PascalCase'],
    prefix: ['I'],
  },
  {
    selector: 'enum',
    format: ['PascalCase'],
  },
  {
    selector: 'enumMember',
    format: ['UPPER_CASE'],
  },
],
```

### 核心模块命名约定

```javascript
'@typescript-eslint/naming-convention': [
  'error',
  {
    selector: 'class',
    format: ['PascalCase'],
    suffix: ['AggregateRoot', 'ValueObject', 'DomainEvent', 'Service', 'Repository', 'Interface'],
  },
  {
    selector: 'interface',
    format: ['PascalCase'],
    prefix: ['I'],
  },
  {
    selector: 'enum',
    format: ['PascalCase'],
  },
  {
    selector: 'enumMember',
    format: ['UPPER_CASE'],
  },
],
```

## 配置继承机制

### 1. 继承全局配置

```javascript
export default [
  // 继承根目录配置
  {
    extends: ['../../eslint.config.mjs'],
  },

  // 基础配置
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  // 包特定规则...
];
```

### 2. 文件模式匹配

```javascript
// 领域层规则
{
  files: ['src/domain/**/*.ts'],
  rules: {
    // 最严格的规则...
  },
},

// 应用层规则
{
  files: ['src/application/**/*.ts'],
  rules: {
    // 中等严格的规则...
  },
},

// 测试文件规则
{
  files: ['**/*.spec.ts', '**/*.test.ts'],
  rules: {
    // 宽松的规则...
  },
},
```

## 使用指南

### 1. 开发流程

1. **编写代码** - 遵循对应层次的规则
2. **运行检查** - 使用包级ESLint配置
3. **修复错误** - 根据规则严格程度修复
4. **提交代码** - 确保通过所有检查

### 2. 命令使用

```bash
# 检查特定包
cd packages/user && pnpm lint

# 修复特定包
cd packages/user && pnpm lint:fix

# 检查特定文件
cd packages/user && npx eslint src/domain/**/*.ts

# 检查特定规则
cd packages/user && npx eslint src/domain/**/*.ts --rule '@typescript-eslint/no-explicit-any:error'
```

### 3. 规则调整

#### **临时禁用规则**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getData();
```

#### **文件级禁用规则**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// 整个文件的代码...
```

#### **永久调整规则**

修改对应包的 `eslint.config.mjs` 文件中的规则配置。

## 最佳实践

### 1. 规则选择原则

- **领域层**: 选择最严格的规则，确保业务逻辑正确性
- **应用层**: 选择中等严格的规则，平衡开发效率和代码质量
- **基础设施层**: 选择相对宽松的规则，允许必要的技术实现
- **测试文件**: 选择宽松的规则，专注于测试逻辑而非代码质量

### 2. 错误处理策略

- **Error级别**: 必须修复，否则构建失败
- **Warn级别**: 建议修复，但不影响构建
- **Off级别**: 完全禁用规则

### 3. 团队协作

- **统一标准**: 所有团队成员使用相同的配置
- **代码审查**: 在PR中检查ESLint规则遵守情况
- **持续改进**: 根据项目需要调整规则严格程度

## 故障排除

### 问题1: 规则冲突

**错误**: 不同层次的规则产生冲突

**解决方案**:

1. 检查规则继承顺序
2. 确认文件模式匹配正确
3. 调整规则优先级

### 问题2: 规则过于严格

**错误**: 开发效率受到影响

**解决方案**:

1. 调整对应层次的规则严格程度
2. 使用临时禁用注释
3. 考虑重构代码结构

### 问题3: 规则不够严格

**错误**: 代码质量不达标

**解决方案**:

1. 提高对应层次的规则严格程度
2. 添加额外的自定义规则
3. 加强代码审查流程

## 总结

分层控制策略通过在不同层次应用不同严格程度的规则，实现了：

- ✅ **业务逻辑保护** - 领域层最严格的规则确保业务正确性
- ✅ **开发效率平衡** - 其他层次相对宽松的规则提高开发效率
- ✅ **代码质量保证** - 全局规则确保整体代码质量
- ✅ **团队协作友好** - 清晰的规则层次便于团队理解和遵守

**记住**: 领域层 > 应用层 > 基础设施层 > 测试文件的规则严格程度！

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
