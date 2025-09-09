/**
 * @file database.module.spec.ts
 * @description 数据库模块单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { DatabaseConfig } from './config/database.config';

// Mock the adapters to avoid actual database connections
jest.mock('./adapters/postgresql.adapter');

describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule.register({
          postgresql: false, // 禁用PostgreSQL以避免连接测试
        }),
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Registration', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should be a valid NestJS module', () => {
      expect(module).toBeDefined();
      expect(module.get).toBeDefined();
    });
  });

  describe('Module Structure', () => {
    it('should have module methods', () => {
      expect(DatabaseModule.register).toBeDefined();
      expect(DatabaseModule.forRoot).toBeDefined();
      expect(DatabaseModule.forFeature).toBeDefined();
    });

    it('should create dynamic module', () => {
      const dynamicModule = DatabaseModule.register({ postgresql: false });
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(DatabaseModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });
  });
});
