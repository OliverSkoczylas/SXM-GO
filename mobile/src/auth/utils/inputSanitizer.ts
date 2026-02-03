// Input sanitization utilities
// TR-025: Prevent XSS vectors in user-provided text.
// Supabase parameterizes queries (SQL injection is handled at the DB level),
// but we sanitize for cases where data may be rendered in web views or shared.

export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeProfileUpdate(
  update: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update)) {
    sanitized[key] = typeof value === 'string' ? sanitizeText(value) : value;
  }
  return sanitized;
}
