import { SetMetadata } from '@nestjs/common';

/**
 * @constant AUDIT_KEY
 * @description 审计元数据键
 */
export const AUDIT_KEY = 'audit';

/**
 * @constant AUDIT_LEVEL_KEY
 * @description 审计级别元数据键
 */
export const AUDIT_LEVEL_KEY = 'audit_level';

/**
 * @function Audit
 * @description
 * 审计装饰器，用于指定控制器或方法的审计配置。
 *
 * 装饰器功能：
 * 1. 指定审计策略和配置
 * 2. 支持审计级别设置
 * 3. 与审计服务配合使用
 * 4. 提供细粒度审计控制
 *
 * 审计功能：
 * 1. 记录用户操作日志
 * 2. 跟踪数据变更历史
 * 3. 提供合规性支持
 * 4. 支持审计报告生成
 *
 * @param {AuditConfig} config 审计配置
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @Audit({ level: 'INFO', includeRequest: true })
 * export class UserController {
 *   @Get()
 *   @Audit({ level: 'DEBUG' })
 *   async getUsers() {}
 *
 *   @Post()
 *   @Audit({ level: 'WARN', includeResponse: true })
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const Audit = (config: AuditConfig) => SetMetadata(AUDIT_KEY, config);

/**
 * @function AuditLevel
 * @description
 * 审计级别装饰器，用于指定审计级别。
 *
 * 装饰器功能：
 * 1. 指定审计级别
 * 2. 支持动态级别设置
 * 3. 与审计服务配合使用
 * 4. 提供简单的级别设置
 *
 * @param {AuditLevel} level 审计级别
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @AuditLevel('INFO')
 *   async getUsers() {}
 *
 *   @Post()
 *   @AuditLevel('WARN')
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const AuditLevelDecorator = (level: AuditLevel) =>
  SetMetadata(AUDIT_LEVEL_KEY, level);

/**
 * @function NoAudit
 * @description
 * 禁用审计装饰器，用于指定不记录审计日志。
 *
 * 装饰器功能：
 * 1. 禁用审计日志记录
 * 2. 保护敏感操作
 * 3. 与审计服务配合使用
 * 4. 提供审计控制选项
 *
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @AuditLevel('INFO')
 *   async getUsers() {}
 *
 *   @Post()
 *   @NoAudit()
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const NoAudit = () => SetMetadata(AUDIT_KEY, { enabled: false });

/**
 * 审计配置接口
 */
export interface AuditConfig {
  /** 是否启用审计 */
  enabled?: boolean;
  /** 审计级别 */
  level?: AuditLevel;
  /** 是否包含请求信息 */
  includeRequest?: boolean;
  /** 是否包含响应信息 */
  includeResponse?: boolean;
  /** 是否包含用户信息 */
  includeUser?: boolean;
  /** 是否包含租户信息 */
  includeTenant?: boolean;
  /** 审计事件类型 */
  eventType?: AuditEventType;
  /** 审计描述 */
  description?: string;
  /** 审计标签 */
  tags?: string[];
}

/**
 * 审计级别枚举
 */
export enum AuditLevel {
  /** 调试级别 */
  DEBUG = 'DEBUG',
  /** 信息级别 */
  INFO = 'INFO',
  /** 警告级别 */
  WARN = 'WARN',
  /** 错误级别 */
  ERROR = 'ERROR',
  /** 严重级别 */
  CRITICAL = 'CRITICAL',
}

/**
 * 审计事件类型枚举
 */
export enum AuditEventType {
  /** 用户操作 */
  USER_ACTION = 'USER_ACTION',
  /** 数据访问 */
  DATA_ACCESS = 'DATA_ACCESS',
  /** 数据修改 */
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  /** 系统事件 */
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  /** 安全事件 */
  SECURITY_EVENT = 'SECURITY_EVENT',
  /** 合规事件 */
  COMPLIANCE_EVENT = 'COMPLIANCE_EVENT',
}
