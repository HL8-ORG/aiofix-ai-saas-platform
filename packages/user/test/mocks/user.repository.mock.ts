/**
 * @fileoverview 用户仓储模拟对象
 * @description 提供用户仓储的测试模拟实现
 * @since 1.0.0
 */

import { UserId } from '@aiofix/shared';
import { IUserRepository } from '../../src/domain/repositories/user.repository.interface';
import { UserAggregate } from '../../src/domain/entities/user.aggregate';
import { createTestUserData } from './test.utils';

/**
 * 用户仓储模拟实现
 */
export class MockUserRepository implements IUserRepository {
  private users: Map<string, UserAggregate> = new Map();

  constructor() {
    // 初始化测试数据
    const testUser = createTestUserData();
    const userAggregate = new UserAggregate(
      testUser.id,
      testUser.email,
      testUser.profile,
      testUser.preferences,
    );
    this.users.set(testUser.id.value, userAggregate);
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.getEmail().value === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: UserAggregate): Promise<void> {
    this.users.set(user.getId().value, user);
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.value);
  }

  async findAll(): Promise<UserAggregate[]> {
    return Array.from(this.users.values());
  }

  async findMany(ids: UserId[]): Promise<UserAggregate[]> {
    return ids
      .map(id => this.users.get(id.value))
      .filter(user => user !== undefined) as UserAggregate[];
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.value);
  }

  async count(): Promise<number> {
    return this.users.size;
  }

  // 测试辅助方法
  clear(): void {
    this.users.clear();
  }

  addUser(user: UserAggregate): void {
    this.users.set(user.getId().value, user);
  }

  getUserCount(): number {
    return this.users.size;
  }
}
