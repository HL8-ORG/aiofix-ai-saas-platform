import { describe, it, expect } from '@jest/globals';
import { UserId, InvalidUserIdError } from './user-id.vo';

describe('UserId', () => {
  describe('constructor', () => {
    it('should create UserId with valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = new UserId(validUuid);

      expect(userId.toString()).toBe(validUuid);
    });

    it('should throw InvalidUserIdError for empty string', () => {
      expect(() => new UserId('')).toThrow(InvalidUserIdError);
      expect(() => new UserId('')).toThrow('User ID cannot be empty');
    });

    it('should throw InvalidUserIdError for invalid UUID format', () => {
      expect(() => new UserId('invalid-uuid')).toThrow(InvalidUserIdError);
      expect(() => new UserId('invalid-uuid')).toThrow('Invalid UUID format');
    });

    it('should throw InvalidUserIdError for null or undefined', () => {
      expect(() => new UserId(null as any)).toThrow(InvalidUserIdError);
      expect(() => new UserId(undefined as any)).toThrow(InvalidUserIdError);
    });
  });

  describe('generate', () => {
    it('should generate valid UUID', () => {
      const userId = UserId.generate();

      expect(userId.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate different UUIDs', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      expect(userId1.toString()).not.toBe(userId2.toString());
    });
  });

  describe('fromString', () => {
    it('should create UserId from valid string', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = UserId.fromString(validUuid);

      expect(userId.toString()).toBe(validUuid);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = new UserId(validUuid);

      expect(userId.toString()).toBe(validUuid);
    });
  });

  describe('equals', () => {
    it('should return true for same UserId', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1 = new UserId(validUuid);
      const userId2 = new UserId(validUuid);

      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different UserIds', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const userId = UserId.generate();

      expect(userId.equals(null as any)).toBe(false);
      expect(userId.equals(undefined as any)).toBe(false);
    });
  });
});
