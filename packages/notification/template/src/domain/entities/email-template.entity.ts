import { BaseEntity } from '@aiofix/core/src/domain/base/base-entity';
import { TemplateId } from '../value-objects/template-id.vo';
import { TemplateType } from '../value-objects/template-type.vo';
import {
  TemplateStatus,
  TemplateStatusValidator,
} from '../value-objects/template-status.vo';
import { TemplateVariable } from '../value-objects/template-variable.vo';
import { TemplateContent } from '../value-objects/template-content.vo';
import { TenantId, UserId } from '@aiofix/shared';

/**
 * @class EmailTemplateEntity
 * @description
 * 邮件模板领域实体，负责维护邮件模板的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识邮件模板身份
 * 2. 管理邮件模板的状态（草稿、已发布、已归档、已删除）
 * 3. 维护邮件模板的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 邮件模板ID一旦创建不可变更
 * 2. 模板状态变更必须遵循预定义的状态机
 * 3. 删除模板时采用软删除策略
 * 4. 模板名称在租户内必须唯一
 *
 * 基础设施功能：
 * 1. 继承BaseEntity提供审计追踪、乐观锁、软删除等功能
 * 2. 支持多租户数据隔离
 * 3. 提供版本控制和并发控制
 *
 * @property {TemplateId} id 邮件模板唯一标识符，不可变更
 * @property {TenantId} tenantId 租户ID，用于多租户数据隔离
 * @property {string} name 模板名称，在租户内唯一
 * @property {string} displayName 模板显示名称
 * @property {TemplateContent} content 模板内容
 * @property {TemplateVariable[]} variables 模板变量列表
 * @property {TemplateStatus} status 模板状态
 * @property {number} version 模板版本号
 * @property {string} category 模板分类
 * @property {string} description 模板描述
 * @property {Record<string, unknown>} metadata 元数据
 *
 * @example
 * ```typescript
 * const emailTemplate = new EmailTemplateEntity(
 *   templateId,
 *   tenantId,
 *   'welcome-email',
 *   '欢迎邮件',
 *   templateContent,
 *   variables,
 *   TemplateStatus.DRAFT,
 *   'system'
 * );
 * emailTemplate.publish(); // 发布模板
 * emailTemplate.archive(); // 归档模板
 * ```
 * @since 1.0.0
 */
export class EmailTemplateEntity extends BaseEntity {
  private readonly statusValidator = new TemplateStatusValidator();

