import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';
import {
  TemplateType,
  TemplateTypeValidator,
} from '../value-objects/template-type.vo';
import { TemplateStatus } from '../value-objects/template-status.vo';
import {
  TemplateVariable,
  VariableType,
} from '../value-objects/template-variable.vo';
import { TemplateContent } from '../value-objects/template-content.vo';

/**
 * @class TemplateService
 * @description
 * 模板领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调模板和用户权限之间的业务规则
 * 2. 处理模板和租户设置之间的关联关系
 * 3. 管理模板渲染的复杂计算逻辑
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的模板计算逻辑
 * 2. 提供可重用的模板规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 *
 * @example
 * ```typescript
 * const templateService = new TemplateService();
 * const canCreate = templateService.canCreateTemplate(userId, tenantId, type);
 * const renderedContent = templateService.renderTemplate(content, variables);
 * ```
 * @since 1.0.0
 */
export class TemplateService {
  private readonly typeValidator = new TemplateTypeValidator();

  /**
   * @method canCreateTemplate
   * @description 判断是否可以创建模板，跨聚合权限计算
   * @param {UserId} userId 用户ID
   * @param {TenantId} tenantId 租户ID
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否可以创建
   *
   * 业务逻辑：
   * 1. 检查用户是否属于指定租户
   * 2. 验证用户模板创建权限
   * 3. 检查租户模板策略
   * 4. 考虑模板类型限制
   */
  public canCreateTemplate(
    userId: UserId,
    tenantId: TenantId,
    type: TemplateType,
  ): boolean {
    // 基础验证
    if (!userId || !tenantId || !type) {
      return false;
    }

    // 检查模板类型是否被允许
    if (this.isRestrictedTemplateType(type)) {
      return false;
    }

    // 检查租户模板策略
    if (!this.isTenantTemplateEnabled(tenantId, type)) {
      return false;
    }

    return true;
  }

  /**
   * @method validateTemplateContent
   * @description 验证模板内容的合法性
   * @param {TemplateContent} content 模板内容
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否合法
   */
  public validateTemplateContent(
    content: TemplateContent,
    type: TemplateType,
  ): boolean {
    // 基础内容验证
    if (!content) {
      return false;
    }

    // 根据类型验证内容格式
    if (!content.validateForType(type)) {
      return false;
    }

    return true;
  }

  /**
   * @method validateTemplateVariables
   * @description 验证模板变量的合法性
   * @param {TemplateVariable[]} variables 模板变量列表
   * @param {TemplateContent} content 模板内容
   * @returns {boolean} 是否合法
   */
  public validateTemplateVariables(
    variables: TemplateVariable[],
    content: TemplateContent,
  ): boolean {
    // 检查变量名称唯一性
    const variableNames = variables.map(v => v.name);
    const uniqueNames = new Set(variableNames);
    if (variableNames.length !== uniqueNames.size) {
      return false;
    }

    // 检查内容中使用的变量是否都已定义
    const contentVariables = this.extractVariablesFromContent(content);
    for (const varName of contentVariables) {
      if (!variables.some(v => v.name === varName)) {
        return false;
      }
    }

    return true;
  }

  /**
   * @method renderTemplate
   * @description 渲染模板内容，替换变量
   * @param {TemplateContent} content 模板内容
   * @param {Record<string, any>} variables 变量值
   * @returns {TemplateContent} 渲染后的内容
   */
  public renderTemplate(
    content: TemplateContent,
    variables: Record<string, any>,
  ): TemplateContent {
    const renderedTitle = this.renderText(content.title, variables);
    const renderedHtml = this.renderText(content.htmlContent, variables);
    const renderedText = this.renderText(content.textContent, variables);
    const renderedJson = this.renderText(content.jsonContent, variables);

    return TemplateContent.create(
      renderedTitle,
      renderedHtml,
      renderedText,
      renderedJson,
      content.variables,
    );
  }

