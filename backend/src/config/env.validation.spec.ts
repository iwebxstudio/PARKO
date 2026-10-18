import { validate, Environment } from './env.validation';

describe('Environment Configuration Validation', () => {
  const validConfig = {
    NODE_ENV: 'development',
    BACKEND_PORT: '3000',
    DATABASE_URL:
      'postgresql://parko:password@localhost:5432/parko_db?schema=public',
    JWT_SECRET: 'super-secure-jwt-key-minimum-16-chars',
    JWT_ACCESS_EXPIRATION: '15m',
    JWT_REFRESH_EXPIRATION: '7d',
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE: '5242880',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
  };

  it('should pass and coerce values for valid configuration', () => {
    const validated = validate(validConfig);
    expect(validated.NODE_ENV).toBe(Environment.Development);
    expect(validated.BACKEND_PORT).toBe(3000);
    expect(validated.DATABASE_URL).toBe(validConfig.DATABASE_URL);
    expect(validated.JWT_SECRET).toBe(validConfig.JWT_SECRET);
    expect(validated.MAX_FILE_SIZE).toBe(5242880);
    expect(validated.REDIS_PORT).toBe(6379);
  });

  it('should fail fast if DATABASE_URL is missing', () => {
    const invalidConfig = { ...validConfig };
    delete (invalidConfig as Record<string, any>).DATABASE_URL;
    expect(() => validate(invalidConfig)).toThrow('[Configuration Error]');
  });

  it('should fail fast if JWT_SECRET is missing', () => {
    const invalidConfig = { ...validConfig };
    delete (invalidConfig as Record<string, any>).JWT_SECRET;
    expect(() => validate(invalidConfig)).toThrow('[Configuration Error]');
  });

  it('should fail if JWT_SECRET is shorter than 16 characters', () => {
    const shortSecretConfig = {
      ...validConfig,
      JWT_SECRET: 'too-short-key',
    };
    expect(() => validate(shortSecretConfig)).toThrow(
      'JWT_SECRET must be at least 16 characters long',
    );
  });

  it('should fail if NODE_ENV has an invalid enum value', () => {
    const invalidEnvConfig = {
      ...validConfig,
      NODE_ENV: 'invalid_environment',
    };
    expect(() => validate(invalidEnvConfig)).toThrow('[Configuration Error]');
  });
});
