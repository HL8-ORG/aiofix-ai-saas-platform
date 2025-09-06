/**
 * 用户聚合根测试
 *
 * 测试用户聚合根的基本功能，包括用户创建、资料更新等。
 *
 * @fileoverview 用户聚合根单元测试
 * @author AI开发团队
 * @since 1.0.0
 */

import {
  User,
  UserCreatedEvent,
  UserProfileUpdatedEvent,
} from './user.aggregate';

describe('User Aggregate', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const name = 'Test User';

      // Act
      const user = User.create(email, password, name);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
      expect(user.status).toBe('active');
      expect(user.hasUncommittedEvents()).toBe(true);
      expect(user.getUncommittedEventsCount()).toBe(1);
      expect(user.uncommittedEvents[0]).toBeInstanceOf(UserCreatedEvent);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const invalidEmail = 'invalid-email';
      const password = 'Password123!';
      const name = 'Test User';

      // Act & Assert
      expect(() => {
        User.create(invalidEmail, password, name);
      }).toThrow('邮箱格式无效');
    });

    it('should throw error for weak password', () => {
      // Arrange
      const email = 'test@example.com';
      const weakPassword = '123';
      const name = 'Test User';

      // Act & Assert
      expect(() => {
        User.create(email, weakPassword, name);
      }).toThrow('密码强度不足');
    });

    it('should throw error for empty name', () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const emptyName = '';

      // Act & Assert
      expect(() => {
        User.create(email, password, emptyName);
      }).toThrow('用户姓名不能为空');
    });
  });

  describe('updateProfile', () => {
    let user: User;

    beforeEach(() => {
      user = User.create('test@example.com', 'Password123!', 'Test User');
      user.markEventsAsCommitted(); // 清除未提交事件
    });

    it('should update user profile successfully', () => {
      // Arrange
      const profile = {
        name: 'Updated Name',
        phone: '+1234567890',
        avatar: 'https://example.com/avatar.jpg',
      };

      // Act
      user.updateProfile(profile);

      // Assert
      expect(user.name).toBe('Updated Name');
      expect(user.phone).toBe('+1234567890');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.hasUncommittedEvents()).toBe(true);
      expect(user.getUncommittedEventsCount()).toBe(1);
      expect(user.uncommittedEvents[0]).toBeInstanceOf(UserProfileUpdatedEvent);
    });

    it('should update partial profile', () => {
      // Arrange
      const profile = {
        name: 'New Name',
      };

      // Act
      user.updateProfile(profile);

      // Assert
      expect(user.name).toBe('New Name');
      expect(user.phone).toBe(''); // 未更新，保持原值
      expect(user.avatar).toBe(''); // 未更新，保持原值
    });

    it('should throw error for empty name', () => {
      // Arrange
      const profile = {
        name: '',
      };

      // Act & Assert
      expect(() => {
        user.updateProfile(profile);
      }).toThrow('用户姓名不能为空');
    });

    it('should throw error for invalid phone', () => {
      // Arrange
      const profile = {
        phone: 'invalid-phone',
      };

      // Act & Assert
      expect(() => {
        user.updateProfile(profile);
      }).toThrow('电话号码格式无效');
    });
  });

  describe('event sourcing', () => {
    it('should restore from history events', () => {
      // Arrange
      const user = User.create('test@example.com', 'Password123!', 'Test User');
      const events = user.uncommittedEvents;
      user.markEventsAsCommitted();

      // 创建新用户实例
      const restoredUser = new User(user.id);

      // Act
      restoredUser.loadFromHistory(events);

      // Assert
      expect(restoredUser.id).toBe(user.id);
      expect(restoredUser.email).toBe(user.email);
      expect(restoredUser.name).toBe(user.name);
      expect(restoredUser.status).toBe(user.status);
      expect(restoredUser.version).toBe(1);
    });

    it('should create and restore snapshot', () => {
      // Arrange
      const user = User.create('test@example.com', 'Password123!', 'Test User');
      user.updateProfile({ name: 'Updated Name' });
      user.markEventsAsCommitted();

      // Act
      const snapshot = user.createSnapshot();
      const restoredUser = new User(user.id);
      restoredUser.restoreFromSnapshot(snapshot);

      // Assert
      expect(restoredUser.id).toBe(user.id);
      expect(restoredUser.email).toBe(user.email);
      expect(restoredUser.name).toBe('Updated Name');
      expect(restoredUser.version).toBe(user.version);
    });
  });

  describe('version control', () => {
    it('should increment version on each event', () => {
      // Arrange
      const user = User.create('test@example.com', 'Password123!', 'Test User');
      expect(user.version).toBe(1);

      // Act
      user.updateProfile({ name: 'Updated Name' });

      // Assert
      expect(user.version).toBe(2);
    });

    it('should maintain version consistency', () => {
      // Arrange
      const user = User.create('test@example.com', 'Password123!', 'Test User');
      const initialVersion = user.version;

      // Act
      user.markEventsAsCommitted();

      // Assert
      expect(user.version).toBe(initialVersion);
      expect(user.hasUncommittedEvents()).toBe(false);
    });
  });
});
