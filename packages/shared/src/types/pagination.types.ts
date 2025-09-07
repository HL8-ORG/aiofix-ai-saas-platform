/**
 * @file pagination.types.ts
 * @description 分页相关类型定义
 *
 * 提供分页、排序、过滤相关的类型定义
 */

/**
 * @interface PaginationOptions
 * @description 分页选项接口
 *
 * 定义分页查询的选项
 */
export interface PaginationOptions {
  /** 页码（从1开始） */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 是否返回总数 */
  includeTotal?: boolean;
  /** 是否返回分页信息 */
  includePagination?: boolean;
}

/**
 * @interface PaginationResult
 * @description 分页结果接口
 *
 * 定义分页查询的结果
 */
export interface PaginationResult<T = any> {
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
  /** 下一页页码 */
  nextPage?: number;
  /** 上一页页码 */
  prevPage?: number;
}

/**
 * @interface SortOptions
 * @description 排序选项接口
 *
 * 定义排序查询的选项
 */
export interface SortOptions {
  /** 排序字段 */
  field: string;
  /** 排序方向 */
  direction: 'ASC' | 'DESC';
  /** 排序优先级 */
  priority?: number;
}

/**
 * @interface FilterOptions
 * @description 过滤选项接口
 *
 * 定义过滤查询的选项
 */
export interface FilterOptions {
  /** 过滤字段 */
  field: string;
  /** 过滤操作符 */
  operator: FilterOperator;
  /** 过滤值 */
  value: any;
  /** 过滤条件组合方式 */
  combine?: 'AND' | 'OR';
}

/**
 * @type FilterOperator
 * @description 过滤操作符类型
 */
export type FilterOperator =
  | 'eq' // 等于
  | 'ne' // 不等于
  | 'gt' // 大于
  | 'gte' // 大于等于
  | 'lt' // 小于
  | 'lte' // 小于等于
  | 'in' // 包含
  | 'nin' // 不包含
  | 'like' // 模糊匹配
  | 'ilike' // 不区分大小写模糊匹配
  | 'between' // 范围
  | 'isNull' // 为空
  | 'isNotNull' // 不为空
  | 'exists' // 存在
  | 'regex'; // 正则表达式

/**
 * @interface QueryOptions
 * @description 查询选项接口
 *
 * 定义完整的查询选项
 */
export interface QueryOptions<T = any> {
  /** 分页选项 */
  pagination?: PaginationOptions;
  /** 排序选项 */
  sort?: SortOptions[];
  /** 过滤选项 */
  filters?: FilterOptions[];
  /** 选择字段 */
  select?: (keyof T)[];
  /** 包含关联 */
  include?: string[];
  /** 搜索关键词 */
  search?: string;
  /** 搜索字段 */
  searchFields?: string[];
}

/**
 * @interface SearchOptions
 * @description 搜索选项接口
 *
 * 定义搜索查询的选项
 */
export interface SearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 搜索字段 */
  fields: string[];
  /** 搜索模式 */
  mode?: 'exact' | 'fuzzy' | 'prefix' | 'suffix';
  /** 是否区分大小写 */
  caseSensitive?: boolean;
  /** 最小匹配长度 */
  minLength?: number;
  /** 最大匹配长度 */
  maxLength?: number;
}

/**
 * @interface AggregationOptions
 * @description 聚合选项接口
 *
 * 定义数据聚合的选项
 */
export interface AggregationOptions {
  /** 聚合字段 */
  field: string;
  /** 聚合操作 */
  operation: AggregationOperation;
  /** 聚合别名 */
  alias?: string;
  /** 聚合条件 */
  condition?: FilterOptions;
}

/**
 * @type AggregationOperation
 * @description 聚合操作类型
 */
export type AggregationOperation =
  | 'count' // 计数
  | 'sum' // 求和
  | 'avg' // 平均值
  | 'min' // 最小值
  | 'max' // 最大值
  | 'distinct' // 去重计数
  | 'groupBy'; // 分组

/**
 * @interface QueryBuilder
 * @description 查询构建器接口
 *
 * 定义查询构建器的基本方法
 */
export interface QueryBuilder<T = any> {
  /** 添加过滤条件 */
  where(field: string, operator: FilterOperator, value: any): QueryBuilder<T>;
  /** 添加排序 */
  orderBy(field: string, direction: 'ASC' | 'DESC'): QueryBuilder<T>;
  /** 设置分页 */
  paginate(page: number, limit: number): QueryBuilder<T>;
  /** 设置选择字段 */
  select(fields: (keyof T)[]): QueryBuilder<T>;
  /** 添加搜索 */
  search(keyword: string, fields: string[]): QueryBuilder<T>;
  /** 构建查询 */
  build(): QueryOptions<T>;
}
