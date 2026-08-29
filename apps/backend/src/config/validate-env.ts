const WEAK_SECRETS = new Set([
  'your-secret-key-change-in-production',
  'your-refresh-secret-change-in-production',
  'default-secret',
]);

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing: string[] = [];
  const jwtSecret = process.env.JWT_SECRET || '';
  const jwtRefresh = process.env.JWT_REFRESH_SECRET || '';

  if (!jwtSecret || jwtSecret.length < 32 || WEAK_SECRETS.has(jwtSecret)) {
    missing.push('JWT_SECRET (min 32 chars, not default)');
  }
  if (!jwtRefresh || jwtRefresh.length < 32 || WEAK_SECRETS.has(jwtRefresh)) {
    missing.push('JWT_REFRESH_SECRET (min 32 chars, not default)');
  }
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    missing.push('DATABASE_URL or DB_* settings');
  }
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    missing.push('REDIS_URL or REDIS_HOST');
  }
  const cors = process.env.CORS_ORIGIN || '';
  if (!cors || cors === '*') {
    missing.push('CORS_ORIGIN (explicit allowlist, not *)');
  }

  if (missing.length) {
    throw new Error(`Production env invalid: ${missing.join('; ')}`);
  }
}
