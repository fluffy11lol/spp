import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';

describe('AuthSchema Validation Tests', () => {
  it('should accept valid registration input', () => {
    const valid = {
      email: 'barista@brewlog.local',
      password: 'StrongPassword123!',
      name: 'James Hoffmann',
      role: 'Barista',
    };
    const result = registerSchema.safeParse(valid);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, 'barista@brewlog.local');
      assert.equal(result.data.role, 'Barista');
    }
  });

  it('should reject invalid email format in registration', () => {
    const invalid = {
      email: 'invalid-email-address',
      password: 'StrongPassword123!',
      name: 'Barista',
    };
    const result = registerSchema.safeParse(invalid);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.find((i) => i.path[0] === 'email'));
    }
  });

  it('should reject short password under 6 characters', () => {
    const invalid = {
      email: 'user@brewlog.local',
      password: '123',
      name: 'User',
    };
    const result = registerSchema.safeParse(invalid);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.find((i) => i.path[0] === 'password'));
    }
  });

  it('should default role to Taster if not specified in registration', () => {
    const withoutRole = {
      email: 'taster@brewlog.local',
      password: 'Password123!',
      name: 'Q Grader',
    };
    const result = registerSchema.safeParse(withoutRole);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.role, 'Taster');
    }
  });

  it('should validate login credentials', () => {
    const valid = { email: 'admin@brewlog.local', password: 'AdminPassword!' };
    assert.equal(loginSchema.safeParse(valid).success, true);

    const empty = { email: 'admin@brewlog.local', password: '' };
    assert.equal(loginSchema.safeParse(empty).success, false);
  });

  it('should validate forgot-password email request', () => {
    assert.equal(
      forgotPasswordSchema.safeParse({ email: 'user@brewlog.local' }).success,
      true
    );
    assert.equal(
      forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success,
      false
    );
  });

  it('should validate password reset with token and new password', () => {
    const valid = { token: 'valid-reset-token-12345', newPassword: 'NewSecurePassword123!' };
    assert.equal(resetPasswordSchema.safeParse(valid).success, true);

    const invalid = { token: '', newPassword: 'short' };
    assert.equal(resetPasswordSchema.safeParse(invalid).success, false);
  });
});
