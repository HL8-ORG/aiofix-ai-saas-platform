"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossTenantAccessException = exports.DataIsolationException = exports.ConcurrencyException = exports.BusinessException = exports.InternalServerErrorException = exports.ConflictException = exports.ForbiddenException = exports.UnauthorizedException = exports.NotFoundException = exports.ValidationException = exports.DomainException = exports.BaseException = void 0;
const constants_1 = require("../constants");
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
class BaseException extends Error {
    /**
     * 构造函数
     *
     * @param {string} message - 错误消息
     * @param {string} code - 错误代码
     * @param {number} statusCode - HTTP状态码
     * @param {any} [details] - 错误详情
     */
    constructor(message, code, statusCode, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();
        // 确保堆栈跟踪正确
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * 将异常转换为JSON格式
     *
     * @returns {object} 异常的JSON表示
     */
    toJSON() {
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
exports.BaseException = BaseException;
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
class DomainException extends BaseException {
    constructor(message, code = constants_1.ERROR_CODES.VALIDATION_ERROR, details) {
        super(message, code, 400, details);
    }
}
exports.DomainException = DomainException;
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
class ValidationException extends DomainException {
    constructor(message, errors = []) {
        super(message, constants_1.ERROR_CODES.VALIDATION_ERROR, { errors });
        this.errors = errors;
    }
}
exports.ValidationException = ValidationException;
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
class NotFoundException extends BaseException {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, constants_1.ERROR_CODES.NOT_FOUND, 404, {
            resource,
            id,
        });
    }
}
exports.NotFoundException = NotFoundException;
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
class UnauthorizedException extends BaseException {
    constructor(message = 'Unauthorized') {
        super(message, constants_1.ERROR_CODES.UNAUTHORIZED, 401);
    }
}
exports.UnauthorizedException = UnauthorizedException;
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
class ForbiddenException extends BaseException {
    constructor(message = 'Forbidden') {
        super(message, constants_1.ERROR_CODES.FORBIDDEN, 403);
    }
}
exports.ForbiddenException = ForbiddenException;
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
class ConflictException extends BaseException {
    constructor(message, details) {
        super(message, constants_1.ERROR_CODES.CONFLICT, 409, details);
    }
}
exports.ConflictException = ConflictException;
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
class InternalServerErrorException extends BaseException {
    constructor(message = 'Internal server error', details) {
        super(message, constants_1.ERROR_CODES.INTERNAL_ERROR, 500, details);
    }
}
exports.InternalServerErrorException = InternalServerErrorException;
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
class BusinessException extends DomainException {
    constructor(message, code = constants_1.ERROR_CODES.VALIDATION_ERROR, details) {
        super(message, code, details);
    }
}
exports.BusinessException = BusinessException;
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
class ConcurrencyException extends ConflictException {
    constructor(message = 'Concurrency conflict', details) {
        super(message, details);
    }
}
exports.ConcurrencyException = ConcurrencyException;
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
class DataIsolationException extends ForbiddenException {
    constructor(message = 'Data isolation violation', details) {
        super(message);
        this.details = details;
    }
}
exports.DataIsolationException = DataIsolationException;
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
class CrossTenantAccessException extends DataIsolationException {
    constructor(tenantId, requestedTenantId) {
        super(`Cross-tenant access violation: cannot access tenant ${requestedTenantId} from tenant ${tenantId}`, { tenantId, requestedTenantId });
    }
}
exports.CrossTenantAccessException = CrossTenantAccessException;
//# sourceMappingURL=index.js.map