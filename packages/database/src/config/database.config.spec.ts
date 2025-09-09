/**
 * @file database.config.spec.ts
 * @description 数据库配置服务单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseConfig } from './database.config';

describe('DatabaseConfig', () => {
  let service: DatabaseConfig;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
    };

    service = new DatabaseConfig(mockConfigService as any, mockLogger as any);
    configService = mockConfigService as any;
  });

  describe('getPostgreSQLConfig', () => {
    it('should return default PostgreSQL configuration', () => {
      // 模拟环境变量未设置
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const config = service.getPostgresConfig();

      expect(config).toEqual({
        host: 'localhost',
        port: 5432,
        username: 'aiofix_user',
        password: 'aiofix_password',
        database: 'aiofix_platform',
        ssl: false,
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        tenantDatabases: {
          'tenant-1': 'aiofix_tenant_1',
          'tenant-2': 'aiofix_tenant_2',
          'tenant-3': 'aiofix_tenant_3',
        },
        synchronize: false,
        logging: false,
        cache: {
          duration: 30000,
        },
      });
    });

    it('should return configured PostgreSQL configuration', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          POSTGRES_HOST: 'custom-host',
          POSTGRES_PORT: '5433',
          POSTGRES_USER: 'custom_user',
          POSTGRES_PASSWORD: 'custom_password',
          POSTGRES_DB: 'custom_database',
          POSTGRES_SSL: 'true',
          POSTGRES_POOL_MIN: '5',
          POSTGRES_POOL_MAX: '20',
        };
        return configs[key];
      });

      const config = service.getPostgresConfig();

      expect(config).toEqual({
        host: 'custom-host',
        port: 5433,
        username: 'custom_user',
        password: 'custom_password',
        database: 'custom_database',
        ssl: false,
        pool: {
          min: 5,
          max: 20,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200,
        },
        tenantDatabases: {
          'tenant-1': 'aiofix_tenant_1',
          'tenant-2': 'aiofix_tenant_2',
          'tenant-3': 'aiofix_tenant_3',
        },
        synchronize: false,
        logging: false,
        cache: {
          duration: 30000,
        },
      });
    });

    it('should handle SSL configuration as object', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') {
          return 'production';
        }
        return undefined;
      });

      const config = service.getPostgresConfig();

      expect(config.ssl).toEqual({ rejectUnauthorized: false });
    });
  });

  describe('getMongoDBConfig', () => {
    it('should return default MongoDB configuration', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const config = service.getMongoDBConfig();

      expect(config).toEqual({
        uri: 'mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin',
        databases: {
          events: 'aiofix_events',
          notifications: 'aiofix_notifications',
        },
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
        eventStore: {
          collection: 'domain_events',
          snapshotCollection: 'aggregate_snapshots',
          maxEventsPerSnapshot: 100,
        },
        notifications: {
          collection: 'notifications',
          indexes: [
            { keys: { id: 1 }, options: { unique: true } },
            { keys: { type: 1, status: 1 } },
            { keys: { tenantId: 1, userId: 1 } },
            { keys: { createdAt: 1 } },
          ],
        },
      });
    });

    it('should return configured MongoDB configuration', () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          MONGODB_URI:
            'mongodb://mongo_user:mongo_password@mongo-host:27018/mongo_database?authSource=admin',
          MONGODB_EVENTS_DB: 'custom_events',
          MONGODB_NOTIFICATIONS_DB: 'custom_notifications',
        };
        return configs[key];
      });

      const config = service.getMongoDBConfig();

      expect(config).toEqual({
        uri: 'mongodb://mongo_user:mongo_password@mongo-host:27018/mongo_database?authSource=admin',
        databases: {
          events: 'custom_events',
          notifications: 'custom_notifications',
        },
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
        eventStore: {
          collection: 'domain_events',
          snapshotCollection: 'aggregate_snapshots',
          maxEventsPerSnapshot: 100,
        },
        notifications: {
          collection: 'notifications',
          indexes: [
            { keys: { id: 1 }, options: { unique: true } },
            { keys: { type: 1, status: 1 } },
            { keys: { tenantId: 1, userId: 1 } },
            { keys: { createdAt: 1 } },
          ],
        },
      });
    });
  });

  describe('getTenantPostgresConfig', () => {
    it('should return tenant-specific PostgreSQL config', () => {
      const config = service.getTenantPostgresConfig('tenant-1');

      expect(config).toHaveProperty('database');
      expect(config.database).toBe('aiofix_tenant_1');
    });

    it('should return default tenant config for unknown tenant', () => {
      const config = service.getTenantPostgresConfig('unknown-tenant');

      expect(config).toHaveProperty('database');
      expect(config.database).toBe('aiofix_tenant_unknown-tenant');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      // Mock configService to return valid values
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          POSTGRES_HOST: 'localhost',
          POSTGRES_DB: 'test_db',
          POSTGRES_USER: 'test_user',
          POSTGRES_PASSWORD: 'test_password',
          MONGODB_URI: 'mongodb://localhost:27017/test_db',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(true);
    });

    it('should reject invalid PostgreSQL config', () => {
      // Mock configService to return invalid values
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          POSTGRES_HOST: '', // 无效的主机
          POSTGRES_DB: 'test_db',
          POSTGRES_USER: 'test_user',
          MONGODB_URI: 'mongodb://localhost:27017/test_db',
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });

    it('should reject invalid MongoDB config', () => {
      // Mock configService to return invalid values
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        const configs: Record<string, string> = {
          POSTGRES_HOST: 'localhost',
          POSTGRES_DB: 'test_db',
          POSTGRES_USER: 'test_user',
          MONGODB_URI: '', // 无效的URI
        };
        return configs[key];
      });

      const isValid = service.validateConfig();
      expect(isValid).toBe(false);
    });
  });
});
