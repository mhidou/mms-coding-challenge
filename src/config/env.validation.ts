import { plainToInstance } from 'class-transformer';
import { IsInt, Matches, Max, Min, validateSync } from 'class-validator';

/**
 * Environment variables consumed by the application.
 *
 * Defaults target local development (docker-compose MongoDB); every value
 * can be overridden through the environment or a `.env` file.
 */
export class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @Matches(/^mongodb(\+srv)?:\/\/\S+$/, {
    message: 'MONGODB_URI must be a valid MongoDB connection string',
  })
  MONGODB_URI: string = 'mongodb://localhost:27017/order-management';
}

/**
 * Validates raw environment variables at startup.
 * Throws (aborting the boot) when any value is invalid, so the app
 * fails fast instead of misbehaving at runtime.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, {
    whitelist: true,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validated;
}
