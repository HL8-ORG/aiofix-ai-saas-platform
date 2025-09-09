import { describe, it, expect } from '@jest/globals';

import { UserId, InvalidUserIdError } from './user-id.vo';

/**
 * @file user-id.vo.spec.ts
 * @description 用户ID值对象单元测试
 *
 * 测试覆盖：
 * - 用户ID创建和验证
 * - 用户ID相等性比较
 * - 用户ID字符串转换
 * - 异常情况处理
 *
 * @author AI开发团队
 * @since 1.0.0
 */
describe('UserId', () => {
  describe('constructor', () => {
    it('should create UserId with valid UUID', () => {
      // Arrange
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const userId = new UserId(validUuid);

      // Assert
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(validUuid);
    });

    it('should create UserId with generated UUID when no value provided', () => {
      // Act
      const userId = new UserId();

      // Assert
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should throw InvalidUserIdError for invalid UUID format', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act & Assert
      expect(() => {
        new UserId(invalidUuid);
      }).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => {
        new UserId(emptyString);
      }).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for null value', () => {
      // Act & Assert
      expect(() => {
        new UserId(null as any);
      }).toThrow(InvalidUserIdError);
    });

    it('should throw InvalidUserIdError for undefined value', () => {
      // Act & Assert
      expect(() => {
        new UserId(undefined as any);
      }).toThrow(InvalidUserIdError);
    });
  });

  describe('equals', () => {
    it('should return true for same UserId instances', () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1 = new UserId(uuid);
      const userId2 = new UserId(uuid);

      // Act
      const result = userId1.equals(userId2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for different UserId instances', () => {
      // Arrange
      const userId1 = new UserId('123e4567-e89b-12d3-a456-426614174000');
      const userId2 = new UserId('987fcdeb-51a2-43d1-b789-123456789abc');

      // Act
      const result = userId1.equals(userId2);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when comparing with non-UserId object', () => {
      // Arrange
      const userId = new UserId('123e4567-e89b-12d3-a456-426614174000');
      const otherObject = { value: '123e4567-e89b-12d3-a456-426614174000' };

      // Act
      const result = userId.equals(otherObject as any);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return UUID string representation', () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = new UserId(uuid);

      // Act
      const result = userId.toString();

      // Assert
      expect(result).toBe(uuid);
    });
  });

  describe('fromString', () => {
    it('should create UserId from valid UUID string', () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const userId = UserId.fromString(uuid);

      // Assert
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(uuid);
    });

    it('should throw InvalidUserIdError for invalid UUID string', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act & Assert
      expect(() => {
        UserId.fromString(invalidUuid);
      }).toThrow(InvalidUserIdError);
    });
  });

  describe('isValid', () => {
    it('should return true for valid UUID', () => {
      // Arrange
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const result = UserId.isValid(validUuid);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act
      const result = UserId.isValid(invalidUuid);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act
      const result = UserId.isValid(emptyString);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for null value', () => {
      // Act
      const result = UserId.isValid(null as any);

      // Assert
      expect(result).toBe(false);
    });
  });
});

describe('InvalidUserIdError', () => {
  it('should create error with correct name and message', () => {
    // Arrange
    const message = 'Invalid user ID format';

    // Act
    const error = new InvalidUserIdError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InvalidUserIdError);
    expect(error.name).toBe('InvalidUserIdError');
    expect(error.message).toBe(message);
  });
});
