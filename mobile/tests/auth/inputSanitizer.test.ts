import { sanitizeText, sanitizeProfileUpdate } from '../../src/auth/utils/inputSanitizer';

describe('sanitizeText', () => {
  it('escapes HTML angle brackets', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
    );
  });

  it('escapes ampersands', () => {
    expect(sanitizeText('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes single quotes', () => {
    expect(sanitizeText("it's")).toBe('it&#x27;s');
  });

  it('passes through safe text unchanged', () => {
    expect(sanitizeText('Hello World 123')).toBe('Hello World 123');
  });
});

describe('sanitizeProfileUpdate', () => {
  it('sanitizes string values', () => {
    const result = sanitizeProfileUpdate({
      display_name: '<b>Bold</b>',
      bio: 'Normal text',
    });
    expect(result.display_name).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
    expect(result.bio).toBe('Normal text');
  });

  it('passes through non-string values', () => {
    const result = sanitizeProfileUpdate({
      location_tracking_enabled: true,
      display_name: 'Test',
    });
    expect(result.location_tracking_enabled).toBe(true);
    expect(result.display_name).toBe('Test');
  });
});
