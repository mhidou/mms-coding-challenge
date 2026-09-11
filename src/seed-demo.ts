import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { OrdersService } from './orders/orders.service';

/**
 * Seeds a handful of sample orders for the live demo. Orders are created
 * through the domain services — never inserted raw — so every state is
 * reached through legal transitions, exactly as production traffic would.
 */
async function seedDemo(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const orders = app.get(OrdersService);

    const existing = await orders.countOrders();
    if (existing > 0) {
      console.log(
        `Database already contains ${existing} order(s) — nothing to seed`,
      );
      return;
    }

    const open = [
      {
        customer: { name: 'Grace Hopper', email: 'grace@example.com' },
        lineItems: [
          { productName: '55" OLED TV', quantity: 1, unitPriceCents: 129900 },
          { productName: 'HDMI cable', quantity: 2, unitPriceCents: 1499 },
        ],
      },
      {
        customer: { name: 'Alan Turing', email: 'alan@example.com' },
        lineItems: [
          {
            productName: 'Noise-cancelling headphones',
            quantity: 1,
            unitPriceCents: 34900,
          },
        ],
      },
    ];

    const inProgress = [
      {
        employeeId: 'emp-001',
        input: {
          customer: {
            name: 'Margaret Hamilton',
            email: 'margaret@example.com',
          },
          lineItems: [
            {
              productName: 'Washing machine',
              quantity: 1,
              unitPriceCents: 79900,
            },
          ],
        },
      },
      {
        employeeId: 'emp-002',
        input: {
          customer: { name: 'Linus Torvalds', email: 'linus@example.com' },
          lineItems: [
            {
              productName: 'Laptop',
              quantity: 1,
              unitPriceCents: 149900,
            },
            {
              productName: 'Wireless mouse',
              quantity: 1,
              unitPriceCents: 4900,
            },
          ],
        },
      },
    ];

    const complete = [
      {
        employeeId: 'emp-003',
        input: {
          customer: {
            name: 'Katherine Johnson',
            email: 'katherine@example.com',
          },
          lineItems: [
            { productName: 'Smartphone', quantity: 1, unitPriceCents: 89900 },
          ],
        },
      },
    ];

    for (const input of open) {
      await orders.createOrder(input);
    }
    for (const { employeeId, input } of inProgress) {
      const order = await orders.createOrder(input);
      await orders.startOrder(order._id.toString(), employeeId);
    }
    for (const { employeeId, input } of complete) {
      const order = await orders.createOrder(input);
      await orders.startOrder(order._id.toString(), employeeId);
      await orders.completeOrder(order._id.toString());
    }

    console.log(
      `Seeded ${open.length} OPEN, ${inProgress.length} IN_PROGRESS and ${complete.length} COMPLETE order(s)`,
    );
  } finally {
    await app.close();
  }
}

seedDemo().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
