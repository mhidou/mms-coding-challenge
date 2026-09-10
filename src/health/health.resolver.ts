import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String, { description: 'Liveness probe for the API.' })
  health(): string {
    return 'ok';
  }
}
