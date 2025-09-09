// 领域事件
export * from './domain-event';

// 值对象基类
export * from './value-object';

// 事件溯源聚合根基类
export * from './base/event-sourced-aggregate-root';

// 事件驱动架构接口
export * from './interfaces';

// 领域服务
export * from './services/event-processor.service';
export * from './services/event-store.service';
export * from './services/event-bus.service';
export * from './services/message-queue.service';

// 工具类（如果存在）
// export * from './utils';
