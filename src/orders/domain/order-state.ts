/** Lifecycle states of an order. The sequence is strict: OPEN -> IN_PROGRESS -> COMPLETE. */
export enum OrderState {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
}
