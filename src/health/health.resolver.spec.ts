import { HealthResolver } from './health.resolver';

describe('HealthResolver', () => {
  it('reports the API as alive', () => {
    expect(new HealthResolver().health()).toBe('ok');
  });
});
