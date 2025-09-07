/**
 * @file common/index.ts
 * @description 通用值对象导出
 *
 * 包含跨业务域使用的通用值对象：
 * - Email: 邮箱地址
 * - Status: 通用状态枚举和转换逻辑
 * - Timestamp: 时间戳值对象
 * - Version: 版本号值对象
 * - Phone: 电话号码值对象
 */

// 通用值对象
export { Email, InvalidEmailError } from './email.vo';

// 类型定义
export type { Email as EmailType } from './email.vo';
