import { EventSourcedAggregateRoot } from '@aiofix/core';
import { TemplateId } from '../value-objects/template-id.vo';
import { TemplateType } from '../value-objects/template-type.vo';
import { TemplateStatus } from '../value-objects/template-status.vo';
import { TemplateVariable } from '../value-objects/template-variable.vo';
import { TemplateContent } from '../value-objects/template-content.vo';
import { TenantId, UserId } from '@aiofix/shared';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { TemplateCreatedEvent } from '../events/template-created.event';
import { TemplateUpdatedEvent } from '../events/template-updated.event';
import { TemplatePublishedEvent } from '../events/template-published.event';
import { TemplateUnpublishedEvent } from '../events/template-unpublished.event';
import { TemplateDeletedEvent } from '../events/template-deleted.event';

/**
 * @class EmailTemplate
 * @description
 * 邮件模板聚合根，负责管理邮件模板的业务协调、事件发布和事务边界控制。
 *
 * 架构设计：
 * 1. 聚合根继承 EventSourcedAggregateRoot，负责业务协调和事件发布
 * 2. 领域实体继承 BaseEntity，负责状态管理和基础设施功能
 * 3. 通过组合模式实现职责分离
 *
 * 业务协调职责：
 * 1. 协调邮件模板的创建和更新流程
 * 2. 管理模板状态转换的业务规则
 * 3. 处理模板版本控制逻辑
 * 4. 发布领域事件通知其他聚合根
 *
 * 事件发布职责：
 * 1. 在状态变更时发布相应的领域事件
 * 2. 确保事件的数据完整性和一致性
 * 3. 支持事件溯源和状态重建
 *
 * 事务边界控制：
 * 1. 确保邮件模板操作的原子性
 * 2. 管理并发访问和乐观锁控制
 * 3. 处理业务规则验证和异常情况
 *
 * @property {EmailTemplateEntity} emailTemplate 邮件模板领域实体
 *
 * @example
 * ```typescript
 * const emailTemplate = EmailTemplate.create(
 *   tenantId,
 *   'welcome-email',
 *   '欢迎邮件',
 *   templateContent,
 *   variables,
 *   userId
 * );
 * emailTemplate.publish(); // 发布 TemplatePublishedEvent
 * emailTemplate.archive(); // 发布 TemplateArchivedEvent
 * ```
 * @since 1.0.0
 */
export class EmailTemplate extends EventSourcedAggregateRoot {
  private constructor(private emailTemplate: EmailTemplateEntity) {
    super();
  }

  /**
   * @method create
   * @description 创建邮件模板聚合根的静态工厂方法
   * @param {TenantId} tenantId 租户ID
   * @param {string} name 模板名称
   * @param {string} displayName 模板显示名称
   * @param {TemplateContent} content 模板内容
   * @param {TemplateVariable[]} variables 模板变量列表
   * @param {UserId} createdBy 创建者用户ID
   * @param {string} category 模板分类
   * @param {string} description 模板描述
   * @param {Record<string, unknown>} metadata 元数据
   * @returns {EmailTemplate} 邮件模板聚合根
   * @throws {InvalidEmailTemplateDataError} 当数据无效时抛出
   */
  public static create(
    tenantId: TenantId,
    name: string,
    displayName: string,
    content: TemplateContent,
    variables: TemplateVariable[],
    createdBy: UserId,
    category: string = 'default',
    description: string = '',
    metadata: Record<string, unknown> = {},
  ): EmailTemplate {
    // 生成模板ID
    const templateId = TemplateId.generate();

    // 创建邮件模板实体
    const emailTemplateEntity = new EmailTemplateEntity(
      templateId,
      tenantId,
      name,
      displayName,
      content,
      variables,
      TemplateStatus.DRAFT,
      1, // version
      category,
      description,
      metadata,
      createdBy.value,
    );

    // 创建聚合根
    const emailTemplate = new EmailTemplate(emailTemplateEntity);

    // 发布创建事件
    emailTemplate.addDomainEvent(
      new TemplateCreatedEvent(
        templateId,
        tenantId,
        TemplateType.EMAIL,
        name,
        displayName,
        content,
        variables,
        category,
        description,
        createdBy,
      ),
    );

    return emailTemplate;
  }

  /**
   * @method updateContent
   * @description 更新模板内容，发布更新事件
   * @param {TemplateContent} newContent 新的模板内容
   * @param {TemplateVariable[]} newVariables 新的模板变量
   * @param {UserId} updatedBy 更新者用户ID
   * @returns {void}
   * @throws {InvalidOperationError} 当模板状态不允许更新时抛出
   */
  public updateContent(
    newContent: TemplateContent,
    newVariables: TemplateVariable[],
    updatedBy: UserId,
  ): void {
    this.emailTemplate.updateContent(newContent, newVariables);

    // 发布更新事件
    this.addDomainEvent(
      new TemplateUpdatedEvent(
        this.emailTemplate.id,
        this.emailTemplate.tenantId,
        TemplateType.EMAIL,
        this.emailTemplate.name,
        this.emailTemplate.displayName,
        newContent,
        newVariables,
        this.emailTemplate.getVersion(),
        updatedBy,
      ),
    );
  }

