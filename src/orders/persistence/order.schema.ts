import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

import { OrderState } from '../domain/order-state';

@Schema({ _id: false })
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;
}

const CustomerSchema = SchemaFactory.createForClass(Customer);

@Schema({ _id: false })
export class LineItem {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  /** Unit price in euro cents — integers avoid floating-point money bugs. */
  @Prop({ required: true, min: 0 })
  unitPriceCents: number;
}

const LineItemSchema = SchemaFactory.createForClass(LineItem);

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({
    type: String,
    enum: Object.values(OrderState),
    default: OrderState.OPEN,
    index: true,
  })
  state: OrderState;

  /** Employee working on the order; required from IN_PROGRESS on. */
  @Prop({ type: String, default: null })
  assignedEmployeeId: string | null;

  @Prop({ type: CustomerSchema, required: true })
  customer: Customer;

  @Prop({ type: [LineItemSchema], required: true })
  lineItems: LineItem[];

  /** Managed by Mongoose through the `timestamps` schema option. */
  createdAt: Date;

  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;

export const OrderSchema = SchemaFactory.createForClass(Order);
