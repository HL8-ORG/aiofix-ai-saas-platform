# 用户偏好子领域 (Preferences Domain)

## 概述

用户偏好子领域负责管理用户的通知偏好设置，包括通知渠道偏好、时间偏好、内容偏好等。这是通知系统的核心配置模块，影响所有通知渠道的行为。

## 领域模型

### 聚合根 (Aggregate Roots)

- `NotifPreferences` - 用户通知偏好聚合根

### 领域实体 (Domain Entities)

- `NotifPreferencesEntity` - 用户通知偏好实体

### 值对象 (Value Objects)

- `ChannelPreference` - 渠道偏好值对象
- `TimePreference` - 时间偏好值对象
- `ContentPreference` - 内容偏好值对象
- `FrequencyPreference` - 频率偏好值对象

### 领域事件 (Domain Events)

- `NotifPreferencesCreatedEvent` - 偏好创建事件
- `NotifPreferencesUpdatedEvent` - 偏好更新事件
- `ChannelPreferenceChangedEvent` - 渠道偏好变更事件
- `TimePreferenceChangedEvent` - 时间偏好变更事件

### 领域服务 (Domain Services)

- `NotifPreferencesService` - 偏好管理领域服务

## 业务规则

1. **渠道偏好管理**：用户可以启用/禁用特定通知渠道
2. **时间偏好设置**：用户可以设置接收通知的时间段
3. **内容偏好过滤**：用户可以设置感兴趣的通知类型
4. **频率控制**：用户可以设置通知频率限制
5. **优先级管理**：用户可以设置不同通知的优先级

## 使用示例

```typescript
import { NotifPreferences } from './aggregates/notif-preferences.aggregate';
import { ChannelPreference } from './value-objects/channel-preference.vo';
import { TimePreference } from './value-objects/time-preference.vo';

// 创建用户偏好
const preferences = NotifPreferences.create('user-123', 'tenant-456');

// 设置渠道偏好
preferences.setChannelPreference(new ChannelPreference('email', true, 'high'));

// 设置时间偏好
preferences.setTimePreference(
  new TimePreference('09:00', '18:00', [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ]),
);
```
