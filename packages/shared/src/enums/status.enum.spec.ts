import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

import {
  Status,
  StatusTransition,
  StatusUtils,
  InvalidStatusTransitionError,
} from './status.enum';

/**
 * @file status.enum.spec.ts
 * @description 状态枚举单元测试
 *
 * 测试覆盖：
 * - 状态枚举值
 * - 状态转换规则
 * - 状态工具方法
 * - 状态验证逻辑
 * - 异常情况处理
 *
 * @author AI开发团队
 * @since 1.0.0
 */
describe('Status', () => {
  describe('enum values', () => {
    it('should have correct enum values', () => {
      // Assert
      expect(Status.PENDING).toBe('PENDING');
      expect(Status.ACTIVE).toBe('ACTIVE');
      expect(Status.DISABLED).toBe('DISABLED');
      expect(Status.LOCKED).toBe('LOCKED');
      expect(Status.SUSPENDED).toBe('SUSPENDED');
      expect(Status.DELETED).toBe('DELETED');
    });
  });
});

describe('StatusTransition', () => {
  describe('isTransitionAllowed', () => {
    it('should allow same status transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.ACTIVE,
        Status.ACTIVE,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow PENDING to ACTIVE transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.PENDING,
        Status.ACTIVE,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow PENDING to DELETED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.PENDING,
        Status.DELETED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ACTIVE to DISABLED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.ACTIVE,
        Status.DISABLED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ACTIVE to LOCKED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.ACTIVE,
        Status.LOCKED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ACTIVE to SUSPENDED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.ACTIVE,
        Status.SUSPENDED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow ACTIVE to DELETED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.ACTIVE,
        Status.DELETED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow DISABLED to ACTIVE transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.DISABLED,
        Status.ACTIVE,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow DISABLED to DELETED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.DISABLED,
        Status.DELETED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow LOCKED to ACTIVE transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.LOCKED,
        Status.ACTIVE,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow LOCKED to DISABLED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.LOCKED,
        Status.DISABLED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow SUSPENDED to ACTIVE transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.SUSPENDED,
        Status.ACTIVE,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should allow SUSPENDED to DELETED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.SUSPENDED,
        Status.DELETED,
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should not allow DELETED to any other status', () => {
      // Act & Assert
      expect(
        StatusTransition.isTransitionAllowed(Status.DELETED, Status.ACTIVE),
      ).toBe(false);
      expect(
        StatusTransition.isTransitionAllowed(Status.DELETED, Status.PENDING),
      ).toBe(false);
      expect(
        StatusTransition.isTransitionAllowed(Status.DELETED, Status.DISABLED),
      ).toBe(false);
    });

    it('should not allow PENDING to DISABLED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.PENDING,
        Status.DISABLED,
      );

      // Assert
      expect(result).toBe(false);
    });

    it('should not allow DISABLED to LOCKED transition', () => {
      // Act
      const result = StatusTransition.isTransitionAllowed(
        Status.DISABLED,
        Status.LOCKED,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for PENDING', () => {
      // Act
      const transitions = StatusTransition.getAllowedTransitions(
        Status.PENDING,
      );

      // Assert
      expect(transitions).toContain(Status.ACTIVE);
      expect(transitions).toContain(Status.DELETED);
      expect(transitions).toHaveLength(2);
    });

    it('should return allowed transitions for ACTIVE', () => {
      // Act
      const transitions = StatusTransition.getAllowedTransitions(Status.ACTIVE);

      // Assert
      expect(transitions).toContain(Status.DISABLED);
      expect(transitions).toContain(Status.LOCKED);
      expect(transitions).toContain(Status.SUSPENDED);
      expect(transitions).toContain(Status.DELETED);
      expect(transitions).toHaveLength(4);
    });

    it('should return empty array for DELETED', () => {
      // Act
      const transitions = StatusTransition.getAllowedTransitions(
        Status.DELETED,
      );

      // Assert
      expect(transitions).toHaveLength(0);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for allowed transition', () => {
      // Act & Assert
      expect(() => {
        StatusTransition.validateTransition(Status.PENDING, Status.ACTIVE);
      }).not.toThrow();
    });

    it('should throw InvalidStatusTransitionError for disallowed transition', () => {
      // Act & Assert
      expect(() => {
        StatusTransition.validateTransition(Status.PENDING, Status.DISABLED);
      }).toThrow(InvalidStatusTransitionError);
    });
  });
});

