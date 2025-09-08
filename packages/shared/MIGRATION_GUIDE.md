# 值对象迁移指南

## 概述

本指南说明如何将各模块中重复定义的值对象迁移到共享模块，避免重复维护。

## 迁移原则

1. **统一性**: 所有模块使用相同的值对象定义
2. **一致性**: 保持API接口的一致性
3. **向后兼容**: 确保迁移过程中不破坏现有功能
4. **渐进式**: 分阶段进行迁移，降低风险

## 已创建的通用值对象

### 1. 标识符类值对象

#### UserId (用户ID)

- **位置**: `packages/shared/src/identifiers/user-id.vo.ts`
- **功能**: 最完整的实现，支持UUID v4格式验证
- **重复定义位置**:
  - `packages/user/src/domain/value-objects/user-id.vo.ts`
  - `packages/notification/email/src/domain/value-objects/user-id.vo.ts`
  - `packages/notification/in-app/src/domain/value-objects/user-id.vo.ts`

#### TenantId (租户ID)

- **位置**: `packages/shared/src/identifiers/tenant-id.vo.ts`
- **功能**: 最完整的实现，支持租户类型识别
- **重复定义位置**:
  - `packages/tenant/src/domain/value-objects/tenant-id.vo.ts`
  - `packages/notification/email/src/domain/value-objects/tenant-id.vo.ts`
  - `packages/notification/in-app/src/domain/value-objects/tenant-id.vo.ts`

#### NotifId (通知ID)

- **位置**: `packages/shared/src/identifiers/notif-id.vo.ts`
- **功能**: 新增的统一实现
- **重复定义位置**:
  - `packages/notification/email/src/domain/value-objects/notif-id.vo.ts`
  - `packages/notification/in-app/src/domain/value-objects/notif-id.vo.ts`

### 2. 名称类值对象

#### 通用基类

- **位置**: `packages/shared/src/common/name.vo.ts`
- **功能**: 提供名称验证的通用逻辑

#### 具体实现

- **RoleName**: `packages/shared/src/common/role-name.vo.ts`
- **OrganizationName**: `packages/shared/src/common/organization-name.vo.ts`
- **DepartmentName**: `packages/shared/src/common/department-name.vo.ts`

**重复定义位置**:

- `packages/role/src/domain/value-objects/role-name.vo.ts`
- `packages/organization/src/domain/value-objects/organization-name.vo.ts`
- `packages/department/src/domain/value-objects/department-name.vo.ts`

### 3. 描述类值对象

#### 通用基类

- **位置**: `packages/shared/src/common/description.vo.ts`
- **功能**: 提供描述验证的通用逻辑

#### 具体实现

- **RoleDescription**: `packages/shared/src/common/role-description.vo.ts`
- **OrganizationDescription**: `packages/shared/src/common/organization-description.vo.ts`
- **DepartmentDescription**: `packages/shared/src/common/department-description.vo.ts`

**重复定义位置**:

- `packages/role/src/domain/value-objects/role-description.vo.ts`
- `packages/organization/src/domain/value-objects/organization-description.vo.ts`
- `packages/department/src/domain/value-objects/department-description.vo.ts`

### 4. 联系方式类值对象 - 高度通用

#### PhoneNumber (电话号码)

- **位置**: `packages/shared/src/common/phone-number.vo.ts` (新增)
- **通用性**: ⭐⭐⭐⭐⭐ (极高)
- **使用场景**: 用户注册、短信通知、电话验证、联系人管理
- **重复定义位置**: `packages/notification/sms/src/domain/value-objects/phone-number.vo.ts`

#### EmailAddress (邮箱地址)

- **位置**: `packages/shared/src/common/email.vo.ts` (已存在，更优实现)
- **通用性**: ⭐⭐⭐⭐⭐ (极高)
- **使用场景**: 用户注册、邮件通知、邮箱验证、联系人管理
- **重复定义位置**: `packages/notification/email/src/domain/value-objects/email-address.vo.ts`
- **建议**: 删除EmailAddress，统一使用共享模块的Email

## 迁移步骤

### 步骤1: 更新导入语句

**迁移前**:

```typescript
import { UserId } from '../value-objects/user-id.vo';
import { TenantId } from '../value-objects/tenant-id.vo';
import { RoleName } from '../value-objects/role-name.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { EmailAddress } from '../value-objects/email-address.vo';
```

**迁移后**:

```typescript
import { UserId, TenantId, RoleName, PhoneNumber, Email } from '@aiofix/shared';
```

### 步骤2: 更新package.json依赖

**迁移前**:

```json
{
  "dependencies": {
    "@aiofix/core": "workspace:*"
  }
}
```

**迁移后**:

```json
{
  "dependencies": {
    "@aiofix/core": "workspace:*",
    "@aiofix/shared": "workspace:*"
  }
}
```

### 步骤3: 删除重复文件

删除以下重复定义的文件：

