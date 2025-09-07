import { ISOLATION_LEVELS } from '@aiofix/common';

/**
 * 数据隔离级别类型
 *
 * 定义多租户数据隔离的五个层级。
 */
export type IsolationLevel =
  (typeof ISOLATION_LEVELS)[keyof typeof ISOLATION_LEVELS];

/**
 * 数据隔离上下文接口
 *
 * 定义用户的数据隔离上下文，包含用户在各个层级的身份信息。
 * 用于确定用户的数据访问权限和范围。
 *
 * @interface DataIsolationContext
 * @author AI开发团队
 * @since 1.0.0
 */
export interface DataIsolationContext {
  /**
   * 平台ID（可选）
   * 平台级用户必须提供
   */
  platformId?: string;

  /**
   * 租户ID（可选）
   * 租户级用户必须提供
   */
  tenantId?: string;

  /**
   * 组织ID（可选）
   * 组织级用户必须提供
   */
  organizationId?: string;

  /**
   * 部门ID（可选）
   * 部门级用户必须提供
   */
  departmentId?: string;

  /**
   * 用户ID（必需）
   * 所有用户都必须提供
   */
  userId: string;

  /**
   * 用户的隔离级别
   * 确定用户的数据访问范围
   */
  isolationLevel: IsolationLevel;

  /**
   * 用户的权限列表
   * 包含用户具有的所有权限
   */
  permissions: string[];

  /**
   * 用户的角色列表
   * 包含用户具有的所有角色
   */
  roles: string[];

  /**
   * 上下文创建时间
   */
  createdAt: Date;

  /**
   * 上下文过期时间
   */
  expiresAt?: Date;
}

/**
 * 数据分类接口
 *
 * 定义数据的分类信息，用于确定数据的访问策略。
 *
 * @interface DataClassification
 * @author AI开发团队
 * @since 1.0.0
 */
export interface DataClassification {
  /**
   * 数据ID
   */
  dataId: string;

  /**
   * 数据分类类型
   */
  classification: 'shareable' | 'protected';

  /**
   * 数据所有者层级
   */
  ownerLevel: IsolationLevel;

  /**
   * 数据所有者ID
   */
  ownerId: string;

  /**
   * 可共享的范围
   * 定义数据可以被哪些层级访问
   */
  shareableScopes: IsolationLevel[];

  /**
   * 受保护的范围
   * 定义数据被保护的范围
   */
  protectedScopes: IsolationLevel[];

  /**
   * 数据访问权限
   */
  accessPermissions: {
    read: string[];
    write: string[];
    delete: string[];
    share: string[];
  };

  /**
   * 数据创建时间
   */
  createdAt: Date;

  /**
   * 数据更新时间
   */
  updatedAt: Date;
}

/**
 * 数据访问权限接口
 *
 * 定义数据访问的权限级别。
 *
 * @interface DataAccessPermission
 * @author AI开发团队
 * @since 1.0.0
 */
export interface DataAccessPermission {
  /**
   * 权限级别
   */
  level: 'read' | 'write' | 'delete' | 'share';

  /**
   * 权限描述
   */
  description: string;

  /**
   * 权限范围
   */
  scope: IsolationLevel[];

  /**
   * 权限条件
   */
  conditions?: {
    /**
     * 时间限制
     */
    timeLimit?: {
      start: Date;
      end: Date;
    };

    /**
     * 次数限制
     */
    countLimit?: number;

    /**
     * IP限制
     */
    ipWhitelist?: string[];

    /**
     * 其他条件
     */
    [key: string]: unknown;
  };
}

/**
 * 数据隔离策略接口
 *
 * 定义数据隔离的策略配置。
 *
 * @interface DataIsolationPolicy
 * @author AI开发团队
 * @since 1.0.0
 */
export interface DataIsolationPolicy {
  /**
   * 策略ID
   */
  policyId: string;

  /**
   * 策略名称
   */
  name: string;

  /**
   * 策略描述
   */
  description: string;

  /**
   * 策略类型
   */
  type: 'default' | 'custom' | 'inherited';

  /**
   * 适用的隔离级别
   */
  applicableLevels: IsolationLevel[];

  /**
   * 数据分类规则
   */
  classificationRules: {
    /**
     * 默认分类
     */
    defaultClassification: 'shareable' | 'protected';

    /**
     * 分类条件
     */
    conditions: {
      field: string;
      operator: 'eq' | 'ne' | 'in' | 'nin' | 'contains';
      value: unknown;
      classification: 'shareable' | 'protected';
    }[];
  };

  /**
   * 访问控制规则
   */
  accessControlRules: {
    /**
     * 允许的访问级别
     */
    allowedLevels: IsolationLevel[];

    /**
     * 禁止的访问级别
     */
    forbiddenLevels: IsolationLevel[];

    /**
     * 特殊权限
     */
    specialPermissions: {
      level: IsolationLevel;
      permissions: string[];
    }[];
  };

  /**
   * 策略生效时间
   */
  effectiveFrom: Date;

  /**
   * 策略失效时间
   */
  effectiveTo?: Date;

  /**
   * 策略状态
   */
  status: 'active' | 'inactive' | 'draft';
}

/**
 * 数据隔离服务接口
 *
 * 定义数据隔离服务的核心功能。
 *
 * @interface IDataIsolationService
 * @author AI开发团队
 * @since 1.0.0
 */
export interface IDataIsolationService {
  /**
   * 获取用户的数据隔离上下文
   *
   * @param {string} userId - 用户ID
   * @returns {Promise<DataIsolationContext>} 数据隔离上下文
   */
  getDataIsolationContext(userId: string): Promise<DataIsolationContext>;

  /**
   * 检查数据访问权限
   *
   * @param {string} dataId - 数据ID
   * @param {DataIsolationContext} context - 用户上下文
   * @param {string} permission - 权限类型
   * @returns {Promise<boolean>} 是否有权限
   */
  checkDataAccess(
    dataId: string,
    context: DataIsolationContext,
    permission: string,
  ): Promise<boolean>;

  /**
   * 应用数据隔离过滤器
   *
   * @param {Record<string, unknown>} query - 查询对象
   * @param {DataIsolationContext} context - 用户上下文
   * @returns {Record<string, unknown>} 过滤后的查询对象
   */
  applyDataIsolation(
    query: Record<string, unknown>,
    context: DataIsolationContext,
  ): Record<string, unknown>;

  /**
   * 获取数据分类信息
   *
   * @param {string} dataId - 数据ID
   * @returns {Promise<DataClassification | null>} 数据分类信息
   */
  getDataClassification(dataId: string): Promise<DataClassification | null>;

  /**
   * 设置数据分类
   *
   * @param {string} dataId - 数据ID
   * @param {Partial<DataClassification>} classification - 分类信息
   * @returns {Promise<void>}
   */
  setDataClassification(
    dataId: string,
    classification: Partial<DataClassification>,
  ): Promise<void>;

  /**
   * 获取数据隔离策略
   *
   * @param {IsolationLevel} level - 隔离级别
   * @returns {Promise<DataIsolationPolicy | null>} 隔离策略
   */
  getIsolationPolicy(
    level: IsolationLevel,
  ): Promise<DataIsolationPolicy | null>;

  /**
   * 验证数据隔离合规性
   *
   * @param {string} dataId - 数据ID
   * @param {DataIsolationContext} context - 用户上下文
   * @returns {Promise<boolean>} 是否合规
   */
  validateDataIsolationCompliance(
    dataId: string,
    context: DataIsolationContext,
  ): Promise<boolean>;
}
