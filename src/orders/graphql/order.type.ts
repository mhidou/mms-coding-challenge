import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { OrderState } from '../domain/order-state';

registerEnumType(OrderState, {
  name: 'OrderState',
  description:
    'Order lifecycle. Transitions are strict: OPEN -> IN_PROGRESS -> COMPLETE.',
});

@ObjectType('Customer')
export class CustomerType {
  @Field()
  name: string;

  @Field()
  email: string;
}

@ObjectType('LineItem')
export class LineItemType {
  @Field()
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int, { description: 'Unit price in euro cents.' })
  unitPriceCents: number;
}

@ObjectType('Order')
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field(() => OrderState)
  state: OrderState;

  @Field(() => ID, {
    nullable: true,
    description: 'Employee working on the order; assigned when it starts.',
  })
  assignedEmployeeId: string | null;

  @Field(() => CustomerType)
  customer: CustomerType;

  @Field(() => [LineItemType])
  lineItems: LineItemType[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType('OrderPage')
export class OrderPageType {
  @Field(() => [OrderType])
  items: OrderType[];

  @Field(() => Int, {
    description: 'Total number of orders matching the filter.',
  })
  totalCount: number;
}
