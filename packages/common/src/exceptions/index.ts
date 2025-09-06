/**
 * 异常定义
 *
 * 定义系统中使用的各种异常类，提供统一的错误处理机制。
 * 所有异常都继承自基础异常类，确保异常处理的一致性。
 *
 * @fileoverview 系统异常定义
 * @author AI开发团队
 * @since 1.0.0
 */

import { ERROR_CODES } from '../constants';

/**
 * 基础异常类
 *
 * 所有系统异常都应该继承此基类，提供统一的异常结构和行为。
 *
 * @abstract
 * @class BaseException
 * @extends {Error}
 * @author AI开发团队
 * @since 1.0.0
 */
export abstract class BaseException extends Error {
  /**
   * 错误代码
   * 用于错误分类和国际化
   */
  public readonly code: string;

  /**
   * HTTP状态码
   * 用于API响应
   */
  public readonly statusCode: number;

  /**
   * 错误详情
   * 包含错误的详细信息
   */
  public readonly details?: any;

  /**
   * 错误发生时间
   */
  public readonly timestamp: Date;

  /**
   * 构造函数
   *
   * @param {string} message - 错误消息
   * @param {string} code - 错误代码
   * @param {number} statusCode - HTTP状态码
   * @param {any} [details] - 错误详情
   */
  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // 确保堆栈跟踪正确
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 将异常转换为JSON格式
   *
   * @returns {object} 异常的JSON表示
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * 领域异常
 *
 * 表示业务领域中的错误，通常由业务规则违反引起。
 *
 * @class DomainException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class DomainException extends BaseException {
  constructor(
    message: string,
    code: string = ERROR_CODES.VALIDATION_ERROR,
    details?: any,
  ) {
    super(message, code, 400, details);
  }
}

/**
 * 验证异常
 *
 * 表示数据验证失败的错误。
 *
 * @class ValidationException
 * @extends {DomainException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class ValidationException extends DomainException {
  /**
   * 验证错误列表
   */
  public readonly errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(message, ERROR_CODES.VALIDATION_ERROR, { errors });
    this.errors = errors;
  }
}

/**
 * 未找到异常
 *
 * 表示请求的资源不存在。
 *
 * @class NotFoundException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class NotFoundException extends BaseException {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, ERROR_CODES.NOT_FOUND, 404, {
      resource,
      id,
    });
  }
}

/**
 * 未授权异常
 *
 * 表示用户未通过身份验证。
 *
 * @class UnauthorizedException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized') {
    super(message, ERROR_CODES.UNAUTHORIZED, 401);
  }
}

/**
 * 禁止访问异常
 *
 * 表示用户没有权限访问资源。
 *
 * @class ForbiddenException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class ForbiddenException extends BaseException {
  constructor(message: string = 'Forbidden') {
    super(message, ERROR_CODES.FORBIDDEN, 403);
  }
}

/**
 * 冲突异常
 *
 * 表示请求与当前资源状态冲突。
 *
 * @class ConflictException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class ConflictException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, ERROR_CODES.CONFLICT, 409, details);
  }
}

/**
 * 内部服务器错误异常
 *
 * 表示服务器内部错误。
 *
 * @class InternalServerErrorException
 * @extends {BaseException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class InternalServerErrorException extends BaseException {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, ERROR_CODES.INTERNAL_ERROR, 500, details);
  }
}

/**
 * 业务异常
 *
 * 表示业务逻辑错误。
 *
 * @class BusinessException
 * @extends {DomainException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class BusinessException extends DomainException {
  constructor(
    message: string,
    code: string = ERROR_CODES.VALIDATION_ERROR,
    details?: any,
  ) {
    super(message, code, details);
  }
}

/**
 * 并发异常
 *
 * 表示并发操作冲突。
 *
 * @class ConcurrencyException
 * @extends {ConflictException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class ConcurrencyException extends ConflictException {
  constructor(message: string = 'Concurrency conflict', details?: any) {
    super(message, details);
  }
}

/**
 * 数据隔离异常
 *
 * 表示数据隔离违规。
 *
 * @class DataIsolationException
 * @extends {ForbiddenException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class DataIsolationException extends ForbiddenException {
  constructor(message: string = 'Data isolation violation', details?: any) {
    super(message);
    (this as any).details = details;
  }
}

/**
 * 跨租户访问异常
 *
 * 表示跨租户数据访问违规。
 *
 * @class CrossTenantAccessException
 * @extends {DataIsolationException}
 * @author AI开发团队
 * @since 1.0.0
 */
export class CrossTenantAccessException extends DataIsolationException {
  constructor(tenantId: string, requestedTenantId: string) {
    super(
      `Cross-tenant access violation: cannot access tenant ${requestedTenantId} from tenant ${tenantId}`,
      { tenantId, requestedTenantId },
    );
  }
}
