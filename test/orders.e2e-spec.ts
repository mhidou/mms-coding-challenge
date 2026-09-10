import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { AppModule } from '../src/app.module';

interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: Array<{ message: string; extensions: { code: string } }>;
}

interface OrderShape {
  id: string;
  state: string;
  assignedEmployeeId: string | null;
  customer: { name: string; email: string };
  lineItems: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

const CREATE_ORDER = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      state
      assignedEmployeeId
      customer { name email }
      lineItems { productName quantity unitPriceCents }
      createdAt
      updatedAt
    }
  }
`;

const START_ORDER = `
  mutation StartOrder($orderId: ID!, $employeeId: ID!) {
    startOrder(orderId: $orderId, employeeId: $employeeId) {
      id
      state
      assignedEmployeeId
    }
  }
`;

const COMPLETE_ORDER = `
  mutation CompleteOrder($orderId: ID!) {
    completeOrder(orderId: $orderId) { id state }
  }
`;

const VALID_INPUT = {
  customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
  lineItems: [
    { productName: 'Laptop', quantity: 1, unitPriceCents: 99900 },
    { productName: 'Mouse', quantity: 2, unitPriceCents: 2500 },
  ],
};

describe('Orders GraphQL API (e2e)', () => {
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

  async function graphql<TData>(
    query: string,
    variables?: Record<string, unknown>,
    // Apollo answers 400 when the query itself is invalid (parse/validation
    // phase) and 200 for execution errors, per the GraphQL-over-HTTP spec.
    expectedStatus = 200,
  ): Promise<GraphQLResponse<TData>> {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables })
      .expect(expectedStatus);
    return response.body as GraphQLResponse<TData>;
  }

  async function createOrder(): Promise<string> {
    const body = await graphql<{ createOrder: OrderShape }>(CREATE_ORDER, {
      input: VALID_INPUT,
    });
    expect(body.errors).toBeUndefined();
    return body.data!.createOrder.id;
  }

  function expectErrorCode(body: GraphQLResponse<unknown>, code: string): void {
    expect(body.data ?? null).toBeNull();
    expect(body.errors).toHaveLength(1);
    expect(body.errors![0].extensions.code).toBe(code);
  }

  describe('order lifecycle', () => {
    it('creates an order in OPEN state with its details', async () => {
      const body = await graphql<{ createOrder: OrderShape }>(CREATE_ORDER, {
        input: VALID_INPUT,
      });

      expect(body.errors).toBeUndefined();
      const order = body.data!.createOrder;
      expect(order.state).toBe('OPEN');
      expect(order.assignedEmployeeId).toBeNull();
      expect(order.customer).toEqual(VALID_INPUT.customer);
      expect(order.lineItems).toEqual(VALID_INPUT.lineItems);
      expect(Date.parse(order.createdAt)).not.toBeNaN();
      expect(Date.parse(order.updatedAt)).not.toBeNaN();
    });

    it('walks an order through OPEN -> IN_PROGRESS -> COMPLETE', async () => {
      const orderId = await createOrder();

      const started = await graphql<{ startOrder: OrderShape }>(START_ORDER, {
        orderId,
        employeeId: 'emp-001',
      });
      expect(started.errors).toBeUndefined();
      expect(started.data!.startOrder.state).toBe('IN_PROGRESS');
      expect(started.data!.startOrder.assignedEmployeeId).toBe('emp-001');

      const completed = await graphql<{ completeOrder: OrderShape }>(
        COMPLETE_ORDER,
        { orderId },
      );
      expect(completed.errors).toBeUndefined();
      expect(completed.data!.completeOrder.state).toBe('COMPLETE');
    });

    it('reads a single order and lists orders with the state filter', async () => {
      const orderId = await createOrder();

      const single = await graphql<{ order: Pick<OrderShape, 'id' | 'state'> }>(
        `
          query Order($id: ID!) {
            order(id: $id) {
              id
              state
            }
          }
        `,
        { id: orderId },
      );
      expect(single.errors).toBeUndefined();
      expect(single.data!.order).toEqual({ id: orderId, state: 'OPEN' });

      const list = await graphql<{
        orders: {
          totalCount: number;
          items: Array<Pick<OrderShape, 'id' | 'state'>>;
        };
      }>(`
        query {
          orders(state: OPEN, limit: 100) {
            totalCount
            items {
              id
              state
            }
          }
        }
      `);
      expect(list.errors).toBeUndefined();
      const page = list.data!.orders;
      expect(page.totalCount).toBeGreaterThanOrEqual(1);
      expect(page.items.map((item) => item.id)).toContain(orderId);
      expect(page.items.every((item) => item.state === 'OPEN')).toBe(true);
    });
  });

  describe('state machine rules', () => {
    it('rejects completing an OPEN order (skipping a state)', async () => {
      const orderId = await createOrder();

      const body = await graphql(COMPLETE_ORDER, { orderId });

      expectErrorCode(body, 'INVALID_TRANSITION');
      expect(body.errors![0].message).toContain('OPEN');
    });

    it('rejects starting an order twice', async () => {
      const orderId = await createOrder();
      await graphql(START_ORDER, { orderId, employeeId: 'emp-001' });

      const body = await graphql(START_ORDER, {
        orderId,
        employeeId: 'emp-002',
      });

      expectErrorCode(body, 'INVALID_TRANSITION');
    });

    it('rejects starting an order with a blank employee id', async () => {
      const orderId = await createOrder();

      const body = await graphql(START_ORDER, { orderId, employeeId: '  ' });

      expectErrorCode(body, 'EMPLOYEE_REQUIRED');
    });
  });

  describe('input handling', () => {
    it('answers ORDER_NOT_FOUND for an unknown order id', async () => {
      const body = await graphql(`
        query {
          order(id: "65f0c6a2e4b0a1b2c3d4e5f6") {
            id
          }
        }
      `);

      expectErrorCode(body, 'ORDER_NOT_FOUND');
    });

    it('answers ORDER_NOT_FOUND for a malformed order id instead of crashing', async () => {
      const body = await graphql(`
        query {
          order(id: "not-an-object-id") {
            id
          }
        }
      `);

      expectErrorCode(body, 'ORDER_NOT_FOUND');
    });

    it('rejects an order without line items as BAD_USER_INPUT', async () => {
      const body = await graphql(CREATE_ORDER, {
        input: { ...VALID_INPUT, lineItems: [] },
      });

      expectErrorCode(body, 'BAD_USER_INPUT');
      expect(body.errors![0].message).toContain('at least one line item');
    });

    it('rejects an invalid customer email as BAD_USER_INPUT', async () => {
      const body = await graphql(CREATE_ORDER, {
        input: {
          ...VALID_INPUT,
          customer: { name: 'Ada', email: 'not-an-email' },
        },
      });

      expectErrorCode(body, 'BAD_USER_INPUT');
    });

    it('rejects a zero quantity as BAD_USER_INPUT', async () => {
      const body = await graphql(CREATE_ORDER, {
        input: {
          ...VALID_INPUT,
          lineItems: [
            { productName: 'Laptop', quantity: 0, unitPriceCents: 1 },
          ],
        },
      });

      expectErrorCode(body, 'BAD_USER_INPUT');
    });

    it('answers a GraphQL validation error for an unknown state filter', async () => {
      const body = await graphql(
        `
          query {
            orders(state: SHIPPED) {
              totalCount
            }
          }
        `,
        undefined,
        400,
      );

      expect(body.errors).toBeDefined();
      expect(body.errors![0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });
  });
});
