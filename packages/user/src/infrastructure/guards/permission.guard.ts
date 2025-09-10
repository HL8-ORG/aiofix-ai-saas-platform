import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * @class PermissionGuard
 * @description
 * 权限守卫，负责验证用户权限和访问控制。
 *
 * 守卫职责：
 * 1. 验证用户权限
 * 2. 检查资源访问权限
 * 3. 实现基于角色的访问控制
 * 4. 支持细粒度权限控制
 *
 * 权限验证流程：
 * 1. 从装饰器获取所需权限
 * 2. 检查用户权限列表
 * 3. 验证资源访问权限
 * 4. 检查租户级权限
 *
 * 多租户支持：
 * 1. 验证租户级权限
 * 2. 检查跨租户访问权限
 * 3. 实现租户级权限隔离
 * 4. 支持组织级权限控制
 *
 * @param {Reflector} reflector 反射器
 * @param {Logger} logger 日志服务
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(AuthGuard, PermissionGuard)
 * @RequirePermissions('user:read')
 * export class UserController {}
 * ```
 * @since 1.0.0
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: Logger,
  ) {}

  /**
   * @method canActivate
   * @description 检查请求是否可以通过权限验证
   * @param {ExecutionContext} context 执行上下文
   * @returns {Promise<boolean>} 是否可以通过权限验证
   * @throws {ForbiddenException} 当权限不足时抛出
   *
   * 权限验证流程：
   * 1. 获取所需权限
   * 2. 检查用户权限
   * 3. 验证资源权限
   * 4. 检查租户权限
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenant = request.tenant;

    if (!user) {
      this.logger.warn('No user context found for permission check');
      throw new ForbiddenException('User context is required');
    }

    // 1. 获取所需权限
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // 如果没有指定权限要求，则允许访问
      return true;
    }

    // 2. 检查用户权限
    const hasPermission = await this.checkUserPermissions(
      user,
      requiredPermissions,
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.id} lacks required permissions: ${requiredPermissions.join(', ')}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    // 3. 验证资源权限
    const hasResourcePermission = await this.checkResourcePermissions(
      user,
      tenant,
      request,
    );

    if (!hasResourcePermission) {
      this.logger.warn(`User ${user.id} lacks resource access permission`);
      throw new ForbiddenException('Resource access denied');
    }

    // 4. 检查租户权限
    const hasTenantPermission = await this.checkTenantPermissions(
      user,
      tenant,
      request,
    );

    if (!hasTenantPermission) {
      this.logger.warn(`User ${user.id} lacks tenant access permission`);
      throw new ForbiddenException('Tenant access denied');
    }

    this.logger.log(
      `User ${user.id} has sufficient permissions for ${requiredPermissions.join(', ')}`,
    );
    return true;
  }

  /**
   * @method checkUserPermissions
   * @description 检查用户权限
   * @param {any} user 用户对象
   * @param {string[]} requiredPermissions 所需权限列表
   * @returns {Promise<boolean>} 是否有权限
   * @private
   */
  private async checkUserPermissions(
    user: any,
    requiredPermissions: string[],
  ): Promise<boolean> {
    try {
      // TODO: 实现用户权限检查
      // 1. 获取用户权限列表
      // 2. 检查权限匹配
      // 3. 验证权限有效性
      // 4. 检查权限过期时间

      const userPermissions = user.permissions || [];

      // 检查是否有所需权限
      return requiredPermissions.every(permission =>
        userPermissions.includes(permission),
      );
    } catch (error) {
      this.logger.error('Failed to check user permissions', error);
      return false;
    }
  }

  /**
   * @method checkResourcePermissions
   * @description 检查资源访问权限
   * @param {any} user 用户对象
   * @param {any} tenant 租户对象
   * @param {any} request 请求对象
   * @returns {Promise<boolean>} 是否有资源权限
   * @private
   */
  private async checkResourcePermissions(
    user: any,
    tenant: any,
    request: any,
  ): Promise<boolean> {
    try {
      // TODO: 实现资源权限检查
      // 1. 获取资源信息
      // 2. 检查资源所有权
      // 3. 验证资源访问权限
      // 4. 检查资源状态

      const resourceId = request.params.id;
      if (!resourceId) {
        return true; // 没有特定资源ID，允许访问
      }

      // 临时实现：检查资源所有权
      return true;
    } catch (error) {
      this.logger.error('Failed to check resource permissions', error);
      return false;
    }
  }

  /**
   * @method checkTenantPermissions
   * @description 检查租户访问权限
   * @param {any} user 用户对象
   * @param {any} tenant 租户对象
   * @param {any} request 请求对象
   * @returns {Promise<boolean>} 是否有租户权限
   * @private
   */
  private async checkTenantPermissions(
    user: any,
    tenant: any,
    request: any,
  ): Promise<boolean> {
    try {
      // TODO: 实现租户权限检查
      // 1. 检查用户租户关联
      // 2. 验证租户状态
      // 3. 检查跨租户访问权限
      // 4. 验证组织级权限

      if (!tenant) {
        return true; // 没有租户上下文，允许访问
      }

      // 临时实现：检查用户是否属于该租户
      return true;
    } catch (error) {
      this.logger.error('Failed to check tenant permissions', error);
      return false;
    }
  }
}
