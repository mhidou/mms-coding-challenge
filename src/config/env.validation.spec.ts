import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('applies local-development defaults when nothing is set', () => {
    const env = validateEnv({});

    expect(env.PORT).toBe(3000);
    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/order-management');
  });

  it('accepts and converts valid overrides', () => {
    const env = validateEnv({
      PORT: '4000',
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/orders',
    });

    expect(env.PORT).toBe(4000);
    expect(env.MONGODB_URI).toBe(
      'mongodb+srv://user:pass@cluster.example.net/orders',
    );
  });

  it.each([
    ['a non-numeric port', { PORT: 'not-a-port' }],
    ['a port out of range', { PORT: '70000' }],
    ['a malformed MongoDB URI', { MONGODB_URI: 'http://localhost:27017' }],
  ])('rejects %s', (_label, override) => {
    expect(() => validateEnv(override)).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('ignores unrelated environment variables', () => {
    const env = validateEnv({ HOME: '/home/user', PORT: '4000' });

    expect(env).not.toHaveProperty('HOME');
    expect(env.PORT).toBe(4000);
  });
});
