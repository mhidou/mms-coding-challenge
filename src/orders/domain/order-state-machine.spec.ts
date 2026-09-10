import { EmployeeRequiredError, InvalidTransitionError } from './errors';
import { OrderState } from './order-state';
import {
  assertValidTransition,
  canTransition,
  requiredCurrentState,
} from './order-state-machine';

const { OPEN, IN_PROGRESS, COMPLETE } = OrderState;

describe('canTransition', () => {
  // Full transition matrix: only the two forward steps are allowed.
  it.each([
    [OPEN, OPEN, false],
    [OPEN, IN_PROGRESS, true],
    [OPEN, COMPLETE, false], // skipping
    [IN_PROGRESS, OPEN, false], // reverting
    [IN_PROGRESS, IN_PROGRESS, false],
    [IN_PROGRESS, COMPLETE, true],
    [COMPLETE, OPEN, false], // reverting from terminal state
    [COMPLETE, IN_PROGRESS, false],
    [COMPLETE, COMPLETE, false],
  ])('%s -> %s is %s', (from, to, allowed) => {
    expect(canTransition(from, to)).toBe(allowed);
  });
});

describe('assertValidTransition', () => {
  it('allows OPEN -> IN_PROGRESS when an employee is assigned', () => {
    expect(() =>
      assertValidTransition({
        from: OPEN,
        to: IN_PROGRESS,
        hasAssignedEmployee: true,
      }),
    ).not.toThrow();
  });

  it('allows IN_PROGRESS -> COMPLETE', () => {
    expect(() =>
      assertValidTransition({
        from: IN_PROGRESS,
        to: COMPLETE,
        hasAssignedEmployee: true,
      }),
    ).not.toThrow();
  });

  it('rejects OPEN -> IN_PROGRESS without an assigned employee', () => {
    expect(() =>
      assertValidTransition({
        from: OPEN,
        to: IN_PROGRESS,
        hasAssignedEmployee: false,
      }),
    ).toThrow(EmployeeRequiredError);
  });

  it.each([
    ['skipping a state', OPEN, COMPLETE],
    ['reverting', IN_PROGRESS, OPEN],
    ['leaving the terminal state', COMPLETE, IN_PROGRESS],
    ['re-entering the current state', OPEN, OPEN],
  ])('rejects %s (%s -> %s)', (_label, from, to) => {
    expect(() =>
      assertValidTransition({ from, to, hasAssignedEmployee: true }),
    ).toThrow(InvalidTransitionError);
  });

  it('reports machine-readable codes and the offending states', () => {
    try {
      assertValidTransition({
        from: COMPLETE,
        to: OPEN,
        hasAssignedEmployee: true,
      });
      fail('expected an InvalidTransitionError');
    } catch (error) {
      const transitionError = error as InvalidTransitionError;
      expect(transitionError.code).toBe('INVALID_TRANSITION');
      expect(transitionError.message).toContain('COMPLETE');
      expect(transitionError.message).toContain('OPEN');
    }

    try {
      assertValidTransition({
        from: OPEN,
        to: IN_PROGRESS,
        hasAssignedEmployee: false,
      });
      fail('expected an EmployeeRequiredError');
    } catch (error) {
      expect((error as EmployeeRequiredError).code).toBe('EMPLOYEE_REQUIRED');
    }
  });
});

describe('requiredCurrentState', () => {
  // Used by the service layer to build atomic conditional updates:
  // the filter { _id, state: requiredCurrentState(target) } guarantees
  // no concurrent transition can succeed twice.
  it('returns the only state allowed to move into the target', () => {
    expect(requiredCurrentState(IN_PROGRESS)).toBe(OPEN);
    expect(requiredCurrentState(COMPLETE)).toBe(IN_PROGRESS);
  });

  it('returns undefined for the initial state (nothing transitions into it)', () => {
    expect(requiredCurrentState(OPEN)).toBeUndefined();
  });
});
