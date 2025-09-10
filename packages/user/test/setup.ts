/**
 * @fileoverview 测试设置文件
 * @description 配置测试环境和全局设置
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * 全局测试设置
 */
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    'postgresql://test:test@localhost:5432/aiofix_user_test';
  process.env.MONGODB_URL = 'mongodb://localhost:27017/aiofix_events_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

/**
 * 清理测试环境
 */
afterAll(async () => {
  // 清理测试数据
  // 关闭数据库连接
  // 清理缓存
});

/**
 * 创建测试应用
 */
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [module],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

/**
 * 关闭测试应用
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
