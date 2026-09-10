import { EmployeeRequiredError, InvalidTransitionError } from './errors';
import { OrderState } from './order-state';

/**
 * The single source of truth for the order lifecycle:
 * OPEN -> IN_PROGRESS -> COMPLETE, no skipping, no reverting.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<OrderState, readonly OrderState[]>> =
  {
    [OrderState.OPEN]: [OrderState.IN_PROGRESS],
    [OrderState.IN_PROGRESS]: [OrderState.COMPLETE],
    [OrderState.COMPLETE]: [],
  };

export function canTransition(from: OrderState, to: OrderState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface TransitionRequest {
  from: OrderState;
  to: OrderState;
  hasAssignedEmployee: boolean;
}

/**
 * Enforces every transition rule; throws a typed {@link DomainError}
 * when the request violates one of them.
 */
export function assertValidTransition({
  from,
  to,
  hasAssignedEmployee,
}: TransitionRequest): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
  if (to === OrderState.IN_PROGRESS && !hasAssignedEmployee) {
    throw new EmployeeRequiredError();
  }
}

/**
 * The only state an order may be in right before reaching `to`.
 * The service layer uses it to build atomic conditional updates
 * ({ _id, state: requiredCurrentState(to) }), making transitions
 * race-free under concurrent requests.
 */
export function requiredCurrentState(to: OrderState): OrderState | undefined {
  return Object.values(OrderState).find((state) => canTransition(state, to));
}
