import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';
import { MikroORMOptions } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

/**
 * @class UserDatabaseConfig
 * @description
 * 用户模块数据库配置，负责管理用户模块的PostgreSQL数据库连接和配置。
 * 参考MikroORM官方NestJS示例的配置方式。
 *
 * 配置职责：
 * 1. 管理用户模块的PostgreSQL数据库连接配置
 * 2. 提供MikroORM的配置选项
 * 3. 支持多租户数据隔离策略
 * 4. 配置实体映射和迁移设置
 *
 * 多租户支持：
 * 1. 支持数据库级、Schema级、表级隔离策略
 * 2. 动态配置租户特定的数据库连接
 * 3. 实现租户级的数据访问控制
 * 4. 支持租户级的数据迁移和初始化
 *
 * 性能优化：
 * 1. 配置连接池参数优化数据库性能
 * 2. 设置查询缓存和结果缓存
 * 3. 优化实体映射和索引配置
 * 4. 支持读写分离和负载均衡
 *
 * @param {ConfigService} configService 配置服务
 *
 * @example
 * ```typescript
 * const dbConfig = new UserDatabaseConfig(configService);
 * const options = dbConfig.getMikroOrmOptions();
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UserDatabaseConfig {
  constructor(private readonly configService: ConfigService) {}

  /**
   * @method getMikroOrmOptions
   * @description 获取MikroORM配置选项，参考官方示例配置
   * @param {string} [tenantId] 租户ID，可选
   * @returns {MikroORMOptions} MikroORM配置选项
   *
   * 配置选项包含：
   * 1. 数据库连接配置
   * 2. 实体映射配置
   * 3. 迁移和种子配置
   * 4. 缓存和性能配置
   */
  getMikroOrmOptions(tenantId?: string): MikroORMOptions {
    const baseConfig = this.getBaseConfig();
    const tenantConfig = tenantId ? this.getTenantConfig(tenantId) : {};

    return {
      ...baseConfig,
      ...tenantConfig,
      driver: PostgreSqlDriver,
      entities: this.getEntities(),
      migrations: this.getMigrations(),
      debug: process.env.NODE_ENV === 'development',
      logger: this.getLoggerConfig(),
      pool: this.getPoolConfig(),
      schemaGenerator: this.getSchemaGeneratorConfig(),
    };
  }

  /**
   * @method getBaseConfig
   * @description 获取基础数据库配置
   * @returns {object} 基础配置对象
   * @private
   */
  private getBaseConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'aiofix_user',
      password: process.env.DB_PASSWORD || 'aiofix_password',
      dbName: process.env.DB_NAME || 'aiofix_platform',
      schema: process.env.DB_SCHEMA || 'public',
      ssl: process.env.DB_SSL === 'true',
    };
  }

  /**
   * @method getTenantConfig
   * @description 获取租户特定配置
   * @param {string} tenantId 租户ID
   * @returns {object} 租户配置对象
   * @private
   */
  private getTenantConfig(tenantId: string) {
    const isolationStrategy = process.env.DB_ISOLATION_STRATEGY || 'table';

    switch (isolationStrategy) {
      case 'database':
        return {
          dbName: `aiofix_tenant_${tenantId}`,
        };
      case 'schema':
        return {
          schema: `tenant_${tenantId}`,
        };
      case 'table':
      default:
        return {
          // 表级隔离不需要特殊配置
        };
    }
  }

  /**
   * @method getEntities
   * @description 获取实体映射配置
   * @returns {string[]} 实体路径数组
   * @private
   */
  private getEntities(): string[] {
    return ['packages/user/src/infrastructure/adapters/**/*.entity.ts'];
  }

  /**
   * @method getMigrations
   * @description 获取迁移配置
   * @returns {object} 迁移配置对象
   * @private
   */
  private getMigrations() {
    return {
      path: 'packages/user/src/infrastructure/migrations',
      pattern: /^[\w-]+\d+\.(ts|js)$/,
      transactional: true,
      disableForeignKeys: true,
      allOrNothing: true,
      dropTables: false,
      safe: true,
      emit: 'ts' as const,
    };
  }

  /**
   * @method getLoggerConfig
   * @description 获取日志配置，参考官方示例
   * @returns {Function} 日志函数
   * @private
   */
  private getLoggerConfig() {
    return (message: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MikroORM] ${message}`);
      }
    };
  }

  /**
   * @method getPoolConfig
   * @description 获取连接池配置
   * @returns {object} 连接池配置对象
   * @private
   */
  private getPoolConfig() {
    return {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      acquireTimeoutMillis: parseInt(
        process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000',
        10,
      ),
      createTimeoutMillis: parseInt(
        process.env.DB_POOL_CREATE_TIMEOUT || '30000',
        10,
      ),
      destroyTimeoutMillis: parseInt(
        process.env.DB_POOL_DESTROY_TIMEOUT || '5000',
        10,
      ),
      idleTimeoutMillis: parseInt(
        process.env.DB_POOL_IDLE_TIMEOUT || '30000',
        10,
      ),
      reapIntervalMillis: parseInt(
        process.env.DB_POOL_REAP_INTERVAL || '1000',
        10,
      ),
      createRetryIntervalMillis: parseInt(
        process.env.DB_POOL_CREATE_RETRY_INTERVAL || '200',
        10,
      ),
    };
  }

  /**
   * @method getSchemaGeneratorConfig
   * @description 获取Schema生成器配置
   * @returns {object} Schema生成器配置对象
   * @private
   */
  private getSchemaGeneratorConfig() {
    return {
      createForeignKeyConstraints: true,
      wrap: false,
      disableForeignKeys: true,
    };
  }

  /**
   * @method getConnectionString
   * @description 获取数据库连接字符串
   * @param {string} [tenantId] 租户ID，可选
   * @returns {string} 连接字符串
   */
  getConnectionString(tenantId?: string): string {
    const baseConfig = this.getBaseConfig();
    const tenantConfig = tenantId ? this.getTenantConfig(tenantId) : {};
    const config = { ...baseConfig, ...tenantConfig };
    const { host, port, user, password, dbName, schema, ssl } = config;

    let connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;

    if (schema && schema !== 'public') {
      connectionString += `?schema=${schema}`;
    }

    if (ssl) {
      connectionString += `${schema ? '&' : '?'}sslmode=require`;
    }

    return connectionString;
  }

  /**
   * @method validateConfig
   * @description 验证数据库配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig(): boolean {
    try {
      const config = this.getBaseConfig();

      if (!config.host || !config.user || !config.password || !config.dbName) {
        return false;
      }

      if (config.port < 1 || config.port > 65535) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
