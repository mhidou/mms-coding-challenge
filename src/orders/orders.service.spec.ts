import {
  EmployeeRequiredError,
  InvalidTransitionError,
  OrderNotFoundError,
} from './domain/errors';
import { OrderState } from './domain/order-state';
import { OrdersService } from './orders.service';
import { type OrderDocument } from './persistence/order.schema';
import { type OrdersRepository } from './persistence/orders.repository';

const ORDER_ID = '65f0c6a2e4b0a1b2c3d4e5f6';
const EMPLOYEE_ID = 'emp-001';

function orderDoc(state: OrderState): OrderDocument {
  return { id: ORDER_ID, state } as OrderDocument;
}

describe('OrdersService', () => {
  const create = jest.fn();
  const findById = jest.fn();
  const findAll = jest.fn();
  const count = jest.fn();
  const transition = jest.fn();
  let service: OrdersService;

  beforeEach(() => {
    jest.resetAllMocks();
    const repository = {
      create,
      findById,
      findAll,
      count,
      transition,
    } as unknown as OrdersRepository;
    service = new OrdersService(repository);
  });

  describe('createOrder', () => {
    it('persists a new order', async () => {
      const data = {
        customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
        lineItems: [
          { productName: 'Laptop', quantity: 1, unitPriceCents: 99900 },
        ],
      };
      create.mockResolvedValue(orderDoc(OrderState.OPEN));

      await expect(service.createOrder(data)).resolves.toMatchObject({
        state: OrderState.OPEN,
      });
      expect(create).toHaveBeenCalledWith(data);
    });
  });

  describe('getOrder', () => {
    it('returns the order when it exists', async () => {
      findById.mockResolvedValue(orderDoc(OrderState.OPEN));

      await expect(service.getOrder(ORDER_ID)).resolves.toMatchObject({
        id: ORDER_ID,
      });
    });

    it('throws ORDER_NOT_FOUND for an unknown id', async () => {
      findById.mockResolvedValue(null);

      await expect(service.getOrder('unknown')).rejects.toThrow(
        OrderNotFoundError,
      );
    });
  });

  describe('startOrder', () => {
    it('atomically moves an OPEN order to IN_PROGRESS with the employee', async () => {
      transition.mockResolvedValue(orderDoc(OrderState.IN_PROGRESS));

      const result = await service.startOrder(ORDER_ID, EMPLOYEE_ID);

      expect(result.state).toBe(OrderState.IN_PROGRESS);
      expect(transition).toHaveBeenCalledWith({
        orderId: ORDER_ID,
        fromState: OrderState.OPEN,
        toState: OrderState.IN_PROGRESS,
        assignedEmployeeId: EMPLOYEE_ID,
      });
    });

    it('persists the trimmed employee id, not the raw input', async () => {
      transition.mockResolvedValue(orderDoc(OrderState.IN_PROGRESS));

      await service.startOrder(ORDER_ID, `  ${EMPLOYEE_ID}  `);

      expect(transition).toHaveBeenCalledWith(
        expect.objectContaining({ assignedEmployeeId: EMPLOYEE_ID }),
      );
    });

    it('rejects a blank employee id without touching the database', async () => {
      await expect(service.startOrder(ORDER_ID, '   ')).rejects.toThrow(
        EmployeeRequiredError,
      );
      expect(transition).not.toHaveBeenCalled();
    });

    it('throws ORDER_NOT_FOUND when the order does not exist', async () => {
      transition.mockResolvedValue(null);
      findById.mockResolvedValue(null);

      await expect(service.startOrder(ORDER_ID, EMPLOYEE_ID)).rejects.toThrow(
        OrderNotFoundError,
      );
    });

    it('throws INVALID_TRANSITION when the order was already started', async () => {
      transition.mockResolvedValue(null);
      findById.mockResolvedValue(orderDoc(OrderState.IN_PROGRESS));

      await expect(service.startOrder(ORDER_ID, EMPLOYEE_ID)).rejects.toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe('completeOrder', () => {
    it('atomically moves an IN_PROGRESS order to COMPLETE', async () => {
      transition.mockResolvedValue(orderDoc(OrderState.COMPLETE));

      const result = await service.completeOrder(ORDER_ID);

      expect(result.state).toBe(OrderState.COMPLETE);
      expect(transition).toHaveBeenCalledWith({
        orderId: ORDER_ID,
        fromState: OrderState.IN_PROGRESS,
        toState: OrderState.COMPLETE,
      });
    });

    it('throws INVALID_TRANSITION when completing an OPEN order (skipping)', async () => {
      transition.mockResolvedValue(null);
      findById.mockResolvedValue(orderDoc(OrderState.OPEN));

      await expect(service.completeOrder(ORDER_ID)).rejects.toThrow(
        InvalidTransitionError,
      );
    });

    it('throws INVALID_TRANSITION when the order is already COMPLETE', async () => {
      transition.mockResolvedValue(null);
      findById.mockResolvedValue(orderDoc(OrderState.COMPLETE));

      await expect(service.completeOrder(ORDER_ID)).rejects.toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe('listOrders', () => {
    it('forwards state filter and pagination to the repository', async () => {
      findAll.mockResolvedValue([orderDoc(OrderState.OPEN)]);

      await service.listOrders({ state: OrderState.OPEN, skip: 10, limit: 5 });

      expect(findAll).toHaveBeenCalledWith({
        state: OrderState.OPEN,
        skip: 10,
        limit: 5,
      });
    });
  });
});
