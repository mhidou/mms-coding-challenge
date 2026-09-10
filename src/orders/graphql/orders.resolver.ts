import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { OrdersService } from '../orders.service';
import { toOrderType } from './order.mapper';
import { CreateOrderInput, ListOrdersArgs } from './order.inputs';
import { OrderPageType, OrderType } from './order.type';

/** Thin GraphQL adapter: translates the schema to service calls, nothing more. */
@Resolver(() => OrderType)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => OrderType, { description: 'A single order by id.' })
  async order(@Args('id', { type: () => ID }) id: string): Promise<OrderType> {
    return toOrderType(await this.ordersService.getOrder(id));
  }

  @Query(() => OrderPageType, {
    description: 'Orders sorted by creation date (newest first).',
  })
  async orders(@Args() args: ListOrdersArgs): Promise<OrderPageType> {
    const { state, skip, limit } = args;
    const [items, totalCount] = await Promise.all([
      this.ordersService.listOrders({ state, skip, limit }),
      this.ordersService.countOrders(state),
    ]);
    return { items: items.map(toOrderType), totalCount };
  }

  @Mutation(() => OrderType, { description: 'Creates an order in OPEN state.' })
  async createOrder(
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderType> {
    return toOrderType(await this.ordersService.createOrder(input));
  }

  @Mutation(() => OrderType, {
    description:
      'Moves an OPEN order to IN_PROGRESS, assigning the employee working on it.',
  })
  async startOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<OrderType> {
    return toOrderType(
      await this.ordersService.startOrder(orderId, employeeId),
    );
  }

  @Mutation(() => OrderType, {
    description: 'Moves an IN_PROGRESS order to COMPLETE.',
  })
  async completeOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
  ): Promise<OrderType> {
    return toOrderType(await this.ordersService.completeOrder(orderId));
  }
}