- `packages/*/src/domain/value-objects/user-id.vo.ts`
- `packages/*/src/domain/value-objects/tenant-id.vo.ts`
- `packages/*/src/domain/value-objects/notif-id.vo.ts`
- `packages/*/src/domain/value-objects/role-name.vo.ts`
- `packages/*/src/domain/value-objects/organization-name.vo.ts`
- `packages/*/src/domain/value-objects/department-name.vo.ts`
- `packages/*/src/domain/value-objects/role-description.vo.ts`
- `packages/*/src/domain/value-objects/organization-description.vo.ts`
- `packages/*/src/domain/value-objects/department-description.vo.ts`
- `packages/notification/sms/src/domain/value-objects/phone-number.vo.ts`
- `packages/notification/email/src/domain/value-objects/email-address.vo.ts`

## 迁移示例

### 示例1: 用户模块迁移

**迁移前** (`packages/user/src/domain/value-objects/user-id.vo.ts`):

```typescript
import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

export class UserId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }
  // ... 其他实现
}
```

**迁移后** (直接使用共享模块):

```typescript
import { UserId } from '@aiofix/shared';

// 直接使用，无需修改业务逻辑
const userId = UserId.generate();
```

### 示例2: 角色模块迁移

**迁移前** (`packages/role/src/domain/value-objects/role-name.vo.ts`):

```typescript
import { ValueObject } from '@aiofix/core';

export class RoleName extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;
  // ... 验证逻辑
}
```

**迁移后** (使用共享模块):

```typescript
import { RoleName } from '@aiofix/shared';

// 功能完全一致，无需修改业务逻辑
const roleName = new RoleName('Admin');
```

### 示例3: 联系方式值对象迁移

**PhoneNumber迁移前** (`packages/notification/sms/src/domain/value-objects/phone-number.vo.ts`):

```typescript
import { ValueObject } from '@aiofix/core';

export class PhoneNumber extends ValueObject<{
  readonly number: string;
  readonly countryCode: string;
  readonly region: PhoneRegion;
}> {
  // ... 复杂实现
}
```

**PhoneNumber迁移后** (使用共享模块):

```typescript
import { PhoneNumber } from '@aiofix/shared';

// 功能完全一致，API更简洁
const phone = PhoneNumber.create('13800138000', '+86');
const phone2 = PhoneNumber.fromInternationalFormat('+86 138 0013 8000');
```

**EmailAddress迁移前** (`packages/notification/email/src/domain/value-objects/email-address.vo.ts`):

```typescript
export class EmailAddress {
  private readonly _value: string;
  // ... 实现
}
```

**EmailAddress迁移后** (使用共享模块的Email):

```typescript
import { Email } from '@aiofix/shared';

// 功能更完整，继承ValueObject
const email = new Email('user@example.com');
console.log(email.isCorporate()); // 检查是否为企业邮箱
```

## 验证迁移

### 1. 编译检查

```bash
# 检查所有包是否编译通过
pnpm build

# 检查特定包
pnpm --filter @aiofix/user build
```

### 2. 测试验证

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter @aiofix/user test
```

### 3. Linter检查

```bash
# 检查所有包的linter错误
pnpm lint

# 检查特定包
pnpm --filter @aiofix/user lint
```

## 注意事项

### 1. API兼容性

- 共享模块的值对象API与原有实现保持一致
- 构造函数参数和返回值类型相同
- 静态方法名称和参数保持一致

### 2. 错误处理

- 错误类型名称保持一致
- 错误消息格式保持一致
- 异常抛出条件保持一致

### 3. 性能考虑

- 共享模块的值对象经过优化
- 验证逻辑更加高效
- 内存使用更加合理

## 5. 状态类值对象统一

### 通用通知状态

- **位置**: `packages/shared/src/common/notification-status.vo.ts`
- **功能**: 统一的通知状态管理，支持状态转换和重试机制
- **重复定义位置**:
  - `packages/notification/sms/src/domain/value-objects/sms-status.vo.ts`
  - `packages/notification/email/src/domain/value-objects/email-status.vo.ts`
  - `packages/notification/push/src/domain/value-objects/push-status.vo.ts`

### 迁移前

```typescript
// 各通知模块中的重复状态实现
import { SmsStatus, SmsStatusType } from './sms-status.vo';
import { EmailStatus, EmailStatusValidator } from './email-status.vo';
import { PushStatus, PushStatusType } from './push-status.vo';
```

### 迁移后

```typescript
// 统一使用通用通知状态
import {
  NotificationStatus,
  NotificationStatusType,
  InvalidStatusTransitionError,
} from '@aiofix/shared';

