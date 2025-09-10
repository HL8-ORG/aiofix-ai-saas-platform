import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UserPostgreSQLEntity } from '../user.postgresql.entity';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../../../domain/value-objects';

/**
 * @class UserAggregateMapper
 * @description
 * 用户聚合根映射器，负责在用户聚合根和数据库实体之间进行转换。
 *
 * 映射器职责：
 * 1. 将用户聚合根转换为数据库实体
 * 2. 将数据库实体转换为用户聚合根
 * 3. 处理值对象和基本类型之间的转换
 * 4. 确保数据完整性和一致性
 *
 * 转换规则：
 * 1. 聚合根ID转换为数据库主键
 * 2. 值对象转换为对应的数据库字段
 * 3. 处理嵌套对象的序列化
 * 4. 处理枚举类型的转换
 *
 * @example
 * ```typescript
 * const mapper = new UserAggregateMapper();
 * const entity = mapper.toEntity(userAggregate);
 * const aggregate = mapper.toAggregate(entity);
 * ```
 * @since 1.0.0
 */
export class UserAggregateMapper {
  /**
   * @method toEntity
   * @description 将用户聚合根转换为数据库实体
   * @param {UserAggregate} aggregate 用户聚合根
   * @returns {UserPostgreSQLEntity} 数据库实体
   * @throws {MappingError} 当映射失败时抛出
   *
   * 转换流程：
   * 1. 提取聚合根中的用户实体
   * 2. 转换值对象为基本类型
   * 3. 处理嵌套对象序列化
   * 4. 设置审计字段
   */
  toEntity(aggregate: UserAggregate): UserPostgreSQLEntity {
    const user = aggregate.user;

    const entity = new UserPostgreSQLEntity();

    // 基本信息
    entity.id = user.id.value;
    entity.email = user.email.value;
    entity.passwordHash = user.password.value;
    entity.status = user.status.toString();

    // 用户资料
    const profile = user.profile.value;
    entity.firstName = profile.firstName;
    entity.lastName = profile.lastName;
    entity.phoneNumber = profile.phoneNumber || undefined;
    entity.avatar = profile.avatar || undefined;

    // 用户偏好
    const preferences = user.preferences.value;
    entity.language = preferences.language;
    entity.timezone = preferences.timezone;
    entity.theme = preferences.theme;

    // 平台信息
    entity.platformId = aggregate.platformId;
    entity.tenantId = user.tenantId;
    entity.organizationId = undefined; // TODO: 从用户资料或聚合根获取
    entity.departmentId = undefined; // TODO: 从用户资料或聚合根获取

    // 审计信息
    entity.createdAt = user.getCreatedAt();
    entity.updatedAt = user.getUpdatedAt();
    entity.deletedAt = user.getDeletedAt() || undefined;
    entity.createdBy = user.getCreatedBy();
    entity.updatedBy = user.getUpdatedBy();

    // 版本控制
    entity.version = 1; // TODO: 从聚合根获取版本号

    return entity;
  }

