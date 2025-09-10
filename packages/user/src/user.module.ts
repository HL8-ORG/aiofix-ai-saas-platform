import { Module } from '@nestjs/common';
import { UserDatabaseModule } from './infrastructure/database/user-database.module';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserApplicationService } from './application/services/user-application.service';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case';
import { AssignUserToTenantUseCase } from './application/use-cases/assign-user-to-tenant.use-case';
import { UserController } from './interfaces/controllers/user.controller';

/**
 * @class UserModule
 * @description
 * 用户模块，负责用户管理、认证和权限控制。
 *
 * 模块职责：
 * 1. 提供用户管理的完整功能
 * 2. 集成用户数据库和仓储
 * 3. 提供用户应用服务
 * 4. 支持多租户数据隔离
 *
 * 功能特性：
 * 1. 用户创建、更新、删除
 * 2. 用户状态管理
 * 3. 用户偏好设置
 * 4. 用户租户分配
 * 5. 用户查询和搜索
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [UserModule],
 *   providers: [UserService],
 * })
 * export class AppModule {}
 * ```
 * @since 1.0.0
 */
@Module({
  imports: [UserDatabaseModule],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserApplicationService,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    GetUsersUseCase,
    AssignUserToTenantUseCase,
  ],
  exports: [
    UserRepository,
    UserApplicationService,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserUseCase,
    GetUsersUseCase,
    AssignUserToTenantUseCase,
  ],
})
export class UserModule {}
