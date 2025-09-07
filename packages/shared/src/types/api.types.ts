/**
 * @file api.types.ts
 * @description API相关类型定义
 *
 * 提供API请求和响应相关的类型定义
 */

/**
 * @interface ApiResponse
 * @description API响应接口
 *
 * 定义标准的API响应格式
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 响应时间戳 */
  timestamp: Date;
  /** 请求ID */
  requestId: string;
  /** 是否成功 */
  success: boolean;
}

/**
 * @interface ApiError
 * @description API错误接口
 *
 * 定义API错误响应格式
 */
export interface ApiError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
  /** 错误堆栈 */
  stack?: string;
  /** 错误时间戳 */
  timestamp: Date;
  /** 请求ID */
  requestId: string;
}

/**
 * @interface ApiRequest
 * @description API请求接口
 *
 * 定义标准的API请求格式
 */
export interface ApiRequest<T = any> {
  /** 请求数据 */
  data: T;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数 */
  params?: Record<string, any>;
  /** 请求ID */
  requestId?: string;
  /** 用户ID */
  userId?: string;
  /** 租户ID */
  tenantId?: string;
}

/**
 * @interface ApiPagination
 * @description API分页接口
 *
 * 定义分页相关的API响应格式
 */
export interface ApiPagination<T = any> {
  /** 数据列表 */
  items: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * @type HttpMethod
 * @description HTTP方法类型
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

/**
 * @type HttpStatus
 * @description HTTP状态码类型
 */
export type HttpStatus =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

/**
 * @interface ApiEndpoint
 * @description API端点接口
 *
 * 定义API端点的配置
 */
export interface ApiEndpoint {
  /** 端点路径 */
  path: string;
  /** HTTP方法 */
  method: HttpMethod;
  /** 端点描述 */
  description?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 所需权限 */
  permissions?: string[];
  /** 请求体类型 */
  requestType?: string;
  /** 响应体类型 */
  responseType?: string;
}

/**
 * @interface ApiValidation
 * @description API验证接口
 *
 * 定义API请求验证规则
 */
export interface ApiValidation {
  /** 字段名 */
  field: string;
  /** 验证规则 */
  rules: string[];
  /** 错误消息 */
  message: string;
  /** 是否必需 */
  required?: boolean;
}

/**
 * @interface ApiDocumentation
 * @description API文档接口
 *
 * 定义API文档的结构
 */
export interface ApiDocumentation {
  /** API标题 */
  title: string;
  /** API版本 */
  version: string;
  /** API描述 */
  description?: string;
  /** 基础URL */
  baseUrl: string;
  /** 端点列表 */
  endpoints: ApiEndpoint[];
  /** 验证规则 */
  validations?: ApiValidation[];
  /** 错误代码 */
  errorCodes?: Record<string, string>;
}
