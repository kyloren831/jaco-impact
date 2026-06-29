import { AssignmentStatus, EventStatus, FileType, NotificationType } from '../../generated/prisma/enums';

// ── Event Payloads ──
export type TaskAssignedPayload = {
  taskId: number;
  volunteerId: number;
  eventId: number;
  assignedBy: number;
  taskTitle: string;
  eventName: string;
};

export type AssignmentStatusChangedPayload = {
  taskId: number;
  volunteerId: number;
  eventId: number;
  previousStatus: AssignmentStatus;
  newStatus: AssignmentStatus;
  actorId: number;
  reason?: string;
};

export type EvidenceSubmittedPayload = {
  evidenceId: number;
  taskId: number;
  volunteerId: number;
  eventId: number;
  fileType: FileType;
};

export type EvidenceReviewedPayload = {
  evidenceId: number;
  taskId: number;
  volunteerId: number;
  eventId: number;
  decision: 'APPROVED' | 'REJECTED';
  reviewedBy: number;
  reviewNote?: string;
};

export type EventStatusChangedPayload = {
  eventId: number;
  previousStatus: EventStatus;
  newStatus: EventStatus;
  actorId: number;
};

export type VolunteerRegisteredPayload = {
  eventId: number;
  volunteerId: number;
  eventName: string;
  volunteerName: string;
};

export type NotificationCreatedPayload = {
  notificationId: number;
  recipientId: number;
  type: NotificationType;
  title: string;
};

export type UserRegisteredPayload = {
  userId: number;
  email: string;
  name: string;
  role: string;
};

export type TaskCommentPayload = {
  taskId: number;
  commentId: number;
  authorId: number;
  content: string;
  createdAt: Date;
  authorName: string;
  eventId: number;
};

// ── Event Type Registry ──
export const DOMAIN_EVENTS = {
  // Comment domain
  TASK_COMMENT: 'TASK_COMMENT',

  // Events domain
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_STATUS_CHANGED: 'EVENT_STATUS_CHANGED',
  EVENT_CANCELLED: 'EVENT_CANCELLED',
  EVENT_UPDATED: 'EVENT_UPDATED',

  // Users domain
  USER_REGISTERED: 'USER_REGISTERED',

  // Participation domain
  VOLUNTEER_REGISTERED: 'VOLUNTEER_REGISTERED',
  VOLUNTEER_UNREGISTERED: 'VOLUNTEER_UNREGISTERED',
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',

  // Assignment domain
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
  ASSIGNMENT_DECLINED: 'ASSIGNMENT_DECLINED',
  ASSIGNMENT_STARTED: 'ASSIGNMENT_STARTED',
  ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_APPROVED: 'ASSIGNMENT_APPROVED',
  ASSIGNMENT_REVISION_REQUESTED: 'ASSIGNMENT_REVISION_REQUESTED',
  ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
  TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
  ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',

  // Evidence domain
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  EVIDENCE_APPROVED: 'EVIDENCE_APPROVED',
  EVIDENCE_REJECTED: 'EVIDENCE_REJECTED',

  // Notification domain
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_BATCH_CREATED: 'NOTIFICATION_BATCH_CREATED',
} as const;
