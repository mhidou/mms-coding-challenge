import { type Employee } from './persistence/employee.schema';

/** Store employees available for order assignment, seeded at startup. */
export const SEED_EMPLOYEES: Employee[] = [
  { _id: 'emp-001', name: 'Alice Johnson' },
  { _id: 'emp-002', name: 'Bob Martin' },
  { _id: 'emp-003', name: 'Carla Diaz' },
  { _id: 'emp-004', name: 'David Kim' },
];