  /**
   * @method publish
   * @description 发布模板，发布发布事件
   * @param {UserId} publishedBy 发布者用户ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public publish(publishedBy: UserId): void {
    this.emailTemplate.publish();

    // 发布发布事件
    this.addDomainEvent(
      new TemplatePublishedEvent(
        this.emailTemplate.id,
        this.emailTemplate.tenantId,
        TemplateType.EMAIL,
        this.emailTemplate.name,
        this.emailTemplate.displayName,
        this.emailTemplate.getVersion(),
        publishedBy,
      ),
    );
  }

  /**
   * @method unpublish
   * @description 下线模板，发布下线事件
   * @param {UserId} unpublishedBy 下线者用户ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public unpublish(unpublishedBy: UserId): void {
    this.emailTemplate.unpublish();

    // 发布下线事件
    this.addDomainEvent(
      new TemplateUnpublishedEvent(
        this.emailTemplate.id,
        this.emailTemplate.tenantId,
        TemplateType.EMAIL,
        this.emailTemplate.name,
        this.emailTemplate.displayName,
        this.emailTemplate.getVersion(),
        unpublishedBy,
      ),
    );
  }

  /**
   * @method archive
   * @description 归档模板
   * @param {UserId} archivedBy 归档者用户ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(archivedBy: UserId): void {
    this.emailTemplate.archive();
    // 注意：归档事件可以根据需要添加
  }

  /**
   * @method delete
   * @description 删除模板，发布删除事件
   * @param {UserId} deletedBy 删除者用户ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public delete(deletedBy: UserId): void {
    this.emailTemplate.delete();

    // 发布删除事件
    this.addDomainEvent(
      new TemplateDeletedEvent(
        this.emailTemplate.id,
        this.emailTemplate.tenantId,
        TemplateType.EMAIL,
        this.emailTemplate.name,
        this.emailTemplate.displayName,
        this.emailTemplate.getVersion(),
        deletedBy,
      ),
    );
  }

  /**
   * @method isDraft
   * @description 检查是否为草稿状态
   * @returns {boolean} 是否为草稿状态
   */
  public isDraft(): boolean {
    return this.emailTemplate.isDraft();
  }

  /**
   * @method isPublished
   * @description 检查是否为已发布状态
   * @returns {boolean} 是否为已发布状态
   */
  public isPublished(): boolean {
    return this.emailTemplate.isPublished();
  }

  /**
   * @method isArchived
   * @description 检查是否为已归档状态
   * @returns {boolean} 是否为已归档状态
   */
  public isArchived(): boolean {
    return this.emailTemplate.isArchived();
  }

  /**
   * @method isDeleted
   * @description 检查是否为已删除状态
   * @returns {boolean} 是否为已删除状态
   */
  public isDeleted(): boolean {
    return this.emailTemplate.isDeleted();
  }

  /**
   * @method isActive
   * @description 检查是否为活跃状态（可以使用）
   * @returns {boolean} 是否为活跃状态
   */
  public isActive(): boolean {
    return this.emailTemplate.isActive();
  }

  /**
   * @method isEditable
   * @description 检查是否可编辑
   * @returns {boolean} 是否可编辑
   */
  public isEditable(): boolean {
    return this.emailTemplate.isEditable();
  }

  /**
   * @method isDeletable
   * @description 检查是否可删除
   * @returns {boolean} 是否可删除
   */
  public isDeletable(): boolean {
    return this.emailTemplate.isDeletable();
  }

  /**
   * @method isFinal
   * @description 检查是否为终态
   * @returns {boolean} 是否为终态
   */
  public isFinal(): boolean {
    return this.emailTemplate.isFinal();
  }

  /**
   * @method getStatus
   * @description 获取当前状态
   * @returns {TemplateStatus} 当前状态
   */
  public getStatus(): TemplateStatus {
    return this.emailTemplate.getStatus();
  }

  /**
   * @method getVersion
   * @description 获取模板版本号
   * @returns {number} 版本号
   */
  public getVersion(): number {
    return this.emailTemplate.getVersion();
  }

  /**
   * @method getVariableNames
   * @description 获取模板变量名称列表
   * @returns {string[]} 变量名称列表
   */
  public getVariableNames(): string[] {
    return this.emailTemplate.getVariableNames();
  }

  /**
   * @method getVariableByName
   * @description 根据名称获取模板变量
   * @param {string} name 变量名称
   * @returns {TemplateVariable | undefined} 模板变量
   */
  public getVariableByName(name: string): TemplateVariable | undefined {
    return this.emailTemplate.getVariableByName(name);
  }

  // 访问器方法，暴露实体属性
  public get id(): TemplateId {
    return this.emailTemplate.id;
  }

  public get tenantId(): TenantId {
    return this.emailTemplate.tenantId;
  }

  public get name(): string {
    return this.emailTemplate.name;
  }

  public get displayName(): string {
    return this.emailTemplate.displayName;
  }

  public get content(): TemplateContent {
    return this.emailTemplate.content;
  }

  public get variables(): TemplateVariable[] {
    return this.emailTemplate.variables;
  }

  public get category(): string {
    return this.emailTemplate.category;
  }

  public get description(): string {
    return this.emailTemplate.description;
  }

  public get metadata(): Record<string, unknown> {
    return this.emailTemplate.metadata;
  }

  /**
   * @method getEntity
   * @description 获取邮件模板实体
   * @returns {EmailTemplateEntity} 邮件模板实体
   */
  public getEntity(): EmailTemplateEntity {
    return this.emailTemplate;
  }

  /**
   * @method updateEntity
   * @description 更新邮件模板实体
   * @param {EmailTemplateEntity} entity 新的实体
   * @returns {void}
   */
  public updateEntity(entity: EmailTemplateEntity): void {
    this.emailTemplate = entity;
  }
}
