/**
 * @file common.types.ts
 * @description 通用类型定义
 *
 * 提供系统中使用的通用TypeScript类型定义
 */

/**
 * @interface BaseEntity
 * @description 基础实体接口
 *
 * 定义所有实体的基础属性
 */
export interface BaseEntity {
  /** 实体ID */
  id: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 删除时间（软删除） */
  deletedAt?: Date;
  /** 版本号（乐观锁） */
  version: number;
}

/**
 * @interface Timestamp
 * @description 时间戳接口
 *
 * 定义时间相关的属性
 */
export interface Timestamp {
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 删除时间（软删除） */
  deletedAt?: Date;
}

/**
 * @type Optional
 * @description 可选类型工具
 *
 * 将类型T的所有属性变为可选
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * @type Required
 * @description 必需类型工具
 *
 * 将类型T的指定属性变为必需
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * @type Partial
 * @description 部分类型工具
 *
 * 将类型T的所有属性变为可选
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * @type DeepPartial
 * @description 深度部分类型工具
 *
 * 将类型T的所有属性（包括嵌套对象）变为可选
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * @type NonNullable
 * @description 非空类型工具
 *
 * 从类型T中排除null和undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * @type Record
 * @description 记录类型工具
 *
 * 创建一个对象类型，其键为K，值为T
 */
export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * @type Pick
 * @description 选择类型工具
 *
 * 从类型T中选择指定的属性K
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * @type Omit
 * @description 省略类型工具
 *
 * 从类型T中省略指定的属性K
 */
export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

/**
 * @type Exclude
 * @description 排除类型工具
 *
 * 从类型T中排除可以赋值给U的类型
 */
export type Exclude<T, U> = T extends U ? never : T;

/**
 * @type Extract
 * @description 提取类型工具
 *
 * 从类型T中提取可以赋值给U的类型
 */
export type Extract<T, U> = T extends U ? T : never;

/**
 * @type ReturnType
 * @description 返回类型工具
 *
 * 获取函数T的返回类型
 */
export type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

/**
 * @type Parameters
 * @description 参数类型工具
 *
 * 获取函数T的参数类型
 */
export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * @type ConstructorParameters
 * @description 构造函数参数类型工具
 *
 * 获取构造函数T的参数类型
 */
export type ConstructorParameters<T extends new (...args: any) => any> =
  T extends new (...args: infer P) => any ? P : never;

/**
 * @type InstanceType
 * @description 实例类型工具
 *
 * 获取构造函数T的实例类型
 */
export type InstanceType<T extends new (...args: any) => any> = T extends new (
  ...args: any
) => infer R
  ? R
  : any;
