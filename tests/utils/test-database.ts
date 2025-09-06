/**
 * 测试数据库工具
 *
 * 提供测试环境下的数据库管理功能，包括：
 * - 测试数据库连接管理
 * - 测试数据清理
 * - 数据库迁移管理
 *
 * @fileoverview 测试数据库工具
 * @author AI开发团队
 * @since 1.0.0
 */

import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

/**
 * 测试数据库配置接口
 */
export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * 测试数据库管理器
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private container: PostgreSqlContainer | null = null;
  private orm: MikroORM | null = null;
  private config: TestDatabaseConfig | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  /**
   * 启动测试数据库容器
   */
  async startContainer(): Promise<TestDatabaseConfig> {
    if (this.container) {
      return this.config!;
    }

    this.container = await new PostgreSqlContainer('postgres:13')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    this.config = {
      host: this.container.getHost(),
      port: this.container.getMappedPort(5432),
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
    };

    return this.config;
  }

  /**
   * 停止测试数据库容器
   */
  async stopContainer(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
      this.config = null;
    }
  }

  /**
   * 初始化ORM连接
   */
  async initializeORM(entities: any[]): Promise<MikroORM> {
    if (this.orm) {
      return this.orm;
    }

    if (!this.config) {
      throw new Error('测试数据库容器未启动');
    }

    this.orm = await MikroORM.init({
      type: 'postgresql',
      host: this.config.host,
      port: this.config.port,
      dbName: this.config.database,
      user: this.config.username,
      password: this.config.password,
      entities,
      migrations: {
        path: 'dist/migrations',
        pattern: /^[\w-]+\d+\.js$/,
      },
      synchronize: true, // 测试环境使用同步模式
      debug: false,
    });

    return this.orm;
  }

  /**
   * 关闭ORM连接
   */
  async closeORM(): Promise<void> {
    if (this.orm) {
      await this.orm.close();
      this.orm = null;
    }
  }

  /**
   * 清理所有测试数据
   */
  async cleanup(): Promise<void> {
    if (!this.orm) {
      return;
    }

    const em = this.orm.em.fork();

    // 获取所有实体
    const entities = this.orm.getMetadata().getAll();

    // 按依赖关系排序，先删除依赖表
    const sortedEntities = entities.sort((a, b) => {
      const aDeps = a.relations?.length || 0;
      const bDeps = b.relations?.length || 0;
      return bDeps - aDeps;
    });

    // 清理所有表
    for (const entity of sortedEntities) {
      try {
        await em.nativeDelete(entity.class, {});
      } catch (error) {
        // 忽略删除错误，继续清理其他表
        console.warn(`清理表 ${entity.name} 时出错:`, error);
      }
    }

    await em.flush();
  }

  /**
   * 重置数据库（删除并重新创建所有表）
   */
  async reset(): Promise<void> {
    if (!this.orm) {
      return;
    }

    const generator = this.orm.getSchemaGenerator();
    await generator.dropSchema();
    await generator.createSchema();
  }

  /**
   * 获取ORM实例
   */
  getORM(): MikroORM {
    if (!this.orm) {
      throw new Error('ORM未初始化');
    }
    return this.orm;
  }

  /**
   * 获取数据库配置
   */
  getConfig(): TestDatabaseConfig {
    if (!this.config) {
      throw new Error('数据库配置未初始化');
    }
    return this.config;
  }
}

/**
 * 测试数据库工具函数
 */
export class TestDatabaseUtils {
  /**
   * 创建测试数据库管理器
   */
  static createManager(): TestDatabaseManager {
    return TestDatabaseManager.getInstance();
  }

  /**
   * 等待数据库连接就绪
   */
  static async waitForConnection(
    orm: MikroORM,
    timeout = 30000,
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        await orm.em.getConnection().execute('SELECT 1');
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('数据库连接超时');
  }

  /**
   * 执行SQL脚本
   */
  static async executeSQL(orm: MikroORM, sql: string): Promise<void> {
    await orm.em.getConnection().execute(sql);
  }

  /**
   * 检查表是否存在
   */
  static async tableExists(orm: MikroORM, tableName: string): Promise<boolean> {
    const result = await orm.em.getConnection().execute(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ?
      )`,
      [tableName],
    );

    return result[0]?.exists || false;
  }

  /**
   * 获取表记录数
   */
  static async getTableCount(
    orm: MikroORM,
    tableName: string,
  ): Promise<number> {
    const result = await orm.em
      .getConnection()
      .execute(`SELECT COUNT(*) as count FROM ${tableName}`);

    return parseInt(result[0]?.count || '0', 10);
  }
}

/**
 * 测试数据库装饰器
 */
export function withTestDatabase(entities: any[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const dbManager = TestDatabaseManager.getInstance();

      try {
        // 启动数据库容器
        await dbManager.startContainer();

        // 初始化ORM
        await dbManager.initializeORM(entities);

        // 执行测试方法
        return await method.apply(this, args);
      } finally {
        // 清理测试数据
        await dbManager.cleanup();
      }
    };

    return descriptor;
  };
}

/**
 * 测试数据库Hook
 */
export class TestDatabaseHooks {
  private static dbManager: TestDatabaseManager;

  /**
   * 全局测试前设置
   */
  static async beforeAll(entities: any[]): Promise<void> {
    this.dbManager = TestDatabaseManager.getInstance();
    await this.dbManager.startContainer();
    await this.dbManager.initializeORM(entities);
  }

  /**
   * 全局测试后清理
   */
  static async afterAll(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.closeORM();
      await this.dbManager.stopContainer();
    }
  }

  /**
   * 每个测试前清理
   */
  static async beforeEach(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.cleanup();
    }
  }

  /**
   * 每个测试后清理
   */
  static async afterEach(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.cleanup();
    }
  }
}
