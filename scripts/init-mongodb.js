// MongoDB 初始化脚本
// 创建事件存储集合和索引

// 切换到事件存储数据库
db = db.getSiblingDB('aiofix_events');

// 创建事件存储集合
db.createCollection('domain_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'eventId',
        'aggregateId',
        'eventType',
        'eventVersion',
        'occurredOn',
        'data',
      ],
      properties: {
        eventId: {
          bsonType: 'string',
          description: '事件唯一标识符',
        },
        aggregateId: {
          bsonType: 'string',
          description: '聚合根标识符',
        },
        eventType: {
          bsonType: 'string',
          description: '事件类型',
        },
        eventVersion: {
          bsonType: 'int',
          description: '事件版本号',
        },
        occurredOn: {
          bsonType: 'date',
          description: '事件发生时间',
        },
        data: {
          bsonType: 'object',
          description: '事件数据',
        },
        metadata: {
          bsonType: 'object',
          description: '事件元数据',
        },
        tenantId: {
          bsonType: 'string',
          description: '租户标识符',
        },
      },
    },
  },
});

// 创建事件存储索引
db.domain_events.createIndex({ eventId: 1 }, { unique: true });
db.domain_events.createIndex({ aggregateId: 1, eventVersion: 1 });
db.domain_events.createIndex({ eventType: 1 });
db.domain_events.createIndex({ occurredOn: 1 });
db.domain_events.createIndex({ tenantId: 1 });

// 创建快照集合
db.createCollection('aggregate_snapshots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['aggregateId', 'version', 'data', 'createdAt'],
      properties: {
        aggregateId: {
          bsonType: 'string',
          description: '聚合根标识符',
        },
        version: {
          bsonType: 'int',
          description: '快照版本号',
        },
        data: {
          bsonType: 'object',
          description: '聚合根状态数据',
        },
        createdAt: {
          bsonType: 'date',
          description: '快照创建时间',
        },
        tenantId: {
          bsonType: 'string',
          description: '租户标识符',
        },
      },
    },
  },
});

// 创建快照索引
db.aggregate_snapshots.createIndex(
  { aggregateId: 1, version: 1 },
  { unique: true },
);
db.aggregate_snapshots.createIndex({ tenantId: 1 });

// 创建通知模块数据库
db = db.getSiblingDB('aiofix_notifications');

// 创建通知集合
db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'type', 'status', 'createdAt'],
      properties: {
        id: {
          bsonType: 'string',
          description: '通知唯一标识符',
        },
        type: {
          bsonType: 'string',
          enum: ['in-app', 'email', 'push', 'sms'],
          description: '通知类型',
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
          description: '通知状态',
        },
        createdAt: {
          bsonType: 'date',
          description: '创建时间',
        },
        tenantId: {
          bsonType: 'string',
          description: '租户标识符',
        },
        userId: {
          bsonType: 'string',
          description: '用户标识符',
        },
      },
    },
  },
});

// 创建通知索引
db.notifications.createIndex({ id: 1 }, { unique: true });
db.notifications.createIndex({ type: 1, status: 1 });
db.notifications.createIndex({ tenantId: 1, userId: 1 });
db.notifications.createIndex({ createdAt: 1 });

print('MongoDB initialization completed successfully!');
