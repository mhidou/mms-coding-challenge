import { BadRequestException, Catch } from '@nestjs/common';
import { type GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

import { DomainError } from '../domain/errors';

/**
 * Surfaces business-rule violations as GraphQL errors carrying their
 * machine-readable code in `extensions.code`, instead of generic 500s.
 */
@Catch(DomainError)
export class DomainErrorFilter implements GqlExceptionFilter {
  catch(exception: DomainError): GraphQLError {
    return new GraphQLError(exception.message, {
      extensions: { code: exception.code },
    });
  }
}

/**
 * Maps ValidationPipe rejections (malformed user input) to the
 * conventional BAD_USER_INPUT GraphQL error code.
 */
@Catch(BadRequestException)
export class BadUserInputFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException): GraphQLError {
    const response = exception.getResponse();
    const messages =
      typeof response === 'object' && 'message' in response
        ? (response as { message: string | string[] }).message
        : exception.message;

    return new GraphQLError(
      `Invalid input: ${Array.isArray(messages) ? messages.join('; ') : messages}`,
      { extensions: { code: 'BAD_USER_INPUT' } },
    );
  }
}