// 使用示例
const status = NotificationStatus.create(NotificationStatusType.PENDING);
const failedStatus = status.transitionTo(
  NotificationStatusType.FAILED,
  '网络超时',
);
```

### 状态映射关系

- `SmsStatusType` → `NotificationStatusType`
- `EmailStatus` → `NotificationStatusType`
- `PushStatusType` → `NotificationStatusType`

### 迁移步骤

1. 将各模块的状态枚举值映射到 `NotificationStatusType`
2. 替换状态值对象为 `NotificationStatus`
3. 更新状态转换逻辑使用统一的状态机
4. 删除重复的状态值对象文件

## 后续计划

### 阶段3: 配置类值对象

## 6. 配置类值对象统一

### 通用配置基类

- **位置**: `packages/shared/src/common/base-settings.vo.ts`
- **功能**: 提供通用的设置验证和管理框架
- **重复定义位置**:
  - `packages/platform/src/domain/value-objects/platform-settings.vo.ts`
  - `packages/tenant/src/domain/value-objects/tenant-configuration.vo.ts`
  - `packages/organization/src/domain/value-objects/organization-settings.vo.ts`

### 迁移前

```typescript
// 各模块中的重复配置实现
class PlatformSettings extends ValueObject<PlatformSettingsData> {
  constructor(data: PlatformSettingsData) {
    super(data);
    this.validateSettings(data);
  }
  // ... 重复的验证逻辑
}

class TenantConfiguration extends ValueObject<TenantConfigurationData> {
  constructor(data: TenantConfigurationData) {
    super(data);
    this.validate();
  }
  // ... 重复的验证逻辑
}
```

### 迁移后

```typescript
// 统一使用通用配置基类
import { BaseSettings, SettingsValidationRule } from '@aiofix/shared';

class PlatformSettings extends BaseSettings<PlatformSettingsData> {
  protected getValidationRules(): SettingsValidationRule[] {
    return [
      {
        field: 'name',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },
      {
        field: 'version',
        required: true,
        type: 'string',
        pattern: /^\d+\.\d+\.\d+/,
      },
      { field: 'maxUsers', type: 'number', min: 1, max: 100000 },
    ];
  }
}
```

### 配置基类特性

1. **通用验证框架**: 支持多种数据类型的验证
2. **灵活验证规则**: 支持必填、类型、范围、正则、枚举等验证
3. **设置管理功能**: 提供更新、合并、克隆等操作
4. **类型安全**: 完整的TypeScript类型支持

### 迁移步骤

1. 继承 `BaseSettings` 基类
2. 实现 `getValidationRules()` 方法定义验证规则
3. 删除重复的验证逻辑
4. 使用基类提供的通用方法

### 阶段4: 配置类值对象

## 7. 内容类值对象统一

### 通用内容基类

- **位置**: `packages/shared/src/common/base-content.vo.ts`
- **功能**: 提供通用的内容验证和管理框架
- **重复定义位置**:
  - `packages/notification/preferences/src/domain/value-objects/content-preference.vo.ts`
  - `packages/notification/email/src/domain/value-objects/email-content.vo.ts`
  - `packages/notification/sms/src/domain/value-objects/sms-content.vo.ts`
  - `packages/notification/push/src/domain/value-objects/push-content.vo.ts`

### 迁移前

```typescript
// 各模块中的重复内容实现
class EmailContent {
  constructor(subject: string, htmlContent: string, textContent: string) {
    this.validateEmailContent(subject, htmlContent, textContent);
    // ... 重复的验证逻辑
  }
}

class SmsContent extends ValueObject<{...}> {
  constructor(data: {...}) {
    super(data);
    this.validateContent(data);
    // ... 重复的验证逻辑
  }
}
```

### 迁移后

```typescript
// 统一使用通用内容基类
import { BaseContent, ContentValidationRule } from '@aiofix/shared';

class EmailContent extends BaseContent<EmailContentData> {
  protected getValidationRules(): ContentValidationRule[] {
    return [
      {
        field: 'subject',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 200,
      },
      {
        field: 'htmlContent',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 10000,
      },
      {
        field: 'textContent',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 10000,
      },
    ];
  }
}
```

### 内容基类特性

1. **通用验证框架**: 支持多种内容类型的验证
2. **模板变量替换**: 支持{{variable}}和{variable}两种格式
3. **敏感词检测**: 提供敏感词过滤功能
4. **内容统计**: 提供内容长度统计和摘要生成
5. **多语言支持**: 支持多语言内容管理

### 迁移步骤

1. 继承 `BaseContent` 基类
2. 实现 `getValidationRules()` 方法定义验证规则
3. 删除重复的验证逻辑
4. 使用基类提供的通用方法

### 阶段5: 内容类值对象

## 支持

如果在迁移过程中遇到问题，请：

1. 检查导入路径是否正确
2. 确认package.json依赖已更新
3. 验证API使用方式是否一致
4. 查看共享模块的文档和示例

## 迁移总结

### 减少重复代码

- **标识符类**: 减少10个重复文件
- **名称类**: 减少3个重复文件
- **描述类**: 减少3个重复文件
- **联系方式类**: 减少2个重复文件
- **总计**: 减少18个重复文件

### 提高代码质量

- 统一的验证逻辑和错误处理
- 一致的API接口和类型定义
- 更好的代码复用和维护性
- 增强的类型安全性

### 关键优势

1. **避免重复维护**: 18个重复文件合并为共享实现
2. **提高代码质量**: 统一的验证逻辑和错误处理
3. **增强类型安全**: 一致的API接口和类型定义
4. **简化开发流程**: 开发者只需关注业务逻辑，无需重复实现基础功能
