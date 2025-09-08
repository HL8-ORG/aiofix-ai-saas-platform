# 包结构重构文档

## 概述

本文档描述了将通用模块从`packages/common`中分离为独立包的重构方案，提高模块的独立性和可维护性。

## 重构背景

### 原有问题

- `packages/common`包过于庞大，包含了多个功能模块
- 模块间耦合度高，难以独立开发和测试
- 依赖管理复杂，影响构建性能
- 不符合单一职责原则

### 重构目标

- 提高模块独立性
- 简化依赖管理
- 支持按需引入
- 便于独立开发和测试

## 新的包结构

### 1. 包结构概览

```
packages/
├── core/                    # 核心领域模型和事件溯源
├── common/                  # 通用工具和类型（简化后）
├── logging/                 # 日志模块（新增）
├── config/                  # 配置模块（新增）
├── cache/                   # 缓存模块（新增）
├── notification/            # 通知模块（新增）
├── database/                # 数据库模块（新增）
└── [其他业务包]/
```

### 2. 各包详细说明

#### 2.1 @aiofix/logging - 日志模块

**职责**：提供统一的日志记录功能
**功能**：

- 多级别日志记录（debug, info, warn, error）
- 日志格式化
- 日志轮转
- 结构化日志
- NestJS集成

**依赖**：

- winston
- winston-daily-rotate-file

**导出**：

```typescript
export * from './services/logging.service';
export * from './interfaces/logging.interface';
export * from './config/logging.config';
export * from './logging.module';
```

#### 2.2 @aiofix/config - 配置模块

**职责**：提供统一的配置管理功能
**功能**：

- 环境变量管理
- 配置验证
- 配置类型安全
- 配置热重载
- NestJS集成

**依赖**：

- class-validator
- class-transformer
- dotenv

**导出**：

```typescript
export * from './services/config.service';
export * from './interfaces/config.interface';
export * from './config/app.config';
export * from './config/database.config';
export * from './config/redis.config';
export * from './config.module';
```

#### 2.3 @aiofix/cache - 缓存模块

**职责**：提供统一的缓存管理功能
**功能**：

- Redis缓存
- 内存缓存
- 缓存策略
- 缓存失效
- NestJS集成

**依赖**：

- redis
- ioredis

**导出**：

```typescript
export * from './services/cache.service';
export * from './interfaces/cache.interface';
export * from './strategies/redis-cache.strategy';
export * from './strategies/memory-cache.strategy';
export * from './cache.module';
```

#### 2.4 @aiofix/notif - 通知模块

**职责**：提供统一的通知发送功能
**功能**：

- 邮件通知
- 短信通知
- 推送通知
- 通知模板
- NestJS集成

**依赖**：

- nodemailer
- twilio

**导出**：

```typescript
export * from './services/notification.service';
export * from './interfaces/notification.interface';
export * from './channels/email.channel';
export * from './channels/sms.channel';
export * from './channels/push.channel';
export * from './notification.module';
```

#### 2.5 @aiofix/database - 数据库模块

**职责**：提供统一的数据库管理功能
**功能**：

- MikroORM集成
- 数据库连接管理
- 迁移管理
- 多数据库支持
- NestJS集成

**依赖**：

- @mikro-orm/core
- @mikro-orm/postgresql
- @mikro-orm/mongodb
- @mikro-orm/migrations

**导出**：

```typescript
export * from './services/database.service';
export * from './interfaces/database.interface';
export * from './config/database.config';
export * from './database.module';
```

#### 2.6 @aiofix/common - 通用模块（简化后）

**职责**：提供通用的工具和类型
**功能**：

- 通用类型定义
- 通用异常类
- 通用常量
- 测试数据工厂
- 通用工具函数

**导出**：

```typescript
export * from './types';
export * from './exceptions';
export * from './constants';
export * from './test-factories';
```

## 重构步骤

### 第一步：创建新的包结构

1. 创建各个独立包的目录
2. 创建package.json文件
3. 创建TypeScript配置文件
4. 创建基础目录结构

### 第二步：迁移代码

1. 从common包中提取相关代码
2. 创建各包的入口文件
3. 实现各包的核心功能
4. 编写单元测试

### 第三步：更新依赖

1. 更新根package.json
2. 更新各包的依赖关系
3. 更新导入路径
4. 测试构建和运行

### 第四步：文档更新

1. 更新README文档
2. 更新API文档
3. 更新使用示例
4. 更新开发指南

## 使用方式

### 1. 按需引入

```typescript
// 只引入需要的模块
import { LoggingService } from '@aiofix/logging';
import { ConfigService } from '@aiofix/config';
import { CacheService } from '@aiofix/cache';
```

### 2. 模块导入

```typescript
// 在NestJS应用中导入模块
import { LoggingModule } from '@aiofix/logging';
import { ConfigModule } from '@aiofix/config';
import { CacheModule } from '@aiofix/cache';

@Module({
  imports: [LoggingModule, ConfigModule, CacheModule],
})
export class AppModule {}
```

### 3. 服务注入

```typescript
// 在服务中注入依赖
@Injectable()
export class UserService {
  constructor(
    private readonly logging: LoggingService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}
}
```

## 优势

### 1. 模块独立性

- 每个包都有明确的职责
- 可以独立开发和测试
- 支持独立版本管理

### 2. 依赖管理

- 按需引入，减少包大小
- 清晰的依赖关系
- 更好的构建性能

### 3. 可维护性

- 代码组织更清晰
- 便于定位和修改
- 支持团队协作开发

### 4. 可扩展性

- 易于添加新功能
- 支持插件化架构
- 便于第三方集成

## 注意事项

### 1. 版本管理

- 各包独立版本号
- 保持API兼容性
- 及时更新依赖

### 2. 测试策略

- 每个包都有独立的测试
- 集成测试覆盖包间交互
- 端到端测试验证整体功能

### 3. 文档维护

- 及时更新API文档
- 提供使用示例
- 维护迁移指南

## 总结

通过将通用模块分离为独立包，我们实现了：

1. **更好的模块化**：每个包都有明确的职责和边界
2. **更高的可维护性**：代码组织更清晰，便于维护
3. **更好的可测试性**：每个包都可以独立测试
4. **更高的可复用性**：支持按需引入和独立使用

这种重构方案符合现代软件架构的最佳实践，为项目的长期发展奠定了良好的基础。

---

**文档版本**：1.0  
**创建日期**：2024-01-01  
**维护者**：项目开发团队
