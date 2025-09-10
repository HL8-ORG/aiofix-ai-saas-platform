import { Module } from '@nestjs/common';
import { MongoDBEventStorageService } from './mongodb-event-storage.service';
import { IEventStorage } from './event-storage.interface';

/**
 * @class EventStorageModule
 * @description
 * 事件存储模块，提供事件存储服务的依赖注入和配置。
 *
 * 模块职责：
 * 1. 提供事件存储服务的依赖注入
 * 2. 配置事件存储服务的实现
 * 3. 管理事件存储服务的生命周期
 * 4. 提供事件存储服务的统一接口
 *
 * 服务提供：
 * 1. IEventStorage - 事件存储服务接口
 * 2. MongoDBEventStorageService - MongoDB事件存储服务实现
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [EventStorageModule],
 *   providers: [UserService],
 * })
 * export class UserModule {}
 * ```
 * @since 1.0.0
 */
@Module({
  providers: [
    {
      provide: 'IEventStorage',
      useClass: MongoDBEventStorageService,
    },
    MongoDBEventStorageService,
  ],
  exports: ['IEventStorage', MongoDBEventStorageService],
})
export class EventStorageModule {}
