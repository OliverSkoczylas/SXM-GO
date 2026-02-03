import {
  emailSchema,
  passwordSchema,
  displayNameSchema,
  signUpSchema,
  signInSchema,
  changePasswordSchema,
} from '../../src/auth/utils/validation';

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = emailSchema.safeParse('  user@example.com  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('rejects email over 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    expect(emailSchema.safeParse(longEmail).success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts valid password', () => {
    expect(passwordSchema.safeParse('MyPass1!').success).toBe(true);
  });

  it('rejects short password', () => {
    expect(passwordSchema.safeParse('Ab1!').success).toBe(false);
  });

  it('rejects password without uppercase', () => {
    expect(passwordSchema.safeParse('mypass1!').success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    expect(passwordSchema.safeParse('MYPASS1!').success).toBe(false);
  });

  it('rejects password without number', () => {
    expect(passwordSchema.safeParse('MyPass!!').success).toBe(false);
  });

  it('rejects password without special character', () => {
    expect(passwordSchema.safeParse('MyPass12').success).toBe(false);
  });

  it('rejects password over 128 characters', () => {
    const longPass = 'Aa1!' + 'x'.repeat(125);
    expect(passwordSchema.safeParse(longPass).success).toBe(false);
  });
});

describe('displayNameSchema', () => {
  it('accepts valid name', () => {
    expect(displayNameSchema.safeParse('John Doe').success).toBe(true);
  });

  it('accepts name with hyphen and apostrophe', () => {
    expect(displayNameSchema.safeParse("O'Brien-Smith").success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(displayNameSchema.safeParse('').success).toBe(false);
  });

  it('rejects name over 50 characters', () => {
    expect(displayNameSchema.safeParse('a'.repeat(51)).success).toBe(false);
  });

  it('rejects name with special characters', () => {
    expect(displayNameSchema.safeParse('John<script>').success).toBe(false);
  });
});

describe('signUpSchema', () => {
  const validInput = {
    email: 'user@example.com',
    password: 'MyPass1!',
    displayName: 'John Doe',
    acceptTerms: true as const,
    acceptPrivacy: true as const,
  };

  it('accepts valid signup input', () => {
    expect(signUpSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects when terms not accepted', () => {
    expect(signUpSchema.safeParse({ ...validInput, acceptTerms: false }).success).toBe(false);
  });

  it('rejects when privacy not accepted', () => {
    expect(signUpSchema.safeParse({ ...validInput, acceptPrivacy: false }).success).toBe(false);
  });
});

describe('signInSchema', () => {
  it('accepts valid signin input', () => {
    expect(
      signInSchema.safeParse({ email: 'user@example.com', password: 'anything' }).success,
    ).toBe(true);
  });

  it('rejects empty password', () => {
    expect(
      signInSchema.safeParse({ email: 'user@example.com', password: '' }).success,
    ).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts matching valid passwords', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'NewPass1!',
        confirmPassword: 'NewPass1!',
      }).success,
    ).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'NewPass1!',
        confirmPassword: 'Different1!',
      }).success,
    ).toBe(false);
  });
});
