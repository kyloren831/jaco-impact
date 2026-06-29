import { initializeAuditListeners } from '../audit/service';
import { registerNotificationHandlers } from '../notifications/events';
import { registerEmailHandlers } from '../emails/events';

let isInitialized = false;

export function initializeDomainEvents() {
  if (isInitialized) return;
  isInitialized = true;
  
  initializeAuditListeners();
  registerNotificationHandlers();
  registerEmailHandlers();
}
