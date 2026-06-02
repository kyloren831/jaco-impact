import { StateMachine } from '../shared/state-machine';
import { AssignmentStatus } from '../../generated/prisma/enums';

const assignmentTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
  [AssignmentStatus.PENDING_ACCEPTANCE]: [
    AssignmentStatus.ACCEPTED,
    AssignmentStatus.DECLINED,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.ACCEPTED]: [
    AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.DECLINED]: [],
  [AssignmentStatus.IN_PROGRESS]: [
    AssignmentStatus.SUBMITTED,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.SUBMITTED]: [
    AssignmentStatus.UNDER_REVIEW,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.UNDER_REVIEW]: [
    AssignmentStatus.REVISION_REQUESTED,
    AssignmentStatus.APPROVED,
    AssignmentStatus.REJECTED
  ],
  [AssignmentStatus.REVISION_REQUESTED]: [
    AssignmentStatus.IN_PROGRESS,
    AssignmentStatus.SUBMITTED,
    AssignmentStatus.CANCELLED
  ],
  [AssignmentStatus.APPROVED]: [],
  [AssignmentStatus.REJECTED]: [],
  [AssignmentStatus.CANCELLED]: []
};

export const assignmentStateMachine = new StateMachine<AssignmentStatus>(
  'TaskAssignment',
  assignmentTransitions
);
