import { initializeAuditListeners } from '../audit/service';
import { registerNotificationHandlers } from '../notifications/events';

let isInitialized = false;

export function initializeDomainEvents() {
  if (isInitialized) return;
  isInitialized = true;
  
  initializeAuditListeners();
  registerNotificationHandlers();
}
