// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'scripts/**/*.js',
      'jest*.config.js',
      'jest*.setup.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        // @ts-ignore
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // 异步函数处理规则
      '@typescript-eslint/no-floating-promises': 'warn', // 防止未处理的Promise
      '@typescript-eslint/require-await': 'off', // 允许非异步函数中的await
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // 允许以下划线开头的未使用参数
          varsIgnorePattern: '^_', // 允许以下划线开头的未使用变量
        },
      ],

      // 类型安全规则 - 默认配置（中等严格）
      '@typescript-eslint/no-explicit-any': 'warn', // 警告使用any类型
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 警告不安全的赋值
      '@typescript-eslint/no-unsafe-call': 'warn', // 警告不安全的函数调用
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 警告不安全的成员访问
      '@typescript-eslint/no-unsafe-return': 'warn', // 警告不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的参数传递

      // 代码质量规则
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // 推荐使用??而不是||
      '@typescript-eslint/prefer-optional-chain': 'warn', // 推荐使用?.链式访问
      '@typescript-eslint/no-unnecessary-condition': 'warn', // 警告不必要的条件判断
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // 警告不必要的类型断言
    },
  },

  // 🔵 配置文件 - 特殊规则
  {
    files: [
      '**/*.config.ts',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/jest.config.*',
      '**/webpack.config.*',
    ],
    rules: {
      // 配置文件允许更多灵活性
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
);
