/**
 * 用户领域值对象导出
 *
 * 设计原理：
 * - 统一导出所有值对象
 * - 提供清晰的模块接口
 * - 便于其他模块引用
 */

// 基础值对象
export { UserId, InvalidUserIdError } from './user-id.vo';
export { Email, InvalidEmailError } from './email.vo';
export {
  Password,
  InvalidPasswordError,
  WeakPasswordError,
  PasswordVerificationError,
} from './password.vo';

// 复合值对象
export {
  UserProfile,
  InvalidUserProfileError,
  type UserProfileData,
  Gender,
} from './user-profile.vo';

export {
  UserPreferences,
  InvalidUserPreferencesError,
  type UserPreferencesData,
  type NotificationSettings,
  type PrivacySettings,
  type AccessibilitySettings,
  NotificationType,
  NotificationFrequency,
  NotificationChannel,
  ProfileVisibility,
} from './user-preferences.vo';

// 状态值对象
export {
  UserStatus,
  UserStatusTransition,
  UserStatusUtils,
  InvalidStatusTransitionError,
} from './user-status.vo';
