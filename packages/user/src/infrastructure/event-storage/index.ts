/**
 * @fileoverview 事件存储模块导出文件
 * @description 导出事件存储相关的服务、接口和模块
 * @since 1.0.0
 */

export {
  IEventStorage,
  EventStatistics,
  EventStorageError,
  ConcurrencyError,
  ValidationError,
} from './event-storage.interface';
export { MongoDBEventStorageService } from './mongodb-event-storage.service';
export { EventStorageModule } from './event-storage.module';
