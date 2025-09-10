/**
 * @fileoverview 用户服务集成测试
 * @description 测试用户服务的完整业务流程
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../application/services/user.service';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { MockUserRepository } from '../../../test/mocks/user.repository.mock';
import { MockCacheService } from '../../../test/mocks/cache.service.mock';
import { MockEventStorage } from '../../../test/mocks/event-storage.mock';
import {
  createTestUserId,
  createTestEmail,
  createTestUserProfile,
  createTestUserPreferences,
} from '../../../test/utils/test.utils';
import { UserStatus } from '@aiofix/shared';

describe('UserService Integration Tests', () => {
  let userService: UserService;
  let userRepository: MockUserRepository;
  let cacheService: MockCacheService;
  let eventStorage: MockEventStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useClass: MockUserRepository,
        },
        {
          provide: 'ICacheService',
          useClass: MockCacheService,
        },
        {
          provide: 'IEventStorage',
          useClass: MockEventStorage,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<MockUserRepository>('IUserRepository');
    cacheService = module.get<MockCacheService>('ICacheService');
    eventStorage = module.get<MockEventStorage>('IEventStorage');
  });

  afterEach(() => {
    userRepository.clear();
    cacheService.clear();
    eventStorage.clear();
  });

  describe('创建用户', () => {
    it('应该能够创建用户并保存到数据库', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      const command = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });

      const result = await userService.createUser(command);

      expect(result).toBeDefined();
      expect(result.userId).toEqual(userId);
      expect(result.email).toEqual(email);

      // 验证用户已保存到数据库
      const savedUser = await userRepository.findById(userId);
      expect(savedUser).toBeDefined();
      expect(savedUser?.getEmail()).toEqual(email);
    });

    it('应该能够缓存用户信息', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      const command = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });

      await userService.createUser(command);

      // 验证用户信息已缓存
      const cachedUser = await cacheService.getUserCache(userId, 'info');
      expect(cachedUser).toBeDefined();
    });

    it('应该能够保存领域事件', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      const command = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });

      await userService.createUser(command);

      // 验证事件已保存
      const events = await eventStorage.getEvents(userId.value);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserCreated');
    });
  });

  describe('查询用户', () => {
    it('应该能够从缓存获取用户信息', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 查询用户
      const query = new GetUserQuery({ userId });
      const result = await userService.getUser(query);

      expect(result).toBeDefined();
      expect(result.userId).toEqual(userId);
      expect(result.email).toEqual(email);

      // 验证缓存命中
      const stats = cacheService.getCacheStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('缓存未命中时应该从数据库获取', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 清除缓存
      cacheService.clear();

      // 查询用户
      const query = new GetUserQuery({ userId });
      const result = await userService.getUser(query);

      expect(result).toBeDefined();
      expect(result.userId).toEqual(userId);

      // 验证缓存未命中
      const stats = cacheService.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0);
    });
  });

  describe('更新用户', () => {
    it('应该能够更新用户信息', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 更新用户
      const updateCommand = new UpdateUserCommand({
        userId,
        profile: { firstName: 'Updated' },
      });
      await userService.updateUser(updateCommand);

      // 验证更新
      const updatedUser = await userRepository.findById(userId);
      expect(updatedUser?.getProfile().firstName).toBe('Updated');
    });

    it('更新用户后应该清除相关缓存', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 更新用户
      const updateCommand = new UpdateUserCommand({
        userId,
        profile: { firstName: 'Updated' },
      });
      await userService.updateUser(updateCommand);

      // 验证缓存已清除
      const cachedUser = await cacheService.getUserCache(userId, 'info');
      expect(cachedUser).toBeNull();
    });
  });

  describe('删除用户', () => {
    it('应该能够删除用户', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 删除用户
      const deleteCommand = new DeleteUserCommand({ userId });
      await userService.deleteUser(deleteCommand);

      // 验证用户已删除
      const deletedUser = await userRepository.findById(userId);
      expect(deletedUser?.getStatus()).toBe(UserStatus.DELETED);
    });

    it('删除用户后应该清除所有相关缓存', async () => {
      const userId = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 先创建用户
      const createCommand = new CreateUserCommand({
        userId,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(createCommand);

      // 删除用户
      const deleteCommand = new DeleteUserCommand({ userId });
      await userService.deleteUser(deleteCommand);

      // 验证所有缓存已清除
      const deletedCount = await cacheService.deleteUserCache(userId);
      expect(deletedCount).toBe(0); // 缓存已被清除
    });
  });

  describe('错误处理', () => {
    it('创建重复邮箱用户应该抛出异常', async () => {
      const userId1 = createTestUserId();
      const userId2 = createTestUserId();
      const email = createTestEmail();
      const profile = createTestUserProfile();
      const preferences = createTestUserPreferences();

      // 创建第一个用户
      const command1 = new CreateUserCommand({
        userId: userId1,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });
      await userService.createUser(command1);

      // 尝试创建相同邮箱的用户
      const command2 = new CreateUserCommand({
        userId: userId2,
        email,
        password: 'SecurePassword123!',
        profile,
        preferences,
      });

      await expect(userService.createUser(command2)).rejects.toThrow();
    });

    it('查询不存在的用户应该返回null', async () => {
      const userId = createTestUserId();
      const query = new GetUserQuery({ userId });

      const result = await userService.getUser(query);
      expect(result).toBeNull();
    });
  });
});
