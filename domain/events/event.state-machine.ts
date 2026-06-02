import { EventStatus } from '../../generated/prisma/enums';
import { StateMachine } from '../shared/state-machine';

const transitions: Record<EventStatus, EventStatus[]> = {
  [EventStatus.PLANNED]: [EventStatus.OPEN, EventStatus.CANCELLED],
  [EventStatus.OPEN]: [EventStatus.CLOSED, EventStatus.CANCELLED],
  [EventStatus.CLOSED]: [EventStatus.COMPLETED],
  [EventStatus.COMPLETED]: [],
  [EventStatus.CANCELLED]: [],
};

export const eventStateMachine = new StateMachine<EventStatus>('Event', transitions);
