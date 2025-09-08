/**
 * 基础类型定义
 *
 * 定义系统中使用的基础类型和接口，提供统一的类型定义。
 * 这些类型被整个系统共享使用，确保类型的一致性。
 *
 * @fileoverview 系统基础类型定义
 * @author AI开发团队
 * @since 1.0.0
 */
import { SORT_ORDER } from '../constants';
/**
 * 基础实体接口
 *
 * 所有实体都应该实现此接口，提供统一的基础属性。
 *
 * @interface BaseEntity
 * @author AI开发团队
 * @since 1.0.0
 */
export interface BaseEntity {
    /**
     * 实体的唯一标识符
     */
    id: string;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 更新时间
     */
    updatedAt: Date;
    /**
     * 版本号（用于乐观锁）
     */
    version: number;
}
/**
 * 分页选项接口
 *
 * 定义分页查询的选项参数。
 *
 * @interface PaginationOptions
 * @author AI开发团队
 * @since 1.0.0
 */
export interface PaginationOptions {
    /**
     * 页码（从1开始）
     */
    page: number;
    /**
     * 每页数量
     */
    limit: number;
    /**
     * 排序字段
     */
    sortBy?: string;
    /**
     * 排序方向
     */
    sortOrder?: (typeof SORT_ORDER)[keyof typeof SORT_ORDER];
}
/**
 * 分页结果接口
 *
 * 定义分页查询的结果结构。
 *
 * @interface PaginatedResult
 * @template T 数据类型
 * @author AI开发团队
 * @since 1.0.0
 */
export interface PaginatedResult<T> {
    /**
     * 数据列表
     */
    data: T[];
    /**
     * 总数量
     */
    total: number;
    /**
     * 当前页码
     */
    page: number;
    /**
     * 每页数量
     */
    limit: number;
    /**
     * 总页数
     */
    totalPages: number;
    /**
     * 是否有下一页
     */
    hasNext: boolean;
    /**
     * 是否有上一页
     */
    hasPrevious: boolean;
}
/**
 * API响应接口
 *
 * 定义统一的API响应结构。
 *
 * @interface ApiResponse
 * @template T 数据类型
 * @author AI开发团队
 * @since 1.0.0
 */
export interface ApiResponse<T = any> {
    /**
     * 操作是否成功
     */
    success: boolean;
    /**
     * 响应数据
     */
    data?: T;
    /**
     * 响应消息
     */
    message?: string;
    /**
     * 响应时间戳
     */
    timestamp: string;
    /**
     * 请求ID（用于追踪）
     */
    requestId?: string;
}
/**
 * 错误响应接口
 *
 * 定义统一的错误响应结构。
 *
 * @interface ErrorResponse
 * @author AI开发团队
 * @since 1.0.0
 */
export interface ErrorResponse {
    /**
     * 操作是否成功（始终为false）
     */
    success: false;
    /**
     * 错误信息
     */
    error: {
        /**
         * 错误代码
         */
        code: string;
        /**
         * 错误消息
         */
        message: string;
        /**
         * 错误详情
         */
        details?: any;
        /**
         * 错误堆栈（仅开发环境）
         */
        stack?: string;
    };
    /**
     * 响应时间戳
     */
    timestamp: string;
    /**
     * 请求ID（用于追踪）
     */
    requestId?: string;
}
/**
 * 排序选项接口
 *
 * 定义排序查询的选项参数。
 *
 * @interface SortOptions
 * @author AI开发团队
 * @since 1.0.0
 */
export interface SortOptions {
    /**
     * 排序字段
     */
    field: string;
    /**
     * 排序方向
     */
    order: (typeof SORT_ORDER)[keyof typeof SORT_ORDER];
}
/**
 * 过滤选项接口
 *
 * 定义过滤查询的选项参数。
 *
 * @interface FilterOptions
 * @author AI开发团队
 * @since 1.0.0
 */
export interface FilterOptions {
    /**
     * 过滤字段
     */
    field: string;
    /**
     * 过滤操作符
     */
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between';
    /**
     * 过滤值
     */
    value: any;
}
/**
 * 查询选项接口
 *
 * 定义复杂查询的选项参数。
 *
 * @interface QueryOptions
 * @author AI开发团队
 * @since 1.0.0
 */
export interface QueryOptions {
    /**
     * 分页选项
     */
    pagination?: PaginationOptions;
    /**
     * 排序选项
     */
    sort?: SortOptions[];
    /**
     * 过滤选项
     */
    filters?: FilterOptions[];
    /**
     * 包含的关联字段
     */
    include?: string[];
    /**
     * 排除的字段
     */
    exclude?: string[];
}
/**
 * 设备信息接口
 *
 * 定义设备信息结构。
 *
 * @interface DeviceInfo
 * @author AI开发团队
 * @since 1.0.0
 */
export interface DeviceInfo {
    /**
     * 设备类型
     */
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    /**
     * 操作系统
     */
    os: string;
    /**
     * 浏览器
     */
    browser: string;
    /**
     * 用户代理字符串
     */
    userAgent: string;
    /**
     * IP地址
     */
    ipAddress: string;
    /**
     * 地理位置（可选）
     */
    location?: {
        country?: string;
        region?: string;
        city?: string;
    };
}
/**
 * 审计日志接口
 *
 * 定义审计日志结构。
 *
 * @interface AuditLog
 * @author AI开发团队
 * @since 1.0.0
 */
export interface AuditLog {
    /**
     * 日志ID
     */
    id: string;
    /**
     * 操作用户ID
     */
    userId: string;
    /**
     * 操作类型
     */
    action: string;
    /**
     * 操作资源
     */
    resource: string;
    /**
     * 资源ID
     */
    resourceId: string;
    /**
     * 操作详情
     */
    details?: any;
    /**
     * 操作时间
     */
    timestamp: Date;
    /**
     * 设备信息
     */
    deviceInfo?: DeviceInfo;
    /**
     * 操作结果
     */
    result: 'success' | 'failure';
    /**
     * 错误信息（如果操作失败）
     */
    error?: string;
}
/**
 * 配置项接口
 *
 * 定义配置项结构。
 *
 * @interface ConfigItem
 * @author AI开发团队
 * @since 1.0.0
 */
export interface ConfigItem {
    /**
     * 配置键
     */
    key: string;
    /**
     * 配置值
     */
    value: any;
    /**
     * 配置类型
     */
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /**
     * 配置描述
     */
    description?: string;
    /**
     * 是否可编辑
     */
    editable: boolean;
    /**
     * 默认值
     */
    defaultValue?: any;
    /**
     * 验证规则
     */
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
    };
}
/**
 * 缓存项接口
 *
 * 定义缓存项结构。
 *
 * @interface CacheItem
 * @template T 缓存数据类型
 * @author AI开发团队
 * @since 1.0.0
 */
export interface CacheItem<T = any> {
    /**
     * 缓存键
     */
    key: string;
    /**
     * 缓存值
     */
    value: T;
    /**
     * 过期时间（毫秒）
     */
    ttl: number;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 最后访问时间
     */
    lastAccessedAt: Date;
    /**
     * 访问次数
     */
    accessCount: number;
}
//# sourceMappingURL=index.d.ts.map