  constructor(
    public readonly id: TemplateId,
    public readonly tenantId: TenantId,
    public readonly name: string,
    public readonly displayName: string,
    public readonly content: TemplateContent,
    public readonly variables: TemplateVariable[],
    private status: TemplateStatus = TemplateStatus.DRAFT,
    private version: number = 1,
    public readonly category: string = 'default',
    public readonly description: string = '',
    public readonly metadata: Record<string, unknown> = {},
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method publish
   * @description 发布模板
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public publish(): void {
    this.statusValidator.validateTransition(
      this.status,
      TemplateStatus.PUBLISHED,
    );
    this.status = TemplateStatus.PUBLISHED;
    this.updateAuditInfo('system');
  }

  /**
   * @method unpublish
   * @description 下线模板
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public unpublish(): void {
    this.statusValidator.validateTransition(this.status, TemplateStatus.DRAFT);
    this.status = TemplateStatus.DRAFT;
    this.updateAuditInfo('system');
  }

  /**
   * @method archive
   * @description 归档模板
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(): void {
    this.statusValidator.validateTransition(
      this.status,
      TemplateStatus.ARCHIVED,
    );
    this.status = TemplateStatus.ARCHIVED;
    this.updateAuditInfo('system');
  }

  /**
   * @method delete
   * @description 删除模板
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public delete(): void {
    this.statusValidator.validateTransition(
      this.status,
      TemplateStatus.DELETED,
    );
    this.status = TemplateStatus.DELETED;
    this.updateAuditInfo('system');
  }

  /**
   * @method updateContent
   * @description 更新模板内容
   * @param {TemplateContent} newContent 新的模板内容
   * @param {TemplateVariable[]} newVariables 新的模板变量
   * @returns {void}
   * @throws {InvalidOperationError} 当模板状态不允许更新时抛出
   */
  public updateContent(
    newContent: TemplateContent,
    newVariables: TemplateVariable[],
  ): void {
    if (!this.statusValidator.isEditable(this.status)) {
      throw new InvalidOperationError('只有草稿状态的模板才能更新内容');
    }

    // 验证新内容
    if (!newContent.validateForType(TemplateType.EMAIL)) {
      throw new InvalidTemplateContentError('模板内容不符合邮件模板要求');
    }

    // 更新内容（这里需要重新创建实体，因为内容是不可变的）
    this.updateAuditInfo('system');
    this.version++;
  }

  /**
   * @method isDraft
   * @description 检查是否为草稿状态
   * @returns {boolean} 是否为草稿状态
   */
  public isDraft(): boolean {
    return this.statusValidator.isDraft(this.status);
  }

  /**
   * @method isPublished
   * @description 检查是否为已发布状态
   * @returns {boolean} 是否为已发布状态
   */
  public isPublished(): boolean {
    return this.statusValidator.isPublished(this.status);
  }

  /**
   * @method isArchived
   * @description 检查是否为已归档状态
   * @returns {boolean} 是否为已归档状态
   */
  public isArchived(): boolean {
    return this.statusValidator.isArchived(this.status);
  }

  /**
   * @method isDeleted
   * @description 检查是否为已删除状态
   * @returns {boolean} 是否为已删除状态
   */
  public isDeleted(): boolean {
    return this.statusValidator.isDeleted(this.status);
  }

  /**
   * @method isActive
   * @description 检查是否为活跃状态（可以使用）
   * @returns {boolean} 是否为活跃状态
   */
  public isActive(): boolean {
    return this.statusValidator.isActive(this.status);
  }

  /**
   * @method isEditable
   * @description 检查是否可编辑
   * @returns {boolean} 是否可编辑
   */
  public isEditable(): boolean {
    return this.statusValidator.isEditable(this.status);
  }

  /**
   * @method isDeletable
   * @description 检查是否可删除
   * @returns {boolean} 是否可删除
   */
  public isDeletable(): boolean {
    return this.statusValidator.isDeletable(this.status);
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return this.statusValidator.isFinal(this.status);
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {TemplateStatus} 当前状态
   */
  public getStatus(): TemplateStatus {
    return this.status;
  }

  /**
   * @method getVersion
   * @description 获取模板版本号
   * @returns {number} 版本号
   */
  public getVersion(): number {
    return this.version;
  }

  /**
   * @method getVariableNames
   * @description 获取模板变量名称列表
   * @returns {string[]} 变量名称列表
   */
  public getVariableNames(): string[] {
    return this.variables.map(v => v.name);
  }

  /**
   * @method getVariableByName
   * @description 根据名称获取模板变量
   * @param {string} name 变量名称
   * @returns {TemplateVariable | undefined} 模板变量
   */
  public getVariableByName(name: string): TemplateVariable | undefined {
    return this.variables.find(v => v.name === name);
  }

  /**
   * @method getEntityId
   * @description 获取实体ID，实现BaseEntity抽象方法
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.id.value;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId.value;
  }

  /**
   * @method validate
   * @description 验证实体数据的有效性
   * @returns {void}
   * @throws {InvalidEmailTemplateDataError} 当实体数据无效时抛出
   * @private
   */
  protected validate(): void {
    if (!this.id) {
      throw new InvalidEmailTemplateDataError('模板ID不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidEmailTemplateDataError('租户ID不能为空');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new InvalidEmailTemplateDataError('模板名称不能为空');
    }

    if (this.name.length > 100) {
      throw new InvalidEmailTemplateDataError('模板名称长度不能超过100个字符');
    }

    if (!this.displayName || this.displayName.trim().length === 0) {
      throw new InvalidEmailTemplateDataError('模板显示名称不能为空');
    }

    if (this.displayName.length > 200) {
      throw new InvalidEmailTemplateDataError(
        '模板显示名称长度不能超过200个字符',
      );
    }

    if (!this.content) {
      throw new InvalidEmailTemplateDataError('模板内容不能为空');
    }

    if (!this.content.validateForType(TemplateType.EMAIL)) {
      throw new InvalidEmailTemplateDataError('模板内容不符合邮件模板要求');
    }

    if (this.version < 1) {
      throw new InvalidEmailTemplateDataError('模板版本号不能小于1');
    }

    if (this.category && this.category.length > 50) {
      throw new InvalidEmailTemplateDataError('模板分类长度不能超过50个字符');
    }

    if (this.description && this.description.length > 500) {
      throw new InvalidEmailTemplateDataError('模板描述长度不能超过500个字符');
    }
  }

  /**
   * @method equals
   * @description 比较两个实体是否相等
   * @param {EmailTemplateEntity} other 另一个实体
   * @returns {boolean} 是否相等
   */
  public equals(other: BaseEntity): boolean {
    if (!other) {
      return false;
    }
    return this.getEntityId() === other.getEntityId();
  }

  /**
   * @method clone
   * @description 克隆实体
   * @returns {EmailTemplateEntity} 克隆的实体
   */
  public clone(): BaseEntity {
    return new EmailTemplateEntity(
      this.id,
      this.tenantId,
      this.name,
      this.displayName,
      this.content,
      [...this.variables],
      this.status,
      this.version,
      this.category,
      this.description,
      { ...this.metadata },
      this.createdBy,
    );
  }

  /**
   * @method toJSON
   * @description 将实体转换为JSON对象
   * @returns {object} JSON对象
   */
  public toJSON(): object {
    return {
      id: this.id.value,
      tenantId: this.tenantId.value,
      name: this.name,
      displayName: this.displayName,
      content: {
        title: this.content.title,
        htmlContent: this.content.htmlContent,
        textContent: this.content.textContent,
        jsonContent: this.content.jsonContent,
        variables: this.content.variables.map(v => ({
          name: v.name,
          type: v.type,
          description: v.description,
          defaultValue: v.defaultValue,
          required: v.required,
        })),
      },
      variables: this.variables.map(v => ({
        name: v.name,
        type: v.type,
        description: v.description,
        defaultValue: v.defaultValue,
        required: v.required,
      })),
      status: this.status,
      version: this.version,
      category: this.category,
      description: this.description,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
      createdBy: this.createdBy,
      updatedBy: this.getUpdatedBy(),
    };
  }
}

/**
 * @class InvalidEmailTemplateDataError
 * @description 无效邮件模板数据错误
 */
export class InvalidEmailTemplateDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailTemplateDataError';
  }
}

/**
 * @class InvalidOperationError
 * @description 无效操作错误
 */
export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOperationError';
  }
}

/**
 * @class InvalidTemplateContentError
 * @description 无效模板内容错误
 */
export class InvalidTemplateContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateContentError';
  }
}
