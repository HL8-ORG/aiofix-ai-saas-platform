import { ValueObject } from '@aiofix/core';

/**
 * 用户偏好设置值对象
 *
 * 设计原理：
 * - 封装用户个性化设置的业务规则
 * - 确保偏好设置数据的完整性和有效性
 * - 提供用户偏好设置的操作方法
 *
 * 业务规则：
 * - 语言设置必须有效
 * - 时区设置必须有效
 * - 主题设置必须有效
 * - 通知设置必须完整
 */
export class UserPreferences extends ValueObject<UserPreferencesData> {
  constructor(data: UserPreferencesData) {
    super(data);
    this.validate();
  }

  /**
   * 验证用户偏好设置的有效性
   *
   * 业务规则：
   * - 语言设置必须有效
   * - 时区设置必须有效
   * - 主题设置必须有效
   */
  private validate(): void {
    if (!this.value.language || this.value.language.trim().length === 0) {
      throw new InvalidUserPreferencesError('Language is required');
    }

    if (!this.value.timezone || this.value.timezone.trim().length === 0) {
      throw new InvalidUserPreferencesError('Timezone is required');
    }

    if (!this.value.theme || this.value.theme.trim().length === 0) {
      throw new InvalidUserPreferencesError('Theme is required');
    }

    // 验证语言代码格式
    if (!this.isValidLanguageCode(this.value.language)) {
      throw new InvalidUserPreferencesError('Invalid language code format');
    }

    // 验证时区格式
    if (!this.isValidTimezone(this.value.timezone)) {
      throw new InvalidUserPreferencesError('Invalid timezone format');
    }

    // 验证主题设置
    if (!this.isValidTheme(this.value.theme)) {
      throw new InvalidUserPreferencesError('Invalid theme setting');
    }
  }

  /**
   * 验证语言代码格式
   *
   * 业务规则：
   * - 支持ISO 639-1语言代码
   * - 支持语言-地区格式（如zh-CN）
   */
  private isValidLanguageCode(language: string): boolean {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    return languageRegex.test(language);
  }

  /**
   * 验证时区格式
   *
   * 业务规则：
   * - 支持IANA时区标识符
   * - 支持UTC偏移格式
   */
  private isValidTimezone(timezone: string): boolean {
    // 检查IANA时区格式
    const ianaTimezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$/;
    if (ianaTimezoneRegex.test(timezone)) {
      return true;
    }

    // 检查UTC偏移格式
    const utcOffsetRegex = /^UTC[+-]\d{1,2}(:\d{2})?$/;
    if (utcOffsetRegex.test(timezone)) {
      return true;
    }

    return false;
  }

  /**
   * 验证主题设置
   *
   * 业务规则：
   * - 支持预定义的主题
   */
  private isValidTheme(theme: string): boolean {
    const validThemes = ['light', 'dark', 'auto'];
    return validThemes.includes(theme);
  }

  /**
   * 更新用户偏好设置
   *
   * @param updates 要更新的字段
   * @returns 新的用户偏好设置值对象
   */
  public update(updates: Partial<UserPreferencesData>): UserPreferences {
    const updatedData: UserPreferencesData = {
      ...this.value,
      ...updates,
    };

    return new UserPreferences(updatedData);
  }

  /**
   * 检查是否启用了特定通知类型
   *
   * @param notificationType 通知类型
   * @returns 是否启用
   */
  public isNotificationEnabled(notificationType: NotificationType): boolean {
    return this.value.notifications[notificationType]?.enabled ?? false;
  }

  /**
   * 获取通知设置
   *
   * @param notificationType 通知类型
   * @returns 通知设置
   */
  public getNotificationSettings(
    notificationType: NotificationType,
  ): NotificationSettings {
    return (
      this.value.notifications[notificationType] || {
        enabled: false,
        channels: [],
        frequency: NotificationFrequency.IMMEDIATE,
      }
    );
  }

  /**
   * 更新通知设置
   *
   * @param notificationType 通知类型
   * @param settings 新的通知设置
   * @returns 新的用户偏好设置值对象
   */
  public updateNotificationSettings(
    notificationType: NotificationType,
    settings: NotificationSettings,
  ): UserPreferences {
    const updatedNotifications = {
      ...this.value.notifications,
      [notificationType]: settings,
    };

    return this.update({ notifications: updatedNotifications });
  }

  /**
   * 获取用户偏好设置的JSON表示
   *
   * @returns 用户偏好设置数据
   */
  public toJSON(): UserPreferencesData {
    return { ...this.value };
  }
}

/**
 * 用户偏好设置数据类型
 */
export interface UserPreferencesData {
  language: string;
  timezone: string;
  theme: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  notifications: Record<NotificationType, NotificationSettings>;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
}

/**
 * 通知类型枚举
 */
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  SYSTEM = 'system',
  SECURITY = 'security',
  MARKETING = 'marketing',
}

/**
 * 通知频率枚举
 */
export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never',
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  quietHours?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

/**
 * 通知渠道枚举
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

/**
 * 隐私设置接口
 */
export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
}

/**
 * 个人资料可见性枚举
 */
export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
}

/**
 * 无障碍设置接口
 */
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
}

/**
 * 无效用户偏好设置异常
 *
 * 业务规则：
 * - 当用户偏好设置不符合业务规则时抛出
 */
export class InvalidUserPreferencesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserPreferencesError';
  }
}
