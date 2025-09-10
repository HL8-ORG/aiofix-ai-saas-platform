/**
 * @fileoverview 用户聚合根单元测试
 * @description 测试用户聚合根的业务逻辑
 * @since 1.0.0
 */

import { UserAggregate } from '../../domain/entities/user.aggregate';
import { UserId, Email } from '@aiofix/shared';
import {
  UserStatus,
  UserRole,
  UserProfile,
  UserPreferences,
} from '@aiofix/shared';
import {
  createTestUserId,
  createTestEmail,
  createTestUserProfile,
  createTestUserPreferences,
} from '../../../test/utils/test.utils';

describe('UserAggregate', () => {
  let userAggregate: UserAggregate;
  let userId: UserId;
  let email: Email;
  let profile: UserProfile;
  let preferences: UserPreferences;

  beforeEach(() => {
    userId = createTestUserId();
    email = createTestEmail();
    profile = createTestUserProfile();
    preferences = createTestUserPreferences();
  });

  describe('创建用户聚合根', () => {
    it('应该能够创建用户聚合根', () => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);

      expect(userAggregate).toBeDefined();
      expect(userAggregate.getId()).toEqual(userId);
      expect(userAggregate.getEmail()).toEqual(email);
      expect(userAggregate.getProfile()).toEqual(profile);
      expect(userAggregate.getPreferences()).toEqual(preferences);
    });

    it('应该设置默认状态为PENDING', () => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);

      expect(userAggregate.getStatus()).toBe(UserStatus.PENDING);
    });

    it('应该设置默认角色为PERSONAL_USER', () => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);

      expect(userAggregate.getRoles()).toContain(UserRole.PERSONAL_USER);
    });
  });

  describe('用户状态管理', () => {
    beforeEach(() => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);
    });

    it('应该能够激活用户', () => {
      userAggregate.activate();

      expect(userAggregate.getStatus()).toBe(UserStatus.ACTIVE);
    });

    it('应该能够禁用用户', () => {
      userAggregate.activate();
      userAggregate.deactivate();

      expect(userAggregate.getStatus()).toBe(UserStatus.DISABLED);
    });

    it('应该能够删除用户', () => {
      userAggregate.delete();

      expect(userAggregate.getStatus()).toBe(UserStatus.DELETED);
    });

    it('删除的用户不应该能够激活', () => {
      userAggregate.delete();

      expect(() => userAggregate.activate()).toThrow();
    });
  });

  describe('用户资料管理', () => {
    beforeEach(() => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);
    });

    it('应该能够更新用户资料', () => {
      const newProfile: Partial<UserProfile> = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
      };

      userAggregate.updateProfile(newProfile);

      const updatedProfile = userAggregate.getProfile();
      expect(updatedProfile.firstName).toBe('Updated');
      expect(updatedProfile.lastName).toBe('Name');
      expect(updatedProfile.phoneNumber).toBe('+9876543210');
    });

    it('应该能够更新用户偏好设置', () => {
      const newPreferences: Partial<UserPreferences> = {
        notifications: {
          email: false,
          sms: true,
          push: false,
          system: true,
          marketing: true,
        },
      };

      userAggregate.updatePreferences(newPreferences);

      const updatedPreferences = userAggregate.getPreferences();
      expect(updatedPreferences.notifications.email).toBe(false);
      expect(updatedPreferences.notifications.sms).toBe(true);
    });
  });

  describe('用户角色管理', () => {
    beforeEach(() => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);
    });

    it('应该能够分配角色', () => {
      userAggregate.assignRole(UserRole.TENANT_ADMIN);

      expect(userAggregate.getRoles()).toContain(UserRole.TENANT_ADMIN);
    });

    it('应该能够撤销角色', () => {
      userAggregate.assignRole(UserRole.TENANT_ADMIN);
      userAggregate.revokeRole(UserRole.TENANT_ADMIN);

      expect(userAggregate.getRoles()).not.toContain(UserRole.TENANT_ADMIN);
    });

    it('不应该能够撤销默认角色', () => {
      expect(() => userAggregate.revokeRole(UserRole.PERSONAL_USER)).toThrow();
    });
  });

  describe('领域事件', () => {
    beforeEach(() => {
      userAggregate = new UserAggregate(userId, email, profile, preferences);
    });

    it('创建用户时应该发布用户创建事件', () => {
      const events = userAggregate.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserCreated');
    });

    it('激活用户时应该发布用户激活事件', () => {
      userAggregate.activate();
      const events = userAggregate.getUncommittedEvents();

      expect(events).toHaveLength(2); // 创建 + 激活
      expect(events[1].eventType).toBe('UserActivated');
    });

    it('更新资料时应该发布资料更新事件', () => {
      userAggregate.updateProfile({ firstName: 'Updated' });
      const events = userAggregate.getUncommittedEvents();

      expect(events).toHaveLength(2); // 创建 + 更新
      expect(events[1].eventType).toBe('UserProfileUpdated');
    });
  });

  describe('业务规则验证', () => {
    it('应该验证邮箱格式', () => {
      const invalidEmail = new Email('invalid-email');

      expect(() => {
        new UserAggregate(userId, invalidEmail, profile, preferences);
      }).toThrow();
    });

    it('应该验证用户资料完整性', () => {
      const invalidProfile = { ...profile, firstName: '' };

      expect(() => {
        new UserAggregate(userId, email, invalidProfile, preferences);
      }).toThrow();
    });
  });
});
