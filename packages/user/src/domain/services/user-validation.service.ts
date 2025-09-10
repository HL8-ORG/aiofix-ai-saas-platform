import { Injectable } from '@nestjs/common';
import { UserId, Email } from '@aiofix/shared';
import { UserEntity } from '../entities/user.entity';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserPreferences } from '../value-objects/user-preferences.vo';
import { Password } from '../value-objects/password.vo';
import { UserStatus } from '../value-objects/user-status.vo';

/**
 * @class UserValidationService
 * @description
 * 用户验证服务，负责用户相关的数据验证和业务规则检查。
 *
 * 验证职责：
 * 1. 用户输入数据验证
 * 2. 业务规则验证
 * 3. 数据完整性检查
 * 4. 安全策略验证
 *
 * 验证类型：
 * 1. 格式验证：邮箱格式、密码强度等
 * 2. 业务验证：邮箱唯一性、状态转换等
 * 3. 安全验证：密码安全、权限检查等
 * 4. 完整性验证：必填字段、数据关联等
 *
 * @example
 * ```typescript
 * const validationService = new UserValidationService();
 * const isValid = await validationService.validateUserCreation(userData);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UserValidationService {
  /**
   * @method validateUserCreation
   * @description 验证用户创建数据的有效性
   * @param {UserCreationData} userData 用户创建数据
   * @returns {ValidationResult} 验证结果
   *
   * 验证规则：
   * 1. 必填字段检查
   * 2. 格式验证
   * 3. 业务规则验证
   * 4. 安全策略验证
   */
  validateUserCreation(userData: UserCreationData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 必填字段检查
    if (!userData.email || userData.email.trim().length === 0) {
      errors.push('Email is required');
    }

    if (!userData.password || userData.password.trim().length === 0) {
      errors.push('Password is required');
    }

    if (!userData.firstName || userData.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!userData.lastName || userData.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    // 2. 格式验证
    if (userData.email && !this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (userData.password && !this.isValidPassword(userData.password)) {
      errors.push('Password does not meet security requirements');
    }

    if (
      userData.phoneNumber &&
      !this.isValidPhoneNumber(userData.phoneNumber)
    ) {
      errors.push('Invalid phone number format');
    }

    if (userData.avatar && !this.isValidUrl(userData.avatar)) {
      errors.push('Invalid avatar URL format');
    }

    // 3. 长度验证
    if (userData.firstName && userData.firstName.length > 50) {
      errors.push('First name is too long (maximum 50 characters)');
    }

    if (userData.lastName && userData.lastName.length > 50) {
      errors.push('Last name is too long (maximum 50 characters)');
    }

    if (userData.bio && userData.bio.length > 500) {
      errors.push('Bio is too long (maximum 500 characters)');
    }

    // 4. 业务规则验证
    if (userData.dateOfBirth && this.isFutureDate(userData.dateOfBirth)) {
      errors.push('Date of birth cannot be in the future');
    }

    if (userData.dateOfBirth && this.isTooOld(userData.dateOfBirth)) {
      warnings.push('Date of birth seems unusually old');
    }

    // 5. 安全策略验证
    if (userData.password && this.isCommonPassword(userData.password)) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method validateUserUpdate
   * @description 验证用户更新数据的有效性
   * @param {UserUpdateData} userData 用户更新数据
   * @param {UserEntity} currentUser 当前用户实体
   * @returns {ValidationResult} 验证结果
   */
  validateUserUpdate(
    userData: UserUpdateData,
    currentUser: UserEntity,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 格式验证（只验证提供的字段）
    if (userData.email && !this.isValidEmail(userData.email)) {
      errors.push('Invalid email format');
    }

    if (
      userData.phoneNumber &&
      !this.isValidPhoneNumber(userData.phoneNumber)
    ) {
      errors.push('Invalid phone number format');
    }

    if (userData.avatar && !this.isValidUrl(userData.avatar)) {
      errors.push('Invalid avatar URL format');
    }

    // 2. 长度验证
    if (userData.firstName && userData.firstName.length > 50) {
      errors.push('First name is too long (maximum 50 characters)');
    }

    if (userData.lastName && userData.lastName.length > 50) {
      errors.push('Last name is too long (maximum 50 characters)');
    }

    if (userData.bio && userData.bio.length > 500) {
      errors.push('Bio is too long (maximum 500 characters)');
    }

    // 3. 业务规则验证
    if (userData.dateOfBirth && this.isFutureDate(userData.dateOfBirth)) {
      errors.push('Date of birth cannot be in the future');
    }

    if (userData.dateOfBirth && this.isTooOld(userData.dateOfBirth)) {
      warnings.push('Date of birth seems unusually old');
    }

    // 4. 检查是否有实际变更
    const hasChanges = this.hasSignificantChanges(userData, currentUser);
    if (!hasChanges) {
      warnings.push('No significant changes detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method validatePasswordChange
   * @description 验证密码变更的有效性
   * @param {string} newPassword 新密码
   * @param {string} [currentPassword] 当前密码（用于验证）
   * @returns {ValidationResult} 验证结果
   */
  validatePasswordChange(
    newPassword: string,
    currentPassword?: string,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 必填字段检查
    if (!newPassword || newPassword.trim().length === 0) {
      errors.push('New password is required');
    }

    // 2. 密码强度验证
    if (newPassword && !this.isValidPassword(newPassword)) {
      errors.push('Password does not meet security requirements');
    }

    // 3. 检查是否与当前密码相同
    if (currentPassword && newPassword === currentPassword) {
      errors.push('New password must be different from current password');
    }

    // 4. 检查是否为常见密码
    if (newPassword && this.isCommonPassword(newPassword)) {
      errors.push('Password is too common, please choose a stronger password');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method validateUserStatusChange
   * @description 验证用户状态变更的有效性
   * @param {UserStatus} currentStatus 当前状态
   * @param {UserStatus} newStatus 新状态
   * @param {UserId} requestedBy 请求者ID
   * @returns {ValidationResult} 验证结果
   */
  validateUserStatusChange(
    currentStatus: UserStatus,
    newStatus: UserStatus,
    requestedBy: UserId,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 检查状态转换是否合法
    if (!this.isValidStatusTransition(currentStatus, newStatus)) {
      errors.push(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // 2. 检查特殊状态转换限制
    if (currentStatus === UserStatus.DELETED) {
      errors.push('Cannot change status of deleted user');
    }

    if (newStatus === UserStatus.DELETED) {
      warnings.push('This action will permanently delete the user');
    }

    // 3. TODO: 检查请求者权限
    // - 验证请求者是否有权限进行此状态转换
    // - 考虑管理员权限
    // - 考虑用户自操作权限

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method isValidEmail
   * @description 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * @method isValidPassword
   * @description 验证密码强度
   * @param {string} password 密码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPassword(password: string): boolean {
    // 至少8个字符
    if (password.length < 8) {
      return false;
    }

    // 至少包含一个大写字母
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // 至少包含一个小写字母
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // 至少包含一个数字
    if (!/\d/.test(password)) {
      return false;
    }

    // 至少包含一个特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * @method isValidPhoneNumber
   * @description 验证电话号码格式
   * @param {string} phoneNumber 电话号码
   * @returns {boolean} 是否有效
   * @private
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
   * @method isValidUrl
   * @description 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否有效
   * @private
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
   * @method isFutureDate
   * @description 检查日期是否为未来日期
   * @param {Date} date 日期
   * @returns {boolean} 是否为未来日期
   * @private
   */
  private isFutureDate(date: Date): boolean {
    return date > new Date();
  }

  /**
   * @method isTooOld
   * @description 检查日期是否过于久远
   * @param {Date} date 日期
   * @returns {boolean} 是否过于久远
   * @private
   */
  private isTooOld(date: Date): boolean {
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
    return date < hundredYearsAgo;
  }

  /**
   * @method isCommonPassword
   * @description 检查是否为常见密码
   * @param {string} password 密码
   * @returns {boolean} 是否为常见密码
   * @private
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * @method isValidStatusTransition
   * @description 检查状态转换是否合法
   * @param {UserStatus} fromStatus 当前状态
   * @param {UserStatus} toStatus 目标状态
   * @returns {boolean} 是否合法
   * @private
   */
  private isValidStatusTransition(
    fromStatus: UserStatus,
    toStatus: UserStatus,
  ): boolean {
    // 相同状态转换总是允许的
    if (fromStatus === toStatus) {
      return true;
    }

    // 定义允许的状态转换
    const allowedTransitions: Map<UserStatus, UserStatus[]> = new Map([
      [UserStatus.PENDING, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [
        UserStatus.ACTIVE,
        [
          UserStatus.DISABLED,
          UserStatus.LOCKED,
          UserStatus.SUSPENDED,
          UserStatus.DELETED,
        ],
      ],
      [UserStatus.DISABLED, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [UserStatus.LOCKED, [UserStatus.ACTIVE, UserStatus.DISABLED]],
      [UserStatus.SUSPENDED, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [UserStatus.DELETED, []], // 已删除状态不能转换到其他状态
    ]);

    const allowedTargets = allowedTransitions.get(fromStatus);
    return allowedTargets ? allowedTargets.includes(toStatus) : false;
  }

  /**
   * @method hasSignificantChanges
   * @description 检查是否有显著变更
   * @param {UserUpdateData} updateData 更新数据
   * @param {UserEntity} currentUser 当前用户
   * @returns {boolean} 是否有显著变更
   * @private
   */
  private hasSignificantChanges(
    updateData: UserUpdateData,
    currentUser: UserEntity,
  ): boolean {
    const profile = currentUser.profile.value;

    // 检查基本信息变更
    if (updateData.firstName && updateData.firstName !== profile.firstName) {
      return true;
    }

    if (updateData.lastName && updateData.lastName !== profile.lastName) {
      return true;
    }

    if (
      updateData.phoneNumber &&
      updateData.phoneNumber !== profile.phoneNumber
    ) {
      return true;
    }

    if (updateData.avatar && updateData.avatar !== profile.avatar) {
      return true;
    }

    if (updateData.bio && updateData.bio !== profile.bio) {
      return true;
    }

    // 检查其他字段变更
    if (updateData.email && updateData.email !== currentUser.email.value) {
      return true;
    }

    return false;
  }
}

/**
 * 用户创建数据接口
 */
export interface UserCreationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  location?: string;
  website?: string;
}

/**
 * 用户更新数据接口
 */
export interface UserUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  location?: string;
  website?: string;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
