/// <reference types="jest" />
/* eslint-env jest */
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

import { Email, InvalidEmailError } from './email.vo';

/**
 * @file email.vo.spec.ts
 * @description 邮箱值对象单元测试
 *
 * 测试覆盖：
 * - 邮箱创建和验证
 * - 邮箱格式验证
 * - 邮箱相等性比较
 * - 邮箱域名检测
 * - 异常情况处理
 *
 * @author AI开发团队
 * @since 1.0.0
 */
describe('Email', () => {
  describe('constructor', () => {
    it('should create Email with valid email address', () => {
      // Arrange
      const validEmail = 'test@example.com';

      // Act
      const email = new Email(validEmail);

      // Assert
      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe(validEmail.toLowerCase());
    });

    it('should normalize email to lowercase', () => {
      // Arrange
      const mixedCaseEmail = 'Test@Example.COM';

      // Act
      const email = new Email(mixedCaseEmail);

      // Assert
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace from email', () => {
      // Arrange
      const emailWithSpaces = '  test@example.com  ';

      // Act
      const email = new Email(emailWithSpaces);

      // Assert
      expect(email.value).toBe('test@example.com');
    });

    it('should throw InvalidEmailError for invalid email format', () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act & Assert
      expect(() => {
        new Email(invalidEmail);
      }).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => {
        new Email(emptyString);
      }).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email without @ symbol', () => {
      // Arrange
      const emailWithoutAt = 'testexample.com';

      // Act & Assert
      expect(() => {
        new Email(emailWithoutAt);
      }).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email that is too long', () => {
      // Arrange
      const longEmail = 'a'.repeat(250) + '@example.com';

      // Act & Assert
      expect(() => {
        new Email(longEmail);
      }).toThrow(InvalidEmailError);
    });

    it('should throw InvalidEmailError for email with local part too long', () => {
      // Arrange
      const longLocalPart = 'a'.repeat(65) + '@example.com';

      // Act & Assert
      expect(() => {
        new Email(longLocalPart);
      }).toThrow(InvalidEmailError);
    });
  });

  describe('equals', () => {
    it('should return true for same Email instances', () => {
      // Arrange
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for emails with different case', () => {
      // Arrange
      const email1 = new Email('Test@Example.COM');
      const email2 = new Email('test@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for different Email instances', () => {
      // Arrange
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when comparing with non-Email object', () => {
      // Arrange
      const email = new Email('test@example.com');
      const otherObject = { value: 'test@example.com' };

      // Act
      const result = email.equals(otherObject as any);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getLocalPart', () => {
    it('should return local part of email', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const localPart = email.getLocalPart();

      // Assert
      expect(localPart).toBe('test');
    });

    it('should return local part for complex email', () => {
      // Arrange
      const email = new Email('user.name+tag@example.com');

      // Act
      const localPart = email.getLocalPart();

      // Assert
      expect(localPart).toBe('user.name+tag');
    });
  });

  describe('getDomain', () => {
    it('should return domain part of email', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const domain = email.getDomain();

      // Assert
      expect(domain).toBe('example.com');
    });

    it('should return domain for complex email', () => {
      // Arrange
      const email = new Email('test@sub.example.com');

      // Act
      const domain = email.getDomain();

      // Assert
      expect(domain).toBe('sub.example.com');
    });
  });

  describe('isFromDomain', () => {
    it('should return true for matching domain', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.isFromDomain('example.com');

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for matching domain with different case', () => {
      // Arrange
      const email = new Email('test@Example.COM');

      // Act
      const result = email.isFromDomain('example.com');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-matching domain', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.isFromDomain('other.com');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isGmail', () => {
    it('should return true for Gmail address', () => {
      // Arrange
      const email = new Email('test@gmail.com');

      // Act
      const result = email.isGmail();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-Gmail address', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.isGmail();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isOutlook', () => {
    it('should return true for Outlook address', () => {
      // Arrange
      const email = new Email('test@outlook.com');

      // Act
      const result = email.isOutlook();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for Hotmail address', () => {
      // Arrange
      const email = new Email('test@hotmail.com');

      // Act
      const result = email.isOutlook();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-Outlook address', () => {
      // Arrange
      const email = new Email('test@example.com');

      // Act
      const result = email.isOutlook();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isCorporate', () => {
    it('should return true for corporate email', () => {
      // Arrange
      const email = new Email('test@company.com');

      // Act
      const result = email.isCorporate();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for Gmail address', () => {
      // Arrange
      const email = new Email('test@gmail.com');

      // Act
      const result = email.isCorporate();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for Outlook address', () => {
      // Arrange
      const email = new Email('test@outlook.com');

      // Act
      const result = email.isCorporate();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string representation', () => {
      // Arrange
      const emailString = 'test@example.com';
      const email = new Email(emailString);

      // Act
      const result = email.toString();

      // Assert
      expect(result).toBe(emailString);
    });
  });

  describe('fromString', () => {
    it('should create Email from valid string', () => {
      // Arrange
      const emailString = 'test@example.com';

      // Act
      const email = Email.fromString(emailString);

      // Assert
      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe(emailString);
    });

    it('should throw InvalidEmailError for invalid string', () => {
      // Arrange
      const invalidString = 'invalid-email';

      // Act & Assert
      expect(() => {
        Email.fromString(invalidString);
      }).toThrow(InvalidEmailError);
    });
  });

  describe('isValid', () => {
    it('should return true for valid email', () => {
      // Arrange
      const validEmail = 'test@example.com';

      // Act
      const result = Email.isValid(validEmail);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid email', () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act
      const result = Email.isValid(invalidEmail);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act
      const result = Email.isValid(emptyString);

      // Assert
      expect(result).toBe(false);
    });
  });
});

describe('InvalidEmailError', () => {
  it('should create error with correct name and message', () => {
    // Arrange
    const message = 'Invalid email format';

    // Act
    const error = new InvalidEmailError(message);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InvalidEmailError);
    expect(error.name).toBe('InvalidEmailError');
    expect(error.message).toBe(message);
  });
});
