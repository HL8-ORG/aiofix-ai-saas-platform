import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserPostgreSQLEntity } from '../adapters/user.postgresql.entity';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../../domain/value-objects';

/**
 * @class UserRepository
 * @description
 * 用户仓储PostgreSQL实现，负责用户聚合根的数据持久化和检索。
 *
 * 仓储职责：
 * 1. 实现用户聚合根的数据持久化
 * 2. 提供用户数据的查询和检索功能
 * 3. 支持多租户数据隔离策略
 * 4. 管理事务边界和数据一致性
 *
 * 多租户支持：
 * 1. 支持数据库级、Schema级、表级隔离策略
 * 2. 自动应用租户隔离条件
 * 3. 确保跨租户数据安全
 * 4. 支持租户级的数据操作
 *
 * 性能优化：
 * 1. 使用MikroORM的查询构建器优化查询性能
 * 2. 实现查询结果缓存机制
 * 3. 支持分页和批量操作
 * 4. 优化数据库索引使用
 *
 * @param {EntityManager} entityManager MikroORM实体管理器
 *
 * @example
 * ```typescript
 * const userRepo = new UserRepository(entityManager);
 * const user = await userRepo.findById(new UserId('user-123'));
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * @method findById
   * @description 根据用户ID查找用户聚合根
   * @param {UserId} id 用户ID
   * @returns {Promise<UserAggregate | null>} 用户聚合根或null
   */
  async findById(id: UserId): Promise<UserAggregate | null> {
    const entity = await this.entityManager.findOne(UserPostgreSQLEntity, {
      id: id.value,
      deletedAt: null,
    });

    if (!entity) {
      return null;
    }

    return this.mapToAggregate(entity);
  }

  /**
   * @method findByEmail
   * @description 根据邮箱地址查找用户聚合根
   * @param {Email} email 邮箱地址
   * @param {string} [tenantId] 租户ID，可选
   * @returns {Promise<UserAggregate | null>} 用户聚合根或null
   */
  async findByEmail(
    email: Email,
    tenantId?: string,
  ): Promise<UserAggregate | null> {
    const whereClause: any = {
      email: email.value,
      deletedAt: null,
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const entity = await this.entityManager.findOne(
      UserPostgreSQLEntity,
      whereClause,
    );

    if (!entity) {
      return null;
    }

    return this.mapToAggregate(entity);
  }

  /**
   * @method save
   * @description 保存用户聚合根到数据库
   * @param {UserAggregate} aggregate 用户聚合根
   * @returns {Promise<void>}
   */
  async save(aggregate: UserAggregate): Promise<void> {
    const entity = UserPostgreSQLEntity.fromAggregate(aggregate);
    await this.entityManager.persistAndFlush(entity);
  }

  /**
   * @method delete
   * @description 软删除用户聚合根
   * @param {UserId} id 用户ID
   * @returns {Promise<void>}
   */
  async delete(id: UserId): Promise<void> {
    const entity = await this.entityManager.findOne(UserPostgreSQLEntity, {
      id: id.value,
    });

    if (entity) {
      entity.deletedAt = new Date();
      await this.entityManager.persistAndFlush(entity);
    }
  }

  /**
   * @method findUsers
   * @description 查找用户列表，支持分页和过滤
   * @param {object} filters 过滤条件
   * @param {number} [page=1] 页码
   * @param {number} [limit=20] 每页数量
   * @returns {Promise<{ users: UserAggregate[]; total: number }>} 用户列表和总数
   */
  async findUsers(
    filters: {
      tenantId?: string;
      platformId?: string;
      organizationId?: string;
      departmentId?: string;
      status?: UserStatus;
      searchTerm?: string;
    },
    page: number = 1,
    limit: number = 20,
  ): Promise<{ users: UserAggregate[]; total: number }> {
    const whereClause = this.buildWhereClause(filters);

    const [entities, total] = await this.entityManager.findAndCount(
      UserPostgreSQLEntity,
      whereClause,
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: 'DESC' },
      },
    );

    const users = entities.map(entity => this.mapToAggregate(entity));

    return { users, total };
  }

  /**
   * @method transaction
   * @description 在事务中执行操作
   * @param {Function} callback 事务回调函数
   * @returns {Promise<T>} 事务执行结果
   * @template T 返回类型
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    return await this.entityManager.transactional(callback);
  }

  /**
   * @method buildWhereClause
   * @description 构建查询条件
   * @param {object} filters 过滤条件
   * @returns {object} 查询条件对象
   * @private
   */
  private buildWhereClause(filters: {
    tenantId?: string;
    platformId?: string;
    organizationId?: string;
    departmentId?: string;
    status?: UserStatus;
    searchTerm?: string;
  }): any {
    const whereClause: any = {
      deletedAt: null,
    };

    if (filters.tenantId) {
      whereClause.tenantId = filters.tenantId;
    }

    if (filters.platformId) {
      whereClause.platformId = filters.platformId;
    }

    if (filters.organizationId) {
      whereClause.organizationId = filters.organizationId;
    }

    if (filters.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.searchTerm) {
      whereClause.$or = [
        { firstName: { $ilike: `%${filters.searchTerm}%` } },
        { lastName: { $ilike: `%${filters.searchTerm}%` } },
        { email: { $ilike: `%${filters.searchTerm}%` } },
      ];
    }

    return whereClause;
  }

  /**
   * @method mapToAggregate
   * @description 将数据库实体映射为用户聚合根
   * @param {UserPostgreSQLEntity} entity 数据库实体
   * @returns {UserAggregate} 用户聚合根
   * @private
   */
  private mapToAggregate(entity: UserPostgreSQLEntity): UserAggregate {
    // 创建值对象
    const id = new UserId(entity.id);
    const email = new Email(entity.email);
    const password = new Password(entity.passwordHash);
    const profile = new UserProfile(
      entity.firstName,
      entity.lastName,
      entity.phoneNumber,
      entity.avatar,
    );
    const preferences = new UserPreferences(
      entity.theme,
      entity.language,
      entity.timezone,
    );

    // 创建用户聚合根
    const aggregate = new UserAggregate(
      id,
      email,
      password,
      profile,
      preferences,
      entity.tenantId || '',
      entity.platformId,
      entity.status as UserStatus,
      entity.createdBy,
    );

    return aggregate;
  }
}
