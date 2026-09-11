import { Injectable } from '@nestjs/common';

import {
  EmployeeRequiredError,
  InvalidTransitionError,
  OrderNotFoundError,
} from './domain/errors';
import { OrderState } from './domain/order-state';
import {
  assertValidTransition,
  requiredCurrentState,
} from './domain/order-state-machine';
import { type OrderDocument } from './persistence/order.schema';
import {
  type CreateOrderData,
  type ListOrdersOptions,
  OrdersRepository,
} from './persistence/orders.repository';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) { }

  async createOrder(data: CreateOrderData): Promise<OrderDocument> {
    return this.ordersRepository.create(data);
  }

  async getOrder(orderId: string): Promise<OrderDocument> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  async listOrders(options: ListOrdersOptions): Promise<OrderDocument[]> {
    return this.ordersRepository.findAll(options);
  }

  async countOrders(state?: OrderState): Promise<number> {
    return this.ordersRepository.count(state);
  }

  async startOrder(
    orderId: string,
    employeeId: string,
  ): Promise<OrderDocument> {
    const normalisedEmployeeId = employeeId.trim();
    if (!normalisedEmployeeId) {
      throw new EmployeeRequiredError();
    }
    return this.transitionOrder(
      orderId,
      OrderState.IN_PROGRESS,
      normalisedEmployeeId,
    );
  }

  async completeOrder(orderId: string): Promise<OrderDocument> {
    return this.transitionOrder(orderId, OrderState.COMPLETE);
  }

  /**
   * Runs a transition as a single atomic conditional update. When the
   * update matches nothing, the order is re-read once to raise the most
   * accurate domain error (unknown order vs illegal current state).
   */
  private async transitionOrder(
    orderId: string,
    toState: OrderState,
    assignedEmployeeId?: string,
  ): Promise<OrderDocument> {
    const fromState = requiredCurrentState(toState);
    if (!fromState) {
      throw new InvalidTransitionError(toState, toState);
    }

    assertValidTransition({
      from: fromState,
      to: toState,
      hasAssignedEmployee:
        toState !== OrderState.IN_PROGRESS || Boolean(assignedEmployeeId),
    });

    const updated = await this.ordersRepository.transition({
      orderId,
      fromState,
      toState,
      ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
    });
    if (updated) {
      return updated;
    }

    const current = await this.ordersRepository.findById(orderId);
    if (!current) {
      throw new OrderNotFoundError(orderId);
    }
    throw new InvalidTransitionError(current.state, toState);
  }
}
