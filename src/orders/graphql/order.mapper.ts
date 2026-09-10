import { type OrderDocument } from '../persistence/order.schema';
import { type OrderType } from './order.type';

/** Maps a Mongoose document to the GraphQL type, hiding persistence details. */
export function toOrderType(order: OrderDocument): OrderType {
  return {
    id: order._id.toString(),
    state: order.state,
    assignedEmployeeId: order.assignedEmployeeId,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
    },
    lineItems: order.lineItems.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
