import { type OrderState } from './order-state';

/**
 * Base class for business-rule violations. `code` is machine-readable and
 * is surfaced to API clients in GraphQL error extensions.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
}

export class InvalidTransitionError extends DomainError {
  readonly code = 'INVALID_TRANSITION';

  constructor(
    readonly from: OrderState,
    readonly to: OrderState,
  ) {
    super(
      `Order cannot transition from ${from} to ${to}: ` +
        'transitions must follow OPEN -> IN_PROGRESS -> COMPLETE without skipping or reverting',
    );
    this.name = 'InvalidTransitionError';
  }
}

export class EmployeeRequiredError extends DomainError {
  readonly code = 'EMPLOYEE_REQUIRED';

  constructor() {
    super('An assigned employee is required to move an order to IN_PROGRESS');
    this.name = 'EmployeeRequiredError';
  }
}

export class OrderNotFoundError extends DomainError {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(readonly orderId: string) {
    super(`Order ${orderId} was not found`);
    this.name = 'OrderNotFoundError';
  }
}
