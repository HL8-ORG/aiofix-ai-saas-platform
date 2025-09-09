import { Injectable } from '@nestjs/common';
import { ConfigService } from '@aiofix/config';
import { PinoLoggerService } from '@aiofix/logging';

/**
 * @class DatabaseConfig
 * @description
 * 数据库配置类，负责管理PostgreSQL和MongoDB的配置信息。
 *
 * 配置管理职责：
 * 1. 提供PostgreSQL数据库连接配置
 * 2. 提供MongoDB数据库连接配置
 * 3. 管理数据库连接池配置
 * 4. 支持多租户数据库配置
 *
 * 多租户支持：
 * 1. 支持租户级数据库隔离
 * 2. 动态数据库连接管理
 * 3. 租户数据库路由
 * 4. 数据库连接池优化
 *
 * @param {ConfigService} configService 配置服务
 * @param {PinoLoggerService} logger 日志服务
 *
 * @example
 * ```typescript
 * const dbConfig = new DatabaseConfig(configService, logger);
 * const postgresConfig = dbConfig.getPostgresConfig();
 * const mongodbConfig = dbConfig.getMongoDBConfig();
 * ```
 * @since 1.0.0
 */
@Injectable()
export class DatabaseConfig {
  constructor(
    private readonly _configService: ConfigService,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * @method getPostgresConfig
   * @description 获取PostgreSQL数据库配置
   * @returns {object} PostgreSQL配置对象
   *
   * 配置包含：
   * 1. 数据库连接信息
   * 2. 连接池配置
   * 3. 多租户数据库支持
   * 4. 性能优化配置
   */
  getPostgresConfig() {
    return {
      // 主数据库配置
      host: this._configService.get('POSTGRES_HOST') ?? 'localhost',
      port: parseInt(this._configService.get('POSTGRES_PORT') ?? '5432'),
      database: this._configService.get('POSTGRES_DB') ?? 'aiofix_platform',
      username: this._configService.get('POSTGRES_USER') ?? 'aiofix_user',
      password:
        this._configService.get('POSTGRES_PASSWORD') ?? 'aiofix_password',

      // 连接池配置
      pool: {
        min: parseInt(this._configService.get('POSTGRES_POOL_MIN') ?? '2'),
        max: parseInt(this._configService.get('POSTGRES_POOL_MAX') ?? '10'),
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: parseInt(
          this._configService.get('POSTGRES_POOL_IDLE_TIMEOUT') ?? '30000',
        ),
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },

      // 多租户数据库配置
      tenantDatabases: {
        'tenant-1': 'aiofix_tenant_1',
        'tenant-2': 'aiofix_tenant_2',
        'tenant-3': 'aiofix_tenant_3',
      },

      // 性能配置
      synchronize: this._configService.get('NODE_ENV') === 'development',
      logging: this._configService.get('NODE_ENV') === 'development',
      cache: {
        duration: 30000, // 30秒缓存
      },

      // SSL配置
      ssl:
        this._configService.get('NODE_ENV') === 'production'
          ? {
              rejectUnauthorized: false,
            }
          : false,
    };
  }

  /**
   * @method getMongoDBConfig
   * @description 获取MongoDB数据库配置
   * @returns {object} MongoDB配置对象
   *
   * 配置包含：
   * 1. 事件存储数据库配置
   * 2. 通知模块数据库配置
   * 3. 连接池和性能配置
   * 4. 索引和验证配置
   */
  getMongoDBConfig() {
    return {
      // 主连接URI
      uri:
        this._configService.get('MONGODB_URI') ??
        'mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin',

      // 数据库配置
      databases: {
        events: this._configService.get('MONGODB_EVENTS_DB') ?? 'aiofix_events',
        notifications:
          this._configService.get('MONGODB_NOTIFICATIONS_DB') ??
          'aiofix_notifications',
      },

      // 连接配置
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },

      // 事件存储配置
      eventStore: {
        collection: 'domain_events',
        snapshotCollection: 'aggregate_snapshots',
        maxEventsPerSnapshot: 100,
      },

      // 通知存储配置
      notifications: {
        collection: 'notifications',
        indexes: [
          { keys: { id: 1 }, options: { unique: true } },
          { keys: { type: 1, status: 1 } },
          { keys: { tenantId: 1, userId: 1 } },
          { keys: { createdAt: 1 } },
        ],
      },
    };
  }

  /**
   * @method getTenantDatabaseName
   * @description 获取租户数据库名称
   * @param {string} tenantId 租户ID
   * @returns {string} 租户数据库名称
   */
  getTenantDatabaseName(tenantId: string): string {
    const tenantDatabases = this.getPostgresConfig().tenantDatabases as Record<
      string,
      string
    >;
    return tenantDatabases[tenantId] || `aiofix_tenant_${tenantId}`;
  }

  /**
   * @method getTenantPostgresConfig
   * @description 获取租户PostgreSQL配置
   * @param {string} tenantId 租户ID
   * @returns {object} 租户PostgreSQL配置
   */
  getTenantPostgresConfig(tenantId: string) {
    const baseConfig = this.getPostgresConfig();
    return {
      ...baseConfig,
      database: this.getTenantDatabaseName(tenantId),
    };
  }

  /**
   * @method validateConfig
   * @description 验证数据库配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig(): boolean {
    try {
      const postgresConfig = this.getPostgresConfig();
      const mongodbConfig = this.getMongoDBConfig();

      // 验证PostgreSQL配置
      if (
        !postgresConfig.host ||
        !postgresConfig.database ||
        !postgresConfig.username
      ) {
        this.logger.error('PostgreSQL配置不完整');
        return false;
      }

      // 验证MongoDB配置
      if (!mongodbConfig.uri) {
        this.logger.error('MongoDB配置不完整');
        return false;
      }

      this.logger.info('数据库配置验证通过');
      return true;
    } catch (error) {
      this.logger.error('数据库配置验证失败', undefined, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
