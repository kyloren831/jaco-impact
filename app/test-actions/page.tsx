"use client";
import {
  registerToEventAction,
  getVolunteerTasksAction,
  acceptAssignmentAction,
  declineAssignmentAction,
  startAssignmentAction,
  submitAssignmentAction,
  addTaskCommentAction,
  getTaskCommentsAction
} from "@/features/volunteer/actions";

import {
  submitEvidenceAction,
  reviewEvidenceAction,
  getPresignedUploadUrlAction
} from "@/features/evidences/actions";

import {
  createEvent,
  cancelEventAction,
  updateEventStatusAction,
  updateEventDetailsAction,
  getEventsByProject,
  getAllEvents,
  getEventDetail
} from "@/features/events/actions";

import {
  createTaskAction,
  assignVolunteerAction,
  removeVolunteerAction,
  getTasksByEvent,
  updateTaskStatusAction,
  updateTaskDetailsAction,
  getAllVolunteersAction
} from "@/features/tasks/actions";

import { getActivityLogs } from "@/features/audit/actions";

export default function TestActionsPage() {
  const actions = {
    registerToEventAction,
    getVolunteerTasksAction,
    acceptAssignmentAction,
    declineAssignmentAction,
    startAssignmentAction,
    submitAssignmentAction,
    addTaskCommentAction,
    getTaskCommentsAction,
    submitEvidenceAction,
    reviewEvidenceAction,
    getPresignedUploadUrlAction,
    createEvent,
    cancelEventAction,
    updateEventStatusAction,
    updateEventDetailsAction,
    getEventsByProject,
    getAllEvents,
    getEventDetail,
    createTaskAction,
    assignVolunteerAction,
    removeVolunteerAction,
    getTasksByEvent,
    updateTaskStatusAction,
    updateTaskDetailsAction,
    getAllVolunteersAction,
    getActivityLogs
  };

  return (
    <div>
      <h1>Test Actions Compiler</h1>
      <pre>{JSON.stringify(Object.keys(actions), null, 2)}</pre>
    </div>
  );
}