import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { AppModule } from '../src/app.module';

describe('Employees GraphQL API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the seeded employees', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ employees { id name } }' })
      .expect(200);

    const body = response.body as {
      data: { employees: Array<{ id: string; name: string }> };
    };
    const employees = body.data.employees;
    expect(employees.length).toBeGreaterThanOrEqual(4);
    expect(employees).toContainEqual({ id: 'emp-001', name: 'Alice Johnson' });
    expect(employees).toContainEqual({ id: 'emp-002', name: 'Bob Martin' });
  });
});
