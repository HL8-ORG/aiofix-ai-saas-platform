import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserDatabaseConfig } from '../config/user-database.config';
import { UserPostgreSQLEntity } from '../adapters/user.postgresql.entity';

/**
 * @class UserDatabaseModule
 * @description
 * 用户数据库模块，负责配置和管理用户模块的PostgreSQL数据库连接。
 *
 * 模块职责：
 * 1. 配置MikroORM与PostgreSQL数据库的连接
 * 2. 注册用户相关的数据库实体
 * 3. 提供数据库连接和实体管理器
 * 4. 支持多租户数据隔离策略
 *
 * 多租户支持：
 * 1. 支持数据库级、Schema级、表级隔离策略
 * 2. 动态配置租户特定的数据库连接
 * 3. 实现租户级的数据访问控制
 * 4. 支持租户级的数据迁移和初始化
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [UserDatabaseModule],
 *   providers: [UserRepository],
 * })
 * export class UserModule {}
 * ```
 * @since 1.0.0
 */
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useFactory: (config: UserDatabaseConfig) => {
        return config.getMikroOrmOptions();
      },
      inject: [UserDatabaseConfig],
    }),
    MikroOrmModule.forFeature([UserPostgreSQLEntity]),
  ],
  providers: [UserDatabaseConfig],
  exports: [MikroOrmModule, UserDatabaseConfig],
})
export class UserDatabaseModule {}
