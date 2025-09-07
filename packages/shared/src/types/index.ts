/**
 * @file types/index.ts
 * @description 通用类型定义导出
 *
 * 包含系统中使用的通用TypeScript类型定义：
 * - Common: 通用类型
 * - API: API相关类型
 * - Pagination: 分页相关类型
 */

// 通用类型
export type {
  BaseEntity,
  Timestamp,
  Optional,
  Required,
  Partial,
  DeepPartial,
} from './common.types';

// API类型
export type {
  ApiResponse,
  ApiError,
  ApiRequest,
  ApiPagination,
} from './api.types';

// 分页类型
export type {
  PaginationOptions,
  PaginationResult,
  SortOptions,
  FilterOptions,
} from './pagination.types';
