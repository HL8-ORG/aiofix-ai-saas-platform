# 审计字段设计说明

## 设计背景

你提出的问题非常重要：**每个领域实体都有可能映射为一个数据库实体，每一条数据都有被追踪的业务需求**。这确实是企业级应用中的核心需求。

## 审计字段设计

### 1. **基础审计字段**

#### 创建审计

- `createdAt: Date` - 创建时间
- `createdBy: string` - 创建者ID

#### 更新审计

- `updatedAt: Date` - 最后更新时间
- `updatedBy: string` - 最后更新者ID
- `version: number` - 数据版本号（乐观锁）

#### 删除审计

- `isDeleted: boolean` - 软删除标记
- `deletedAt?: Date` - 删除时间
- `deletedBy?: string` - 删除者ID

### 2. **字段用途详解**

#### 创建审计字段

```typescript
public readonly createdAt: Date = new Date();
public readonly createdBy: string = 'system';
```

- **用途**：记录数据创建的时间和创建者
- **业务价值**：
  - 数据溯源：知道数据何时被创建
  - 责任追踪：知道谁创建了数据
  - 合规要求：满足审计和合规需求

#### 更新审计字段

```typescript
private updatedAt: Date = new Date();
private updatedBy: string = 'system';
private version: number = 1;
```

- **用途**：记录数据变更的时间和操作者
- **业务价值**：
  - 变更追踪：知道数据何时被修改
  - 操作审计：知道谁修改了数据
  - 并发控制：版本号用于乐观锁
  - 数据同步：基于时间戳的增量同步

#### 删除审计字段

```typescript
private isDeleted: boolean = false;
private deletedAt?: Date;
private deletedBy?: string;
```

- **用途**：实现软删除，保留删除记录
- **业务价值**：
  - 数据恢复：可以恢复误删的数据
  - 删除审计：知道何时、谁删除了数据
  - 合规要求：满足数据保留政策
  - 业务分析：分析删除模式

### 3. **业务方法中的审计处理**

#### 状态变更方法

```typescript
public markAsRead(updatedBy: string = 'system'): void {
  // 业务逻辑
  this.status = ReadStatus.READ;
  this.readAt = new Date();

  // 审计信息更新
  this.updatedAt = new Date();
  this.updatedBy = updatedBy;
  this.version += 1;
}
```

#### 软删除方法

```typescript
public softDelete(deletedBy: string = 'system'): void {
  if (this.isDeleted) {
    throw new InvalidOperationError('Notification is already deleted');
  }

  // 设置删除标记
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;

  // 更新审计信息
  this.updatedAt = new Date();
  this.updatedBy = deletedBy;
  this.version += 1;
}
```

## 数据库映射考虑

### 1. **表结构设计**

```sql
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL,
  metadata JSONB,
  status VARCHAR(20) NOT NULL,
  read_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- 审计字段
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(255),

  -- 索引
  INDEX idx_tenant_recipient (tenant_id, recipient_id),
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at),
  INDEX idx_is_deleted (is_deleted)
);
```

### 2. **查询优化**

```sql
-- 查询未删除的通知
SELECT * FROM in_app_notifications
WHERE tenant_id = ? AND is_deleted = FALSE;

-- 查询特定用户的通知
SELECT * FROM in_app_notifications
WHERE recipient_id = ? AND is_deleted = FALSE
ORDER BY created_at DESC;

-- 审计查询：查询删除记录
SELECT * FROM in_app_notifications
WHERE is_deleted = TRUE
AND deleted_at BETWEEN ? AND ?;
```

## 业务场景应用

### 1. **用户行为分析**

```typescript
// 分析用户阅读模式
const userReadPattern = await repository.analyzeUserReadPattern(
  userId,
  startDate,
  endDate,
);

// 分析通知效果
const notificationEffectiveness =
  await repository.analyzeNotificationEffectiveness(tenantId, notificationType);
```

### 2. **合规审计**

```typescript
// 生成审计报告
const auditReport = await repository.generateAuditReport(
  tenantId,
  startDate,
  endDate,
);

// 数据保留策略
const retentionPolicy = await repository.applyRetentionPolicy(
  tenantId,
  retentionDays,
);
```

### 3. **数据恢复**

```typescript
// 恢复误删的通知
const deletedNotifications = await repository.findDeletedNotifications(
  tenantId,
  userId,
);

// 批量恢复
await repository.batchRestore(deletedNotificationIds, restoredBy);
```

## 性能考虑

### 1. **索引策略**

- 在审计字段上创建适当的索引
- 考虑复合索引的查询模式
- 定期清理过期的审计数据

### 2. **数据分区**

- 按时间分区存储审计数据
- 考虑按租户分区
- 实现数据归档策略

### 3. **缓存策略**

- 缓存频繁查询的审计信息
- 实现审计数据的增量同步
- 考虑审计数据的读写分离

## 扩展性考虑

### 1. **多租户支持**

- 审计数据按租户隔离
- 支持租户级的审计策略
- 实现跨租户的审计分析

### 2. **事件溯源集成**

- 审计字段与事件溯源结合
- 支持审计数据的重放
- 实现审计数据的版本控制

### 3. **外部系统集成**

- 支持审计数据的导出
- 集成第三方审计系统
- 实现审计数据的标准化

## 总结

通过引入完整的审计字段设计，我们实现了：

1. **完整的数据追踪**：每个数据变更都有完整的审计记录
2. **合规支持**：满足企业级应用的合规要求
3. **业务分析**：支持基于审计数据的业务分析
4. **数据恢复**：支持软删除和数据恢复
5. **性能优化**：通过索引和分区优化查询性能
6. **扩展性**：支持未来的业务扩展需求

这种设计确保了数据的完整性、可追溯性和合规性，为企业级应用提供了坚实的基础。
