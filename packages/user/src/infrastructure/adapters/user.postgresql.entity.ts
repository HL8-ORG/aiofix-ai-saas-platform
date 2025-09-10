import { Entity, PrimaryKey, Property, Index, Unique } from '@mikro-orm/core';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';

/**
 * @class UserPostgreSQLEntity
 * @description
 * 用户PostgreSQL数据库实体，负责将用户聚合根映射到PostgreSQL数据库表。
 *
 * 实体映射职责：
 * 1. 定义用户数据在PostgreSQL中的表结构
 * 2. 提供聚合根与数据库实体的转换方法
 * 3. 支持多租户数据隔离策略
 * 4. 优化查询性能和索引配置
 *
 * 多租户支持：
 * 1. 支持数据库级、Schema级、表级隔离策略
 * 2. 通过tenant_id字段实现表级隔离
 * 3. 支持租户级的数据访问控制
 * 4. 确保跨租户数据安全
 *
 * 性能优化：
 * 1. 建立复合索引优化查询性能
 * 2. 使用唯一约束确保数据完整性
 * 3. 支持软删除和审计追踪
 * 4. 优化存储空间和查询效率
 *
 * @property {string} id 用户唯一标识符，主键
 * @property {string} email 用户邮箱地址，唯一约束
 * @property {string} passwordHash 用户密码哈希值
 * @property {string} firstName 用户名字
 * @property {string} lastName 用户姓氏
 * @property {string} [phoneNumber] 用户电话号码，可选
 * @property {string} [avatar] 用户头像URL，可选
 * @property {string} status 用户状态
 * @property {string} [tenantId] 租户ID，用于多租户隔离
 * @property {string} platformId 平台ID，用于平台级隔离
 * @property {string} [organizationId] 组织ID，可选
 * @property {string} [departmentId] 部门ID，可选
 * @property {string} theme 用户界面主题
 * @property {string} language 用户语言偏好
 * @property {string} timezone 用户时区设置
 * @property {Date} createdAt 创建时间
 * @property {Date} updatedAt 最后更新时间
 * @property {Date} [deletedAt] 删除时间，软删除
 * @property {string} createdBy 创建者ID
 * @property {string} updatedBy 最后更新者ID
 * @property {number} version 数据版本号，乐观锁
 *
 * @example
 * ```typescript
 * const userEntity = new UserPostgreSQLEntity();
 * userEntity.id = 'user-123';
 * userEntity.email = 'user@example.com';
 * // ... 设置其他属性
 * ```
 * @since 1.0.0
 */
@Entity({ tableName: 'users' })
@Index({ properties: ['tenantId', 'status', 'createdAt'] })
@Index({ properties: ['platformId', 'status'] })
@Index({ properties: ['organizationId', 'status'] })
@Index({ properties: ['departmentId', 'status'] })
@Unique({ properties: ['email', 'tenantId'] })
export class UserPostgreSQLEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  email!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Property({ type: 'varchar', length: 100 })
  firstName!: string;

  @Property({ type: 'varchar', length: 100 })
  lastName!: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @Property({ type: 'varchar', length: 20 })
  status!: string;

  @Property({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Property({ type: 'uuid' })
  platformId!: string;

  @Property({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Property({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Property({ type: 'varchar', length: 50 })
  theme!: string;

  @Property({ type: 'varchar', length: 10 })
  language!: string;

  @Property({ type: 'varchar', length: 50 })
  timezone!: string;

  @Property({ type: 'timestamp' })
  createdAt!: Date;

  @Property({ type: 'timestamp' })
  updatedAt!: Date;

  @Property({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Property({ type: 'varchar', length: 255 })
  createdBy!: string;

  @Property({ type: 'varchar', length: 255 })
  updatedBy!: string;

  @Property({ type: 'int' })
  version!: number;

  /**
   * @method fromAggregate
   * @description 从用户聚合根创建数据库实体
   * @param {UserAggregate} aggregate 用户聚合根
   * @returns {UserPostgreSQLEntity} 数据库实体
   * @static
   */
  static fromAggregate(aggregate: UserAggregate): UserPostgreSQLEntity {
    const entity = new UserPostgreSQLEntity();
    entity.id = aggregate.id;
    entity.email = aggregate.email.value;
    entity.passwordHash = aggregate.user.password.value;
    entity.firstName = aggregate.profile.value.firstName;
    entity.lastName = aggregate.profile.value.lastName;
    entity.phoneNumber = aggregate.profile.value.phoneNumber;
    entity.avatar = aggregate.profile.value.avatar;
    entity.status = aggregate.status;
    entity.tenantId = aggregate.user.tenantId;
    entity.platformId = aggregate.user.platformId;
    entity.organizationId = undefined; // TODO: 从用户资料或聚合根获取
    entity.departmentId = undefined; // TODO: 从用户资料或聚合根获取
    entity.theme = aggregate.preferences.value.theme;
    entity.language = aggregate.preferences.value.language;
    entity.timezone = aggregate.preferences.value.timezone;
    entity.createdAt = aggregate.createdAt;
    entity.updatedAt = aggregate.updatedAt;
    entity.createdBy = aggregate.user.getCreatedBy();
    entity.updatedBy = aggregate.user.getUpdatedBy();
    entity.version = aggregate.user.getVersion();

    return entity;
  }

  /**
   * @method toAggregate
   * @description 将数据库实体转换为用户聚合根
   * @returns {UserAggregate} 用户聚合根
   */
  toAggregate(): UserAggregate {
    // 这里需要导入相关的值对象和实体类
    // 由于循环依赖问题，这个方法将在仓储中实现
    throw new Error('toAggregate method should be implemented in repository');
  }
}
