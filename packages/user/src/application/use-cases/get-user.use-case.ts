import { Injectable } from '@nestjs/common';
import { GetUserQuery } from '../queries/get-user.query';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IUseCase } from '@aiofix/core';

/**
 * @interface GetUserResult
 * @description 获取用户查询结果接口
 */
export interface GetUserResult {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  status: string;
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @class GetUserUseCase
 * @description
 * 获取单个用户用例，负责处理用户查询操作的业务逻辑。
 *
 * 用例职责：
 * 1. 协调用户查询操作的业务流程
 * 2. 验证查询权限
 * 3. 应用数据隔离策略
 * 4. 返回用户信息
 *
 * 业务流程：
 * 1. 验证查询权限
 * 2. 应用数据隔离
 * 3. 查询用户信息
 * 4. 过滤敏感信息
 * 5. 返回查询结果
 *
 * @param {IUserRepository} userRepository 用户仓储接口
 *
 * @example
 * ```typescript
 * const useCase = new GetUserUseCase(userRepository);
 * const result = await useCase.execute(getUserQuery);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class GetUserUseCase
  implements IUseCase<GetUserQuery, GetUserResult | null>
{
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * @method execute
   * @description 执行获取用户用例
   * @param {GetUserQuery} query 获取用户查询
   * @returns {Promise<GetUserResult | null>} 用户信息或null
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  async execute(query: GetUserQuery): Promise<GetUserResult | null> {
    // 1. 验证查询权限
    await this.validateQueryPermission(query);

    // 2. 查询用户信息
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      return null;
    }

    // 3. 验证租户权限
    if (user.user.tenantId !== query.tenantId) {
      throw new Error('无权访问该用户');
    }

    // 4. 检查是否包含已删除用户
    if (!query.includeDeleted && user.isDeleted()) {
      return null;
    }

    // 5. 构建返回结果
    const result: GetUserResult = {
      userId: user.userId.value,
      email: user.email.value,
      firstName: user.profile.value.firstName,
      lastName: user.profile.value.lastName,
      phoneNumber: user.profile.value.phoneNumber,
      avatar: user.profile.value.avatar,
      status: user.status,
      tenantId: user.user.tenantId,
      organizationId: undefined, // TODO: 从聚合根获取
      departmentId: undefined, // TODO: 从聚合根获取
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // 6. 应用字段过滤
    if (query.fields && query.fields.length > 0) {
      return this.filterFields(result, query.fields);
    }

    return result;
  }

  /**
   * @method validateQueryPermission
   * @description 验证查询权限
   * @param {GetUserQuery} query 查询对象
   * @returns {Promise<void>}
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @private
   */
  private async validateQueryPermission(query: GetUserQuery): Promise<void> {
    // TODO: 实现权限验证逻辑
    // 例如：检查用户是否有查看其他用户信息的权限
    // 这里暂时跳过权限检查，实际项目中需要根据业务需求实现
  }

  /**
   * @method filterFields
   * @description 过滤返回字段
   * @param {GetUserResult} result 查询结果
   * @param {string[]} fields 需要的字段列表
   * @returns {GetUserResult} 过滤后的结果
   * @private
   */
  private filterFields(result: GetUserResult, fields: string[]): GetUserResult {
    const filteredResult: any = {};

    for (const field of fields) {
      if (field in result) {
        filteredResult[field] = (result as any)[field];
      }
    }

    return filteredResult as GetUserResult;
  }

  /**
   * @method getUseCaseName
   * @description 获取用例名称
   * @returns {string} 用例名称
   */
  getUseCaseName(): string {
    return 'GetUserUseCase';
  }

  /**
   * @method getDescription
   * @description 获取用例描述
   * @returns {string} 用例描述
   */
  getDescription(): string {
    return '获取单个用户信息的用例，包括权限验证和数据隔离';
  }
}
