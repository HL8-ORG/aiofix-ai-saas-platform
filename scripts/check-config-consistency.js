#!/usr/bin/env node

/**
 * 配置一致性检查脚本
 *
 * 检查项目中ESLint、Prettier、EditorConfig等配置文件的一致性。
 *
 * @fileoverview 配置一致性检查工具
 * @author AI开发团队
 * @since 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * 配置一致性检查结果
 */
class ConfigConsistencyResult {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.success = true;
  }

  addIssue(message) {
    this.issues.push(message);
    this.success = false;
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  print() {
    console.log('🔍 配置一致性检查结果\n');

    if (this.success && this.warnings.length === 0) {
      console.log('✅ 所有配置都是一致的！');
      return;
    }

    if (this.issues.length > 0) {
      console.log('❌ 发现配置不一致问题：');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  警告：');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log('');
    }
  }
}

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, content: null };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { exists: true, content };
  } catch (error) {
    console.error(`读取文件失败: ${filePath}`, error.message);
    return { exists: false, content: null };
  }
}

/**
 * 解析JSON配置文件
 */
function parseJsonConfig(content) {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * 检查ESLint配置
 */
function checkEslintConfig(result) {
  const eslintConfig = checkFileExists('eslint.config.mjs', 'ESLint配置');

  if (!eslintConfig.exists) {
    result.addIssue('ESLint配置文件不存在');
    return;
  }

  // 检查ESLint配置是否包含Prettier集成
  if (!eslintConfig.content.includes('eslint-plugin-prettier')) {
    result.addWarning('ESLint配置中未找到Prettier插件');
  }

  if (!eslintConfig.content.includes('eslintPluginPrettierRecommended')) {
    result.addWarning('ESLint配置中未找到Prettier推荐配置');
  }
}

/**
 * 检查Prettier配置
 */
function checkPrettierConfig(result) {
  const prettierConfig = checkFileExists('.prettierrc', 'Prettier配置');

  if (!prettierConfig.exists) {
    result.addIssue('Prettier配置文件不存在');
    return;
  }

  const config = parseJsonConfig(prettierConfig.content);
  if (!config) {
    result.addIssue('Prettier配置文件格式无效');
    return;
  }

  // 检查关键配置项
  const expectedConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    useTabs: false,
    trailingComma: 'all',
    printWidth: 80,
    endOfLine: 'lf',
  };

  Object.entries(expectedConfig).forEach(([key, expectedValue]) => {
    if (config[key] !== expectedValue) {
      result.addIssue(
        `Prettier配置中 ${key} 应为 ${expectedValue}，实际为 ${config[key]}`,
      );
    }
  });
}

/**
 * 检查EditorConfig配置
 */
function checkEditorConfig(result) {
  const editorConfig = checkFileExists('.editorconfig', 'EditorConfig配置');

  if (!editorConfig.exists) {
    result.addIssue('EditorConfig配置文件不存在');
    return;
  }

  // 检查关键配置项
  const requiredSettings = [
    'charset = utf-8',
    'end_of_line = lf',
    'indent_style = space',
    'indent_size = 2',
  ];

  requiredSettings.forEach(setting => {
    if (!editorConfig.content.includes(setting)) {
      result.addIssue(`EditorConfig中缺少配置: ${setting}`);
    }
  });
}

/**
 * 检查忽略文件
 */
function checkIgnoreFiles(result) {
  const eslintIgnore = checkFileExists('.eslintignore', 'ESLint忽略文件');
  const prettierIgnore = checkFileExists('.prettierignore', 'Prettier忽略文件');

  if (!eslintIgnore.exists) {
    result.addWarning('ESLint忽略文件不存在');
  }

  if (!prettierIgnore.exists) {
    result.addWarning('Prettier忽略文件不存在');
  }

  // 检查忽略文件内容是否一致
  if (eslintIgnore.exists && prettierIgnore.exists) {
    const eslintIgnores = eslintIgnore.content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'));
    const prettierIgnores = prettierIgnore.content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'));

    const commonIgnores = eslintIgnores.filter(ignore =>
      prettierIgnores.includes(ignore),
    );
    if (commonIgnores.length < eslintIgnores.length * 0.8) {
      result.addWarning('ESLint和Prettier忽略文件内容差异较大');
    }
  }
}

/**
 * 检查Husky配置
 */
function checkHuskyConfig(result) {
  if (!fs.existsSync('.husky')) {
    result.addWarning('Husky配置目录不存在');
    return;
  }

  const preCommit = checkFileExists('.husky/pre-commit', 'Pre-commit钩子');
  const commitMsg = checkFileExists('.husky/commit-msg', 'Commit-msg钩子');

  if (!preCommit.exists) {
    result.addWarning('Pre-commit钩子不存在');
  }

  if (!commitMsg.exists) {
    result.addWarning('Commit-msg钩子不存在');
  }
}

/**
 * 检查VSCode配置
 */
function checkVscodeConfig(result) {
  if (!fs.existsSync('.vscode')) {
    result.addWarning('VSCode配置目录不存在');
    return;
  }

  const settings = checkFileExists('.vscode/settings.json', 'VSCode设置');
  const extensions = checkFileExists(
    '.vscode/extensions.json',
    'VSCode扩展推荐',
  );

  if (!settings.exists) {
    result.addWarning('VSCode设置文件不存在');
  }

  if (!extensions.exists) {
    result.addWarning('VSCode扩展推荐文件不存在');
  }
}

/**
 * 检查Package.json脚本
 */
function checkPackageJsonScripts(result) {
  const packageJson = checkFileExists('package.json', 'Package.json');

  if (!packageJson.exists) {
    result.addIssue('Package.json文件不存在');
    return;
  }

  const config = parseJsonConfig(packageJson.content);
  if (!config || !config.scripts) {
    result.addIssue('Package.json中缺少scripts配置');
    return;
  }

  const requiredScripts = ['lint', 'lint:fix', 'format', 'format:check'];

  requiredScripts.forEach(script => {
    if (!config.scripts[script]) {
      result.addIssue(`Package.json中缺少脚本: ${script}`);
    }
  });
}

/**
 * 主函数
 */
function main() {
  const result = new ConfigConsistencyResult();

  console.log('🔍 开始检查配置一致性...\n');

  // 检查各种配置文件
  checkEslintConfig(result);
  checkPrettierConfig(result);
  checkEditorConfig(result);
  checkIgnoreFiles(result);
  checkHuskyConfig(result);
  checkVscodeConfig(result);
  checkPackageJsonScripts(result);

  // 打印结果
  result.print();

  // 退出码
  process.exit(result.success ? 0 : 1);
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = {
  ConfigConsistencyResult,
  checkFileExists,
  parseJsonConfig,
};
