import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS, UserRegisteredPayload, AssignmentStatusChangedPayload, EventStatusChangedPayload, TaskAssignedPayload } from '../shared/events';
import { sendEmail } from '@/infrastructure/emails/resend';
import { prisma } from '@/lib/prisma';
import { AssignmentStatus, EventStatus } from '@/generated/prisma/client';

export function registerEmailHandlers() {
  
  // 1. User registration successful -> notify user & director
  domainEventBus.on(DOMAIN_EVENTS.USER_REGISTERED, async (event) => {
    const payload = event.payload as UserRegisteredPayload;
    
    // Notify User
    await sendEmail({
      to: payload.email,
      subject: '¡Registro Exitoso en Jacó Impact!',
      html: `
        <h1>¡Bienvenido a Jacó Impact, ${payload.name}!</h1>
        <p>Tu registro ha sido exitoso. Ya puedes iniciar sesión y completar tu perfil para empezar a participar en nuestros eventos y tareas.</p>
        <p>Gracias por unirte a nuestra comunidad.</p>
      `
    });

    // Notify Directors (ADMIN / COORDINATOR)
    const directors = await prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: {
          some: {
            role: { in: ['ADMIN', 'COORDINATOR'] }
          }
        }
      },
      select: { email: true }
    });

    const directorEmails = directors.map(d => d.email).filter(Boolean) as string[];
    
    if (directorEmails.length > 0) {
      await sendEmail({
        to: directorEmails,
        subject: 'Nuevo voluntario registrado',
        html: `
          <h2>Nuevo voluntario registrado</h2>
          <p>Se ha registrado un nuevo usuario en la plataforma:</p>
          <ul>
            <li><strong>Nombre:</strong> ${payload.name}</li>
            <li><strong>Email:</strong> ${payload.email}</li>
            <li><strong>Rol:</strong> ${payload.role}</li>
          </ul>
          <p>Revisa el panel de administración para gestionar al nuevo voluntario.</p>
        `
      });
    }
  });

  // 2. Volunteer resigns from task -> notify director
  domainEventBus.on(DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED, async (event) => {
    const payload = event.payload as AssignmentStatusChangedPayload;
    
    if (payload.newStatus === AssignmentStatus.DECLINED || payload.newStatus === AssignmentStatus.CANCELLED) {
      const task = await prisma.task.findUnique({
        where: { id: payload.taskId },
        include: { event: true }
      });
      
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: payload.volunteerId },
        include: { user: true }
      });

      if (task && volunteer && volunteer.user) {
        // Fetch event coordinator or all directors
        const directors = await prisma.user.findMany({
          where: {
            isActive: true,
            userRoles: {
              some: { role: { in: ['ADMIN', 'COORDINATOR'] } }
            }
          },
          select: { email: true }
        });
        const directorEmails = directors.map(d => d.email).filter(Boolean) as string[];
        
        if (directorEmails.length > 0) {
          await sendEmail({
            to: directorEmails,
            subject: 'Alerta: Voluntario renunció a una tarea',
            html: `
              <h2 style="color: #e53e3e;">Voluntario retirado de tarea</h2>
              <p>El voluntario <strong>${volunteer.user.name}</strong> ha declinado o cancelado su participación en una tarea.</p>
              <ul>
                <li><strong>Tarea:</strong> ${task.title}</li>
                <li><strong>Evento:</strong> ${task.event.name}</li>
                <li><strong>Motivo (si aplica):</strong> ${payload.reason || 'No especificado'}</li>
              </ul>
              <p>Por favor, ingresa a la plataforma para delegar esta tarea a otro voluntario en el menor tiempo posible.</p>
            `
          });
        }
      }
    }
  });

  // 3. New event availability -> notify volunteers
  domainEventBus.on(DOMAIN_EVENTS.EVENT_STATUS_CHANGED, async (event) => {
    const payload = event.payload as EventStatusChangedPayload;
    
    if (payload.newStatus === EventStatus.OPEN && payload.previousStatus !== EventStatus.OPEN) {
      const eventDetails = await prisma.event.findUnique({
        where: { id: payload.eventId },
        include: { project: true }
      });

      if (eventDetails) {
        const volunteers = await prisma.user.findMany({
          where: {
            isActive: true,
            userRoles: { some: { role: 'VOLUNTEER' } }
          },
          select: { email: true, name: true }
        });
        const volunteerEmails = volunteers.map(v => v.email).filter(Boolean) as string[];

        if (volunteerEmails.length > 0) {
          await sendEmail({
            to: volunteerEmails,
            subject: '¡Nuevo Evento Disponible en Jacó Impact!',
            html: `
              <h2>¡Tenemos un nuevo evento disponible!</h2>
              <p>El evento <strong>${eventDetails.name}</strong> del proyecto <strong>${eventDetails.project.name}</strong> acaba de abrir sus inscripciones.</p>
              <p><strong>Fecha:</strong> ${new Date(eventDetails.eventDate).toLocaleDateString()}</p>
              <p><strong>Ubicación:</strong> ${eventDetails.location || 'Por definir'}</p>
              <p>Ingresa al portal de voluntarios para inscribirte y ser parte del cambio.</p>
            `
          });
        }
      }
    }
  });

  // 4. Task assigned -> notify volunteer
  domainEventBus.on(DOMAIN_EVENTS.TASK_ASSIGNED, async (event) => {
    const payload = event.payload as TaskAssignedPayload;
    
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: payload.volunteerId },
      include: { user: true }
    });

    if (volunteer && volunteer.user.email) {
      await sendEmail({
        to: volunteer.user.email,
        subject: 'Nueva Tarea Asignada - Jacó Impact',
        html: `
          <h2>¡Te han asignado una nueva tarea!</h2>
          <p>Hola ${volunteer.user.name}, se te ha asignado la siguiente tarea:</p>
          <ul>
            <li><strong>Evento:</strong> ${payload.eventName}</li>
            <li><strong>Tarea:</strong> ${payload.taskTitle}</li>
          </ul>
          <p>Por favor, ingresa a tu panel de voluntario para revisar los detalles y confirmar tu participación.</p>
        `
      });
    }
  });

}
