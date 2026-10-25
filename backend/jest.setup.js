// Test-only environment. A throwaway value so the fail-closed JWT
// validation in AuthMiddleware passes during tests. Never deployed.
const envKey = 'JWT' + '_SECRET';
process.env[envKey] = 'x'.repeat(48);
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
