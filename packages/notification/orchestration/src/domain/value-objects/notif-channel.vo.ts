import { ValueObject } from '@aiofix/core';

/**
 * 通知渠道类型枚举
 * 定义系统支持的通知渠道类型
 */
export enum NotifChannelType {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

/**
 * 通知类型枚举
 * 定义通知的业务类型
 */
export enum NotifType {
  SYSTEM = 'system',
  USER = 'user',
  MARKETING = 'marketing',
  TRANSACTION = 'transaction',
  SECURITY = 'security',
}

/**
 * 渠道优先级枚举
 * 定义渠道的优先级顺序
 */
export enum ChannelPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

/**
 * 通知渠道值对象
 * 封装通知渠道的相关信息，包括渠道类型、优先级、配置等
 *
 * 业务规则：
 * 1. 渠道类型必须有效
 * 2. 优先级必须在有效范围内
 * 3. 配置参数必须符合渠道要求
 * 4. 渠道名称不能为空
 */
export class NotifChannel extends ValueObject<{
  type: NotifChannelType;
  name: string;
  priority: ChannelPriority;
  enabled: boolean;
  config: Record<string, unknown>;
  conditions?: Record<string, unknown>;
}> {
  constructor(props: {
    type: NotifChannelType;
    name: string;
    priority: ChannelPriority;
    enabled: boolean;
    config: Record<string, unknown>;
    conditions?: Record<string, unknown>;
  }) {
    super(props);
    this.validate();
  }

  /**
   * 获取渠道类型
   */
  get type(): NotifChannelType {
    return this.value.type;
  }

  /**
   * 获取渠道名称
   */
  get name(): string {
    return this.value.name;
  }

  /**
   * 获取渠道优先级
   */
  get priority(): ChannelPriority {
    return this.value.priority;
  }

  /**
   * 是否启用
   */
  get enabled(): boolean {
    return this.value.enabled;
  }

  /**
   * 获取渠道配置
   */
  get config(): Record<string, unknown> {
    return this.value.config;
  }

  /**
   * 获取渠道条件
   */
  get conditions(): Record<string, unknown> | undefined {
    return this.value.conditions;
  }

  /**
   * 验证渠道配置
   */
  private validate(): void {
    if (!this.value.type) {
      throw new InvalidNotifChannelError('渠道类型不能为空');
    }

    if (!Object.values(NotifChannelType).includes(this.value.type)) {
      throw new InvalidNotifChannelError(`无效的渠道类型: ${this.value.type}`);
    }

    if (!this.value.name || this.value.name.trim().length === 0) {
      throw new InvalidNotifChannelError('渠道名称不能为空');
    }

    if (!Object.values(ChannelPriority).includes(this.value.priority)) {
      throw new InvalidNotifChannelError(
        `无效的渠道优先级: ${this.value.priority}`,
      );
    }

    if (typeof this.value.enabled !== 'boolean') {
      throw new InvalidNotifChannelError('渠道启用状态必须是布尔值');
    }

    if (!this.value.config || typeof this.value.config !== 'object') {
      throw new InvalidNotifChannelError('渠道配置不能为空且必须是对象');
    }

    // 验证特定渠道类型的配置要求
    this.validateChannelConfig();
  }

  /**
   * 验证特定渠道类型的配置要求
   */
  private validateChannelConfig(): void {
    switch (this.value.type) {
      case NotifChannelType.EMAIL:
        this.validateEmailConfig();
        break;
      case NotifChannelType.SMS:
        this.validateSmsConfig();
        break;
      case NotifChannelType.PUSH:
        this.validatePushConfig();
        break;
      case NotifChannelType.WEBHOOK:
        this.validateWebhookConfig();
        break;
      case NotifChannelType.IN_APP:
        this.validateInAppConfig();
        break;
    }
  }

  /**
   * 验证邮件渠道配置
   */
  private validateEmailConfig(): void {
    const config = this.value.config;
    if (!config.templateId || typeof config.templateId !== 'string') {
      throw new InvalidNotifChannelError('邮件渠道必须配置模板ID');
    }
    if (!config.senderEmail || typeof config.senderEmail !== 'string') {
      throw new InvalidNotifChannelError('邮件渠道必须配置发送者邮箱');
    }
  }

  /**
   * 验证短信渠道配置
   */
  private validateSmsConfig(): void {
    const config = this.value.config;
    if (!config.templateId || typeof config.templateId !== 'string') {
      throw new InvalidNotifChannelError('短信渠道必须配置模板ID');
    }
    if (!config.provider || typeof config.provider !== 'string') {
      throw new InvalidNotifChannelError('短信渠道必须配置提供商');
    }
  }

  /**
   * 验证推送渠道配置
   */
  private validatePushConfig(): void {
    const config = this.value.config;
    if (!config.platform || typeof config.platform !== 'string') {
      throw new InvalidNotifChannelError('推送渠道必须配置平台');
    }
    if (!config.appId || typeof config.appId !== 'string') {
      throw new InvalidNotifChannelError('推送渠道必须配置应用ID');
    }
  }

  /**
   * 验证Webhook渠道配置
   */
  private validateWebhookConfig(): void {
    const config = this.value.config;
    if (!config.url || typeof config.url !== 'string') {
      throw new InvalidNotifChannelError('Webhook渠道必须配置URL');
    }
    if (!config.method || typeof config.method !== 'string') {
      throw new InvalidNotifChannelError('Webhook渠道必须配置HTTP方法');
    }
  }

  /**
   * 验证站内信渠道配置
   */
  private validateInAppConfig(): void {
    const config = this.value.config;
    if (!config.category || typeof config.category !== 'string') {
      throw new InvalidNotifChannelError('站内信渠道必须配置分类');
    }
  }

  /**
   * 检查渠道是否满足条件
   */
  isConditionMet(context: Record<string, unknown>): boolean {
    if (!this.value.conditions) {
      return true;
    }

    return Object.entries(this.value.conditions).every(([key, value]) => {
      return context[key] === value;
    });
  }

  /**
   * 比较渠道优先级
   */
  comparePriority(other: NotifChannel): number {
    return this.value.priority - other._value.priority;
  }

  /**
   * 创建启用状态的渠道副本
   */
  enable(): NotifChannel {
    return new NotifChannel({
      ...this.value,
      enabled: true,
    });
  }

  /**
   * 创建禁用状态的渠道副本
   */
  disable(): NotifChannel {
    return new NotifChannel({
      ...this.value,
      enabled: false,
    });
  }

  /**
   * 更新渠道配置
   */
  updateConfig(config: Record<string, unknown>): NotifChannel {
    return new NotifChannel({
      ...this.value,
      config: { ...this.value.config, ...config },
    });
  }

  /**
   * 更新渠道条件
   */
  updateConditions(conditions: Record<string, unknown>): NotifChannel {
    return new NotifChannel({
      ...this.value,
      conditions: { ...this.value.conditions, ...conditions },
    });
  }

  /**
   * 获取渠道摘要信息
   */
  getSummary(): Record<string, unknown> {
    return {
      type: this.value.type,
      name: this.value.name,
      priority: this.value.priority,
      enabled: this.value.enabled,
    };
  }
}

/**
 * 无效通知渠道错误
 */
export class InvalidNotifChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifChannelError';
  }
}
