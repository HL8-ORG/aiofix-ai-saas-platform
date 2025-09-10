import { SetMetadata } from '@nestjs/common';

/**
 * @constant PERMISSIONS_KEY
 * @description 权限元数据键
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * @function RequirePermissions
 * @description
 * 权限装饰器，用于指定访问控制器或方法所需的权限。
 *
 * 装饰器功能：
 * 1. 指定访问所需的权限列表
 * 2. 支持多个权限的组合
 * 3. 与PermissionGuard配合使用
 * 4. 提供细粒度权限控制
 *
 * 权限验证：
 * 1. 检查用户是否具有指定权限
 * 2. 支持权限的AND逻辑组合
 * 3. 验证租户级权限
 * 4. 检查资源级权限
 *
 * @param {...string[]} permissions 所需权限列表
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @RequirePermissions('user:read')
 * export class UserController {
 *   @Get()
 *   @RequirePermissions('user:list')
 *   async getUsers() {}
 *
 *   @Post()
 *   @RequirePermissions('user:create')
 *   async createUser() {}
 *
 *   @Put(':id')
 *   @RequirePermissions('user:update', 'user:own')
 *   async updateUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
