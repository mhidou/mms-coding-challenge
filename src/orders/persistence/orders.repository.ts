import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';

import { type OrderState } from '../domain/order-state';
import {
  type Customer,
  type LineItem,
  Order,
  type OrderDocument,
} from './order.schema';

export interface CreateOrderData {
  customer: Customer;
  lineItems: LineItem[];
}

export interface ListOrdersOptions {
  state?: OrderState;
  skip: number;
  limit: number;
}

export interface TransitionData {
  orderId: string;
  fromState: OrderState;
  toState: OrderState;
  assignedEmployeeId?: string;
}

/**
 * Persistence gateway for orders. Contains no business rules —
 * transition legality is decided by the domain layer.
 */
@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async create(data: CreateOrderData): Promise<OrderDocument> {
    return this.orderModel.create(data);
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    if (!isValidObjectId(orderId)) {
      return null;
    }
    return this.orderModel.findById(orderId).exec();
  }

  async findAll({
    state,
    skip,
    limit,
  }: ListOrdersOptions): Promise<OrderDocument[]> {
    return this.orderModel
      .find(state ? { state } : {})
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async count(state?: OrderState): Promise<number> {
    return this.orderModel.countDocuments(state ? { state } : {}).exec();
  }

  /**
   * Atomic conditional transition: the document is updated only if it is
   * still in `fromState`. Under concurrent requests at most one caller
   * wins; the others get `null` back. This is the concurrency guard —
   * never replace it with a read-then-write.
   */
  async transition({
    orderId,
    fromState,
    toState,
    assignedEmployeeId,
  }: TransitionData): Promise<OrderDocument | null> {
    if (!isValidObjectId(orderId)) {
      return null;
    }
    return this.orderModel
      .findOneAndUpdate(
        { _id: orderId, state: fromState },
        {
          $set: {
            state: toState,
            ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
          },
        },
        { new: true },
      )
      .exec();
  }
}
