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

  // Config模块特定的配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // 设置Config模块的 tsconfig 路径
        project: path.resolve(__dirname, './tsconfig.json'),
        tsconfigRootDir: __dirname,
      },
    },
  },

  // 🟢 配置管理 - 严格规则
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // 配置管理需要最严格的类型安全
      '@typescript-eslint/no-explicit-any': 'error', // 配置管理禁止使用any类型
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

      // Config模块特定规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
          caughtErrorsIgnorePattern: '^_', // 允许以下划线开头的未使用错误变量
        },
      ],

      // 强制配置的不可变性
      'prefer-const': 'error', // 推荐使用const而不是let
      'no-var': 'error', // 禁止使用var声明

      // 类型安全规则
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  },
];