  /**
   * @method extractVariablesFromContent
   * @description 从模板内容中提取变量名称
   * @param {TemplateContent} content 模板内容
   * @returns {string[]} 变量名称列表
   */
  public extractVariablesFromContent(content: TemplateContent): string[] {
    const variables = new Set<string>();

    // 从所有内容中提取变量
    const allContent = [
      content.title,
      content.htmlContent,
      content.textContent,
      content.jsonContent,
    ].join(' ');

    // 匹配 {{variableName}} 格式的变量
    const variableRegex = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;
    let match;

    while ((match = variableRegex.exec(allContent)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * @method validateTemplateName
   * @description 验证模板名称的合法性
   * @param {string} name 模板名称
   * @param {TenantId} tenantId 租户ID
   * @returns {boolean} 是否合法
   */
  public validateTemplateName(name: string, tenantId: TenantId): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return false;
    }

    if (trimmedName.length > 100) {
      return false;
    }

    // 验证名称格式（只能包含字母、数字、连字符、下划线）
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(trimmedName)) {
      return false;
    }

    return true;
  }

  /**
   * @method canPublishTemplate
   * @description 判断是否可以发布模板
   * @param {TemplateContent} content 模板内容
   * @param {TemplateVariable[]} variables 模板变量
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否可以发布
   */
  public canPublishTemplate(
    content: TemplateContent,
    variables: TemplateVariable[],
    type: TemplateType,
  ): boolean {
    // 验证内容
    if (!this.validateTemplateContent(content, type)) {
      return false;
    }

    // 验证变量
    if (!this.validateTemplateVariables(variables, content)) {
      return false;
    }

    // 检查必需字段
    const requiredFields = this.typeValidator.getRequiredFields(type);
    for (const field of requiredFields) {
      if (!this.hasRequiredField(content, field)) {
        return false;
      }
    }

    return true;
  }

  /**
   * @method getTemplateUsageStats
   * @description 获取模板使用统计信息
   * @param {string} templateId 模板ID
   * @param {TenantId} tenantId 租户ID
   * @returns {object} 使用统计信息
   */
  public getTemplateUsageStats(templateId: string, tenantId: TenantId): object {
    // 简化实现，实际应该查询数据库
    return {
      templateId,
      tenantId: tenantId.value,
      usageCount: 0,
      lastUsedAt: null,
      averageUsagePerDay: 0,
    };
  }

  /**
   * @method isRestrictedTemplateType
   * @description 检查模板类型是否受限制
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否受限制
   * @private
   */
  private isRestrictedTemplateType(type: TemplateType): boolean {
    // 定义受限制的模板类型
    const restrictedTypes: TemplateType[] = [
      // 可以根据业务需求添加受限制的类型
    ];

    return restrictedTypes.includes(type);
  }

  /**
   * @method isTenantTemplateEnabled
   * @description 检查租户是否启用模板功能
   * @param {TenantId} tenantId 租户ID
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否启用
   * @private
   */
  private isTenantTemplateEnabled(
    _tenantId: TenantId,
    _type: TemplateType,
  ): boolean {
    // 简化实现，实际应该查询租户设置
    return true;
  }

  /**
   * @method renderText
   * @description 渲染文本内容，替换变量
   * @param {string} text 原始文本
   * @param {Record<string, any>} variables 变量值
   * @returns {string} 渲染后的文本
   * @private
   */
  private renderText(text: string, variables: Record<string, any>): string {
    if (!text) {
      return text;
    }

    let rendered = text;

    // 替换模板变量 {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });

    return rendered;
  }

  /**
   * @method hasRequiredField
   * @description 检查是否包含必需字段
   * @param {TemplateContent} content 模板内容
   * @param {string} field 字段名称
   * @returns {boolean} 是否包含必需字段
   * @private
   */
  private hasRequiredField(content: TemplateContent, field: string): boolean {
    switch (field) {
      case 'title':
        return content.title.length > 0;
      case 'htmlContent':
        return content.htmlContent.length > 0;
      case 'textContent':
        return content.textContent.length > 0;
      case 'content':
        return content.textContent.length > 0 || content.htmlContent.length > 0;
      default:
        return false;
    }
  }
}
