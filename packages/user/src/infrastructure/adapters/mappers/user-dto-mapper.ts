import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { UserEntity } from '../../../domain/entities/user.entity';
import {
  CreateUserDto,
  UserResponseDto,
  GetUsersDto,
  AssignUserToTenantDto,
} from '../../../interfaces/dtos';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../../../domain/value-objects';

/**
 * @class UserDtoMapper
 * @description
 * 用户DTO映射器，负责在用户聚合根和DTO之间进行转换。
 *
 * 映射器职责：
 * 1. 将DTO转换为领域对象
 * 2. 将领域对象转换为响应DTO
 * 3. 处理数据验证和转换
 * 4. 确保API接口的数据格式正确
 *
 * 转换规则：
 * 1. DTO字段映射到值对象
 * 2. 值对象转换为DTO字段
 * 3. 处理可选字段和默认值
 * 4. 过滤敏感信息
 *
 * @example
 * ```typescript
 * const mapper = new UserDtoMapper();
 * const profile = mapper.toUserProfile(createUserDto);
 * const responseDto = mapper.toUserResponseDto(userAggregate);
 * ```
 * @since 1.0.0
 */
export class UserDtoMapper {
  /**
   * @method toUserProfile
   * @description 将创建用户DTO转换为用户资料值对象
   * @param {CreateUserDto} dto 创建用户DTO
   * @returns {UserProfile} 用户资料值对象
   * @throws {ValidationError} 当数据无效时抛出
   */
  toUserProfile(dto: CreateUserDto): UserProfile {
    return new UserProfile({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      avatar: dto.avatar,
    });
  }

  /**
   * @method toUserPreferences
   * @description 将创建用户DTO转换为用户偏好值对象
   * @param {CreateUserDto} dto 创建用户DTO
   * @returns {UserPreferences} 用户偏好值对象
   */
  toUserPreferences(dto: CreateUserDto): UserPreferences {
    return new UserPreferences({
      language: 'zh-CN', // 默认语言
      timezone: 'Asia/Shanghai', // 默认时区
      theme: 'light', // 默认主题
      dateFormat: 'YYYY-MM-DD', // 默认日期格式
      timeFormat: '24h', // 默认时间格式
      currency: 'CNY', // 默认货币
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
      }, // 默认通知设置
      privacy: {
        profileVisibility: 'private' as any,
        showEmail: false,
        showPhone: false,
        showLocation: false,
        allowDataCollection: false,
        allowAnalytics: false,
      }, // 默认隐私设置
      accessibility: {
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: false,
        reducedMotion: false,
      }, // 默认无障碍设置
    });
  }

  // TODO: 实现UpdateUserDto相关的方法
  // 当UpdateUserDto创建后，需要实现以下方法：
  // - toUserProfileFromUpdate
  // - toUserPreferencesFromUpdate

  /**
   * @method toUserResponseDto
   * @description 将用户聚合根转换为用户响应DTO
   * @param {UserAggregate} aggregate 用户聚合根
   * @returns {UserResponseDto} 用户响应DTO
   */
  toUserResponseDto(aggregate: UserAggregate): UserResponseDto {
    const user = aggregate.user;

    return {
      id: user.id.value,
      email: user.email.value,
      firstName: user.profile.value.firstName,
      lastName: user.profile.value.lastName,
      phoneNumber: user.profile.value.phoneNumber,
      avatar: user.profile.value.avatar,
      status: user.status.toString() as any, // 类型转换
      tenantId: user.tenantId,
      organizationId: undefined, // TODO: 从用户资料或聚合根获取
      departmentId: undefined, // TODO: 从用户资料或聚合根获取
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  /**
   * @method toUserResponseDtoList
   * @description 将用户聚合根列表转换为用户响应DTO列表
   * @param {UserAggregate[]} aggregates 用户聚合根列表
   * @returns {UserResponseDto[]} 用户响应DTO列表
   */
  toUserResponseDtoList(aggregates: UserAggregate[]): UserResponseDto[] {
    return aggregates.map(aggregate => this.toUserResponseDto(aggregate));
  }

  /**
   * @method toUserResponseDtoFromEntity
   * @description 将用户实体转换为用户响应DTO
   * @param {UserEntity} user 用户实体
   * @param {string} platformId 平台ID
   * @param {string} [tenantId] 租户ID
   * @param {string} [organizationId] 组织ID
   * @param {string} [departmentId] 部门ID
   * @param {number} [version] 版本号
   * @returns {UserResponseDto} 用户响应DTO
   */
  toUserResponseDtoFromEntity(
    user: UserEntity,
    platformId: string,
    tenantId?: string,
    organizationId?: string,
    departmentId?: string,
    version?: number,
  ): UserResponseDto {
    return {
      id: user.id.value,
      email: user.email.value,
      firstName: user.profile.value.firstName,
      lastName: user.profile.value.lastName,
      phoneNumber: user.profile.value.phoneNumber,
      avatar: user.profile.value.avatar,
      status: user.status.toString() as any, // 类型转换
      tenantId: tenantId || user.tenantId,
      organizationId,
      departmentId,
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  /**
   * @method toUserResponseDtoFromEntityList
   * @description 将用户实体列表转换为用户响应DTO列表
   * @param {UserEntity[]} users 用户实体列表
   * @param {string} platformId 平台ID
   * @param {string} [tenantId] 租户ID
   * @param {string} [organizationId] 组织ID
   * @param {string} [departmentId] 部门ID
   * @param {number} [version] 版本号
   * @returns {UserResponseDto[]} 用户响应DTO列表
   */
  toUserResponseDtoFromEntityList(
    users: UserEntity[],
    platformId: string,
    tenantId?: string,
    organizationId?: string,
    departmentId?: string,
    version?: number,
  ): UserResponseDto[] {
    return users.map(user =>
      this.toUserResponseDtoFromEntity(
        user,
        platformId,
        tenantId,
        organizationId,
        departmentId,
        version,
      ),
    );
  }

  /**
   * @method toGetUsersQuery
   * @description 将获取用户列表DTO转换为查询参数
   * @param {GetUsersDto} dto 获取用户列表DTO
   * @returns {object} 查询参数对象
   */
  toGetUsersQuery(dto: GetUsersDto): {
    organizationId?: string;
    departmentId?: string;
    status?: string;
    searchTerm?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  } {
    return {
      organizationId: dto.organizationId,
      departmentId: dto.departmentId,
      status: dto.status,
      searchTerm: dto.searchTerm,
      page: dto.page || 1,
      limit: dto.limit || 20,
      sortBy: dto.sortBy || 'createdAt',
      sortOrder: dto.sortOrder || 'desc',
    };
  }

  /**
   * @method toAssignUserToTenantData
   * @description 将分配用户到租户DTO转换为分配数据
   * @param {AssignUserToTenantDto} dto 分配用户到租户DTO
   * @returns {object} 分配数据对象
   */
  toAssignUserToTenantData(dto: AssignUserToTenantDto): {
    tenantId: string;
    role: string;
  } {
    return {
      tenantId: dto.tenantId,
      role: dto.role || 'USER',
    };
  }
}
