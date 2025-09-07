// @ts-check
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 导入根目录的 ESLint 配置
import rootConfig from '../../eslint.config.mjs';

export default [
  // 继承根目录的配置
  ...rootConfig,

  // Notification模块特定的配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // 设置Notification模块的 tsconfig 路径
        project: path.resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
  },

  // 🟢 领域层 - 最严格的类型安全规则
  {
    files: ['src/**/domain/**/*.ts', 'src/**/domain/**/*.tsx'],
    rules: {
      // 严格禁止any类型
      '@typescript-eslint/no-explicit-any': 'error', // 领域层禁止使用any类型
      '@typescript-eslint/no-unsafe-assignment': 'error', // 禁止不安全的赋值操作
      '@typescript-eslint/no-unsafe-call': 'error', // 禁止不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'error', // 禁止不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'error', // 禁止不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'error', // 禁止不安全的参数传递

      // 强制类型安全
      '@typescript-eslint/explicit-function-return-type': 'warn', // 要求函数明确返回类型
      '@typescript-eslint/explicit-module-boundary-types': 'warn', // 要求模块边界明确类型

      // 业务逻辑规则
      '@typescript-eslint/no-non-null-assertion': 'warn', // 警告使用非空断言
      '@typescript-eslint/prefer-readonly': 'warn', // 推荐使用readonly修饰符

      // Notification模块特定规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],

      // 强制实体和值对象的不可变性
      'prefer-const': 'error', // 推荐使用const而不是let
      'no-var': 'error', // 禁止使用var声明
    },
  },

  // 🟡 应用层 - 严格的类型安全规则
  {
    files: ['src/**/application/**/*.ts', 'src/**/application/**/*.tsx'],
    rules: {
      // 严格禁止any类型
      '@typescript-eslint/no-explicit-any': 'error', // 应用层禁止使用any类型
      '@typescript-eslint/no-unsafe-assignment': 'error', // 禁止不安全的赋值操作
      '@typescript-eslint/no-unsafe-call': 'error', // 禁止不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'error', // 禁止不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'error', // 禁止不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'error', // 禁止不安全的参数传递

      // 强制类型安全
      '@typescript-eslint/explicit-function-return-type': 'warn', // 要求函数明确返回类型

      // 允许一些灵活性
      '@typescript-eslint/no-non-null-assertion': 'warn', // 警告使用非空断言

      // 模块特定规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],

      // 强制异步函数处理
      '@typescript-eslint/no-floating-promises': 'error', // 禁止未处理的Promise
      '@typescript-eslint/require-await': 'warn', // 要求异步函数使用await
    },
  },

  // 🟠 基础设施层 - 中等类型安全规则
  {
    files: ['src/**/infrastructure/**/*.ts', 'src/**/infrastructure/**/*.tsx'],
    rules: {
      // 允许any类型，但需要明确标记
      '@typescript-eslint/no-explicit-any': 'warn', // 基础设施层允许any类型（警告级别）
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 警告不安全的赋值操作
      '@typescript-eslint/no-unsafe-call': 'warn', // 警告不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 警告不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'warn', // 警告不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的参数传递

      // 要求类型注释
      '@typescript-eslint/explicit-function-return-type': 'warn', // 要求函数明确返回类型

      // 允许更多灵活性
      '@typescript-eslint/no-non-null-assertion': 'off', // 允许使用非空断言

      // 模块特定规则
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],

      // 通知和外部服务集成规则
      'no-var': 'warn', // 推荐使用const/let而不是var
    },
  },

  // 🟣 接口层 - 特殊规则
  {
    files: ['src/**/interfaces/**/*.ts', 'src/**/interfaces/**/*.tsx'],
    rules: {
      // 接口层允许更多灵活性，但保持基本类型安全
      '@typescript-eslint/no-explicit-any': 'warn', // 接口层允许any类型（警告级别）
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 警告不安全的赋值操作
      '@typescript-eslint/no-unsafe-call': 'warn', // 警告不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 警告不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'warn', // 警告不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的参数传递

      // 接口层特定规则
      '@typescript-eslint/explicit-function-return-type': 'warn', // 要求函数明确返回类型
      '@typescript-eslint/no-non-null-assertion': 'warn', // 警告使用非空断言

      // 允许装饰器使用
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],
    },
  },

  // 🟢 模块共享组件 - 严格规则
  {
    files: [
      'src/**/shared/**/*.ts',
      'src/**/common/**/*.ts',
      'src/**/utils/**/*.ts',
    ],
    rules: {
      // 共享组件需要最严格的类型安全
      '@typescript-eslint/no-explicit-any': 'error', // 共享组件禁止使用any类型
      '@typescript-eslint/no-unsafe-assignment': 'error', // 禁止不安全的赋值操作
      '@typescript-eslint/no-unsafe-call': 'error', // 禁止不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'error', // 禁止不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'error', // 禁止不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'error', // 禁止不安全的参数传递

      // 强制类型安全
      '@typescript-eslint/explicit-function-return-type': 'warn', // 要求函数明确返回类型
      '@typescript-eslint/explicit-module-boundary-types': 'warn', // 要求模块边界明确类型

      // 业务逻辑规则
      '@typescript-eslint/no-non-null-assertion': 'warn', // 警告使用非空断言
      '@typescript-eslint/prefer-readonly': 'warn', // 推荐使用readonly修饰符

      // 共享组件特定规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],
    },
  },
];
