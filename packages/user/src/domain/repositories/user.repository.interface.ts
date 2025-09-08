import { UserAggregate } from '../aggregates/user.aggregate';
import { UserId } from '@aiofix/shared';

/**
 * @interface IUserRepository
 * @description
 * 用户仓储接口，定义用户聚合根的数据访问契约。
 *
 * 仓储职责：
 * 1. 定义用户聚合根的持久化操作
 * 2. 提供基于ID和查询条件的检索功能
 * 3. 管理数据访问的事务边界
 * 4. 实现多租户数据隔离策略
 *
 * 数据隔离要求：
 * 1. 基于租户ID进行数据隔离
 * 2. 支持组织级和部门级的数据过滤
 * 3. 确保跨租户数据安全访问
 * 4. 实现软删除和审计日志
 *
 * 性能优化：
 * 1. 使用数据库索引优化查询性能
 * 2. 实现查询结果缓存机制
 * 3. 支持分页和批量操作
 * 4. 避免N+1查询问题
 *
 * @example
 * ```typescript
 * const userRepo = new UserRepository(entityManager, tenantContext, cacheService);
 * const user = await userRepo.findById('user-123');
 * await userRepo.save(userAggregate);
 * ```
 * @since 1.0.0
 */
export interface IUserRepository {
  /**
   * @method findById
   * @description 根据ID查找用户聚合根
   * @param {string} id 用户ID
   * @returns {Promise<UserAggregate | null>} 用户聚合根或null
   * @throws {DataAccessError} 当数据访问失败时抛出
   */
  findById(id: string): Promise<UserAggregate | null>;

  /**
   * @method findByEmail
   * @description 根据邮箱查找用户聚合根
   * @param {string} email 用户邮箱
   * @param {string} tenantId 租户ID
   * @returns {Promise<UserAggregate | null>} 用户聚合根或null
   * @throws {DataAccessError} 当数据访问失败时抛出
   */
  findByEmail(email: string, tenantId: string): Promise<UserAggregate | null>;

  /**
   * @method save
   * @description 保存用户聚合根到数据库
   * @param {UserAggregate} userAggregate 用户聚合根
   * @returns {Promise<void>}
   * @throws {DataAccessError} 当数据保存失败时抛出
   * @throws {ConcurrencyError} 当并发冲突时抛出
   */
  save(userAggregate: UserAggregate): Promise<void>;

  /**
   * @method delete
   * @description 删除用户聚合根
   * @param {string} id 用户ID
   * @returns {Promise<void>}
   * @throws {DataAccessError} 当数据删除失败时抛出
   */
  delete(id: string): Promise<void>;

  /**
   * @method findUsers
   * @description 查找用户列表
   * @param {UserFilters} filters 用户过滤器
   * @param {PaginationOptions} pagination 分页选项
   * @returns {Promise<PaginatedResult<UserAggregate>>} 分页的用户列表
   * @throws {DataAccessError} 当数据访问失败时抛出
   */
  findUsers(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<UserAggregate>>;

  /**
   * @method transaction
   * @description 在事务中执行操作
   * @param {Function} callback 事务回调函数
   * @returns {Promise<T>} 事务执行结果
   * @template T 返回类型
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

/**
 * @interface UserFilters
 * @description 用户查询过滤器接口
 */
export interface UserFilters {
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  status?: string;
  searchTerm?: string;
}

/**
 * @interface PaginationOptions
 * @description 分页选项接口
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * @interface PaginatedResult
 * @description 分页结果接口
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