  /**
   * @method toAggregate
   * @description 将数据库实体转换为用户聚合根
   * @param {UserPostgreSQLEntity} entity 数据库实体
   * @returns {UserAggregate} 用户聚合根
   * @throws {MappingError} 当映射失败时抛出
   *
   * 转换流程：
   * 1. 创建值对象实例
   * 2. 构建用户实体
   * 3. 创建聚合根实例
   * 4. 设置聚合根属性
   */
  toAggregate(entity: UserPostgreSQLEntity): UserAggregate {
    // 创建值对象
    const userId = new UserId(entity.id);
    const email = new Email(entity.email);
    const password = Password.fromHashed(entity.passwordHash);

    // 创建用户资料
    const profile = new UserProfile({
      firstName: entity.firstName,
      lastName: entity.lastName,
      phoneNumber: entity.phoneNumber || undefined,
      avatar: entity.avatar || undefined,
    });

    // 创建用户偏好
    const preferences = new UserPreferences({
      language: entity.language,
      timezone: entity.timezone,
      theme: entity.theme,
      dateFormat: 'YYYY-MM-DD', // 默认值
      timeFormat: '24h', // 默认值
      currency: 'CNY', // 默认值
      notifications: {
        email: { enabled: true, channels: [], frequency: 'immediate' as any },
        sms: { enabled: false, channels: [], frequency: 'immediate' as any },
        push: { enabled: true, channels: [], frequency: 'immediate' as any },
        in_app: { enabled: true, channels: [], frequency: 'immediate' as any },
        system: { enabled: true, channels: [], frequency: 'immediate' as any },
        security: {
          enabled: true,
          channels: [],
          frequency: 'immediate' as any,
        },
        marketing: {
          enabled: false,
          channels: [],
          frequency: 'immediate' as any,
        },
      },
      privacy: {
        profileVisibility: 'private' as any,
        showEmail: false,
        showPhone: false,
        showLocation: false,
        allowDataCollection: false,
        allowAnalytics: false,
      },
      accessibility: {
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: false,
        reducedMotion: false,
      },
    });

    // 创建用户状态
    const status = entity.status as UserStatus;

    // 创建聚合根
    const aggregate = new UserAggregate(
      userId,
      email,
      password,
      profile,
      preferences,
      entity.tenantId || '',
      entity.platformId,
      status,
      entity.createdBy,
    );

    return aggregate;
  }

  /**
   * @method toEntityList
   * @description 将用户聚合根列表转换为数据库实体列表
   * @param {UserAggregate[]} aggregates 用户聚合根列表
   * @returns {UserPostgreSQLEntity[]} 数据库实体列表
   */
  toEntityList(aggregates: UserAggregate[]): UserPostgreSQLEntity[] {
    return aggregates.map(aggregate => this.toEntity(aggregate));
  }

  /**
   * @method toAggregateList
   * @description 将数据库实体列表转换为用户聚合根列表
   * @param {UserPostgreSQLEntity[]} entities 数据库实体列表
   * @returns {UserAggregate[]} 用户聚合根列表
   */
  toAggregateList(entities: UserPostgreSQLEntity[]): UserAggregate[] {
    return entities.map(entity => this.toAggregate(entity));
  }

  /**
   * @method updateEntityFromAggregate
   * @description 从聚合根更新数据库实体
   * @param {UserPostgreSQLEntity} entity 数据库实体
   * @param {UserAggregate} aggregate 用户聚合根
   * @returns {UserPostgreSQLEntity} 更新后的数据库实体
   */
  updateEntityFromAggregate(
    entity: UserPostgreSQLEntity,
    aggregate: UserAggregate,
  ): UserPostgreSQLEntity {
    const user = aggregate.user;

    // 更新基本信息
    entity.email = user.email.value;
    entity.passwordHash = user.password.value;
    entity.status = user.status.toString();

    // 更新用户资料
    const profile = user.profile.value;
    entity.firstName = profile.firstName;
    entity.lastName = profile.lastName;
    entity.phoneNumber = profile.phoneNumber || undefined;
    entity.avatar = profile.avatar || undefined;

    // 更新用户偏好
    const preferences = user.preferences.value;
    entity.language = preferences.language;
    entity.timezone = preferences.timezone;
    entity.theme = preferences.theme;

    // 更新平台信息
    entity.platformId = aggregate.platformId;
    entity.tenantId = user.tenantId;
    entity.organizationId = undefined; // TODO: 从用户资料或聚合根获取
    entity.departmentId = undefined; // TODO: 从用户资料或聚合根获取

    // 更新审计信息
    entity.updatedAt = user.getUpdatedAt();
    entity.updatedBy = user.getUpdatedBy();
    entity.deletedAt = user.getDeletedAt() || undefined;

    // 更新版本
    entity.version = 1; // TODO: 从聚合根获取版本号

    return entity;
  }
}
