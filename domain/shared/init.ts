import { initializeAuditListeners } from '../audit/service';
import { registerNotificationHandlers } from '../notifications/events';
import { registerEmailHandlers } from '../emails/events';
import { sendEmail } from '@/infrastructure/emails/resend';

let isInitialized = false;

export function initializeDomainEvents() {
  if (isInitialized) return;
  isInitialized = true;
  
  initializeAuditListeners();
  registerNotificationHandlers();
  registerEmailHandlers(sendEmail);
}