describe('StatusUtils', () => {
  describe('canLogin', () => {
    it('should return true for ACTIVE status', () => {
      // Act
      const result = StatusUtils.canLogin(Status.ACTIVE);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-ACTIVE status', () => {
      // Act & Assert
      expect(StatusUtils.canLogin(Status.PENDING)).toBe(false);
      expect(StatusUtils.canLogin(Status.DISABLED)).toBe(false);
      expect(StatusUtils.canLogin(Status.LOCKED)).toBe(false);
      expect(StatusUtils.canLogin(Status.SUSPENDED)).toBe(false);
      expect(StatusUtils.canLogin(Status.DELETED)).toBe(false);
    });
  });

  describe('isDisabled', () => {
    it('should return true for disabled statuses', () => {
      // Act & Assert
      expect(StatusUtils.isDisabled(Status.DISABLED)).toBe(true);
      expect(StatusUtils.isDisabled(Status.LOCKED)).toBe(true);
      expect(StatusUtils.isDisabled(Status.SUSPENDED)).toBe(true);
      expect(StatusUtils.isDisabled(Status.DELETED)).toBe(true);
    });

    it('should return false for active statuses', () => {
      // Act & Assert
      expect(StatusUtils.isDisabled(Status.PENDING)).toBe(false);
      expect(StatusUtils.isDisabled(Status.ACTIVE)).toBe(false);
    });
  });

  describe('needsActivation', () => {
    it('should return true for PENDING status', () => {
      // Act
      const result = StatusUtils.needsActivation(Status.PENDING);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-PENDING status', () => {
      // Act & Assert
      expect(StatusUtils.needsActivation(Status.ACTIVE)).toBe(false);
      expect(StatusUtils.needsActivation(Status.DISABLED)).toBe(false);
      expect(StatusUtils.needsActivation(Status.LOCKED)).toBe(false);
      expect(StatusUtils.needsActivation(Status.SUSPENDED)).toBe(false);
      expect(StatusUtils.needsActivation(Status.DELETED)).toBe(false);
    });
  });

  describe('isDeleted', () => {
    it('should return true for DELETED status', () => {
      // Act
      const result = StatusUtils.isDeleted(Status.DELETED);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-DELETED status', () => {
      // Act & Assert
      expect(StatusUtils.isDeleted(Status.PENDING)).toBe(false);
      expect(StatusUtils.isDeleted(Status.ACTIVE)).toBe(false);
      expect(StatusUtils.isDeleted(Status.DISABLED)).toBe(false);
      expect(StatusUtils.isDeleted(Status.LOCKED)).toBe(false);
      expect(StatusUtils.isDeleted(Status.SUSPENDED)).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return correct display names', () => {
      // Act & Assert
      expect(StatusUtils.getDisplayName(Status.PENDING)).toBe('待激活');
      expect(StatusUtils.getDisplayName(Status.ACTIVE)).toBe('正常');
      expect(StatusUtils.getDisplayName(Status.DISABLED)).toBe('已禁用');
      expect(StatusUtils.getDisplayName(Status.LOCKED)).toBe('已锁定');
      expect(StatusUtils.getDisplayName(Status.SUSPENDED)).toBe('已暂停');
      expect(StatusUtils.getDisplayName(Status.DELETED)).toBe('已删除');
    });
  });

  describe('getDescription', () => {
    it('should return correct descriptions', () => {
      // Act & Assert
      expect(StatusUtils.getDescription(Status.PENDING)).toBe(
        '已注册但未激活，需要邮箱验证或管理员激活',
      );
      expect(StatusUtils.getDescription(Status.ACTIVE)).toBe(
        '账户正常可用，可以正常登录和使用系统',
      );
      expect(StatusUtils.getDescription(Status.DISABLED)).toBe(
        '账户被管理员禁用，不能登录但数据保留',
      );
      expect(StatusUtils.getDescription(Status.LOCKED)).toBe(
        '账户因安全原因被锁定，通常因多次登录失败触发',
      );
      expect(StatusUtils.getDescription(Status.SUSPENDED)).toBe(
        '账户被临时暂停，可以恢复但需要管理员操作',
      );
      expect(StatusUtils.getDescription(Status.DELETED)).toBe(
        '账户已被删除，数据可能被软删除或硬删除',
      );
    });
  });
});

describe('InvalidStatusTransitionError', () => {
  it('should create error with correct name and message', () => {
    // Arrange
    const message = 'Invalid status transition from PENDING to DISABLED';

    // Act
    const error = new InvalidStatusTransitionError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InvalidStatusTransitionError);
    expect(error.name).toBe('InvalidStatusTransitionError');
    expect(error.message).toBe(message);
  });
});
