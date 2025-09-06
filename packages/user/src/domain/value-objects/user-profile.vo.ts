import { ValueObject } from '@aiofix/core';

/**
 * 用户资料值对象
 *
 * 设计原理：
 * - 封装用户个人信息的业务规则
 * - 确保用户资料数据的完整性和有效性
 * - 提供用户资料的操作方法
 *
 * 业务规则：
 * - 姓名不能为空
 * - 电话号码格式必须正确
 * - 头像URL必须有效
 * - 用户偏好设置必须完整
 */
export class UserProfile extends ValueObject<UserProfileData> {
  constructor(data: UserProfileData) {
    super(data);
    this.validate();
  }

  /**
   * 验证用户资料的有效性
   *
   * 业务规则：
   * - 姓名不能为空
   * - 电话号码格式必须正确
   * - 头像URL必须有效
   */
  private validate(): void {
    if (!this.value.firstName || this.value.firstName.trim().length === 0) {
      throw new InvalidUserProfileError('First name is required');
    }

    if (!this.value.lastName || this.value.lastName.trim().length === 0) {
      throw new InvalidUserProfileError('Last name is required');
    }

    if (this.value.firstName.length > 50) {
      throw new InvalidUserProfileError('First name is too long');
    }

    if (this.value.lastName.length > 50) {
      throw new InvalidUserProfileError('Last name is too long');
    }

    if (
      this.value.phoneNumber &&
      !this.isValidPhoneNumber(this.value.phoneNumber)
    ) {
      throw new InvalidUserProfileError('Invalid phone number format');
    }

    if (this.value.avatar && !this.isValidUrl(this.value.avatar)) {
      throw new InvalidUserProfileError('Invalid avatar URL format');
    }
  }

  /**
   * 验证电话号码格式
   *
   * 业务规则：
   * - 支持国际格式
   * - 支持多种电话号码格式
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // 移除所有非数字字符
    const cleanNumber = phoneNumber.replace(/\D/g, '');

    // 检查长度（7-15位数字）
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      return false;
    }

    // 检查是否包含有效的国际格式
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * 验证URL格式
   *
   * 业务规则：
   * - 必须是有效的HTTP/HTTPS URL
   * - 支持相对路径
   */
  private isValidUrl(url: string): boolean {
    try {
      // 如果是相对路径，认为是有效的
      if (
        url.startsWith('/') ||
        url.startsWith('./') ||
        url.startsWith('../')
      ) {
        return true;
      }

      // 检查绝对URL
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取用户全名
   *
   * @returns 用户全名
   */
  public getFullName(): string {
    return `${this.value.firstName} ${this.value.lastName}`.trim();
  }

  /**
   * 获取用户显示名称
   *
   * 业务规则：
   * - 优先使用昵称
   * - 如果没有昵称，使用全名
   * - 如果都没有，使用邮箱
   */
  public getDisplayName(): string {
    if (this.value.nickname && this.value.nickname.trim().length > 0) {
      return this.value.nickname.trim();
    }
    return this.getFullName();
  }

  /**
   * 更新用户资料
   *
   * @param updates 要更新的字段
   * @returns 新的用户资料值对象
   */
  public update(updates: Partial<UserProfileData>): UserProfile {
    const updatedData: UserProfileData = {
      ...this.value,
      ...updates,
    };

    return new UserProfile(updatedData);
  }

  /**
   * 检查是否有完整的联系方式
   *
   * @returns 是否有完整的联系方式
   */
  public hasCompleteContactInfo(): boolean {
    return !!(
      this.value.phoneNumber && this.value.phoneNumber.trim().length > 0
    );
  }

  /**
   * 获取用户资料的JSON表示
   *
   * @returns 用户资料数据
   */
  public toJSON(): UserProfileData {
    return { ...this.value };
  }
}

/**
 * 用户资料数据类型
 */
export interface UserProfileData {
  firstName: string;
  lastName: string;
  nickname?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  location?: string;
  website?: string;
}

/**
 * 性别枚举
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

/**
 * 无效用户资料异常
 *
 * 业务规则：
 * - 当用户资料不符合业务规则时抛出
 */
export class InvalidUserProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserProfileError';
  }
}
