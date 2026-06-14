# Handoff: "Mis Tareas" Volunteer UX — Estado final y pasos pendientes

> **Para:** Siguiente agente que continúe la tarea
> **Proyecto:** `/home/aaron/Projects/jaco-impact`
> **Documentación técnica:** Ver `PROJECT.md` en la raíz del proyecto
> **Última actualización:** 2026-06-09 21:30 CST

---

## Contexto del Proyecto

Se está implementando el flujo "Mis Tareas" para voluntarios en la plataforma Jacó Impact (Next.js).

**Principio UX definido por el usuario:**
- El voluntario NO ve un Kanban del evento.
- El admin piensa: Evento → Tareas → Voluntarios.
- El voluntario piensa: Mis tareas → Trabajo → Entrega.
- Se utiliza `AssignmentStatus` (individual) desacoplado de `TaskStatus` (global).

---

## ✅ Lo que el equipo Teamwork YA implementó y verificó

Estos archivos fueron creados, revisados por agentes Challenger y Auditor, y pasaron verificación.

### Milestone 1 — Backend State Transitions & Comments (COMPLETO ✅)

| Archivo | Descripción |
|---|---|
| `domain/shared/events.ts` | Bus de eventos del dominio (EventEmitter) para SSE |
| `domain/assignments/service.ts` | Máquina de estados de `AssignmentStatus` con auto-transición atómica de `TaskStatus` a `IN_REVIEW` cuando todos los voluntarios activos hacen SUBMITTED |
| `domain/comments/service.ts` | CRUD de comentarios + emisión de evento `TASK_COMMENT` al bus |
| `domain/audit/service.ts` | Registro de actividad en `ActivityLog` por cada transición |
| `domain/evidences/service.ts` | Mapeo de tipos de evidencia (imagen, video, doc) e interfaces de revisión |
| `features/volunteer/actions.ts` | Server Actions: `acceptAssignmentAction`, `declineAssignmentAction`, `startAssignmentAction`, `submitAssignmentAction`, `addTaskCommentAction`, `getTaskCommentsAction`, `getVolunteerTasksAction` |

### Milestone 2 — S3/R2 Storage Presigned URLs (COMPLETO ✅)

| Archivo | Descripción |
|---|---|
| `lib/storage/r2.ts` | Wrapper del cliente S3 (AWS SDK) con `@aws-sdk/s3-request-presigner`, generación de nombres únicos y rutas de carpeta dinámicas. Expiración de 1 hora. |
| `features/evidences/actions.ts` | Server Action `getPresignedUploadUrlAction` + `submitEvidenceAction` con validación de rol |

### Milestone 3 — Real-Time SSE Integration (COMPLETO ✅)

| Archivo | Descripción |
|---|---|
| `app/api/realtime/route.ts` | Endpoint SSE que escucha el `domainEventBus` y hace streaming de eventos (`ASSIGNMENT_STATUS_CHANGED`, `TASK_COMMENT`) al cliente |
| `hooks/useRealtime.ts` | Hook `useRealtime(eventType, callback)` que conecta un `EventSource` al endpoint SSE |

### Milestone 4 — Frontend Volunteer UX Dashboard (COMPLETO ✅)

| Archivo | Descripción |
|---|---|
| `app/dashboard/volunteer/tasks/page.tsx` | Server Component con `requireRole(["VOLUNTEER"])`, lookup de voluntario, fetch de tareas, renderiza `VolunteerTasksDashboard` |
| `components/dashboard/VolunteerTasksDashboard.tsx` | Dashboard cliente con 4 tabs (Pendientes, En curso, En revisión, Completadas), `useOptimistic` para feedback instantáneo, grid de cards con prioridad y fecha |
| `components/dashboard/TaskDetailsDrawer.tsx` | Panel derecho usando `RightSidePanel` existente, contiene: info de tarea, badges de prioridad/estado, botones de transición según `AssignmentStatus`, dropzone de evidencias (drag & drop), hilo de comentarios chat-like con deduplicación optimista/SSE |

### Tests E2E (ESCRITOS ✅ — NO EJECUTADOS)

| Archivo | Descripción |
|---|---|
| `tests/e2e/specs/tier1.spec.ts` | Pruebas de transiciones básicas |
| `tests/e2e/specs/tier2.spec.ts` | Pruebas de comentarios y SSE |
| `tests/e2e/specs/tier3.spec.ts` | Pruebas de evidencias y auto-transición |
| `tests/e2e/specs/tier4.spec.ts` | Pruebas de edge cases y concurrencia |
| `tests/e2e/helpers/` | Helpers de auth, DB, SSE y runner |
| `tests/stress-concurrency.ts` | Test de estrés de concurrencia |
| `test-transitions.ts` | Test manual de transiciones de estado |

---

## 🚧 Pasos pendientes para el siguiente agente

### Paso 1 — Instalar dependencia faltante de S3

El único error real de TypeScript en código fuente:
```
lib/storage/r2.ts(3,30): error TS2307: Cannot find module '@aws-sdk/s3-request-presigner'
```

**Acción:** Ejecutar:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Paso 2 — Verificar el flujo de Login → Dashboard → Mis Tareas

La app usa autenticación propia (JWT custom, NO NextAuth). El flujo es:

1. **Login** (`app/login/page.tsx`): Formulario con email/password, llama a `loginAction` en `features/auth/actions.ts`.
2. `loginAction` valida credenciales con bcrypt, genera JWT (access + refresh), guarda sesión en DB, setea cookies HttpOnly, y hace `redirect("/dashboard")`.
3. **Dashboard Layout** (`app/dashboard/layout.tsx`): Llama `requireAuth()` — si falla, redirect a `/login`.
4. **Volunteer Layout** (`app/dashboard/volunteer/layout.tsx`): Verifica que el usuario tenga rol `VOLUNTEER`, `ADMIN` o `COORDINATOR`.
5. **Tasks Page** (`app/dashboard/volunteer/tasks/page.tsx`): Llama `requireRole(["VOLUNTEER"])` — más restrictivo, solo voluntarios pueden acceder.

**Puntos a verificar:**
- [ ] ¿El login funciona correctamente con `npm run dev`? ¿Redirige al dashboard?
- [ ] ¿Existe un usuario voluntario en la DB para probar? Si no, crear uno con seed o registro.
- [ ] ¿La ruta `/dashboard/volunteer/tasks` es accesible tras login como voluntario?
- [ ] ¿El sidebar del dashboard tiene un enlace a "Mis Tareas" para voluntarios? (verificar `components/layout/DashboardSidebar.tsx`)
- [ ] ¿El guard `requireRole(["VOLUNTEER"])` en `tasks/page.tsx` es correcto? Admins y coordinadores quedarían bloqueados. Evaluar si deberían poder ver esta vista también.

### Paso 3 — Corregir errores de TypeScript en tests

Hay **30 errores de TS** pero todos están en archivos de test (`tests/` y `test-transitions.ts`), NO en código fuente. Los errores son campos faltantes en los mocks de Prisma (ej: `visibility`, `priority`, `isActive`, `iconUrl`, `eventDate`).

**Acción:** Actualizar los objetos de mock en los tests para incluir todos los campos requeridos por el schema de Prisma.

### Paso 4 — Configurar variables de entorno S3

Añadir a `.env.local` y documentar en `.env.example`:
```env
S3_ENDPOINT=https://your-minio-or-r2-endpoint
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=jaco-impact-evidences
S3_REGION=auto
```

### Paso 5 — Prueba visual end-to-end

1. `npm run dev`
2. Ir a `/login`, iniciar sesión como voluntario
3. Navegar a `/dashboard/volunteer/tasks`
4. Verificar las 4 tabs y que filtren correctamente
5. Abrir el drawer de una tarea y probar Accept/Decline
6. Probar el dropzone de evidencias
7. Probar el chat de comentarios

---

## Arquitectura de autenticación (referencia rápida)

```
Login Form → loginAction (Server Action)
  → bcrypt.compare → JWT sign → createSession (DB)
  → setAuthCookies (HttpOnly) → redirect("/dashboard")

Dashboard Layout → requireAuth() → verifyToken(cookie)
  → Si falla: redirect("/login")
  → Si ok: renderiza con session

Volunteer Tasks → requireRole(["VOLUNTEER"])
  → Si no tiene rol: throw AuthError("FORBIDDEN")
```

Archivos clave de auth:
- `features/auth/actions.ts` — loginAction
- `lib/auth/guards.ts` — requireAuth, requireRole, requireOwnership
- `lib/auth/jwt.ts` — signAccessToken, verifyToken
- `lib/auth/cookies.ts` — setAuthCookies, getAccessTokenFromCookies
- `lib/auth/session.ts` — createSession, findValidSession

---

## Comandos útiles

```bash
# Verificar TypeScript (esperar 1 error en source + ~30 en tests)
npx tsc --noEmit

# Solo errores de source (excluir tests)
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "^tests/" | grep -v "^test-"

# Dev server
npm run dev

# Prisma
npx prisma db push
npx prisma studio
```

---

## Archivos que NO debe tocar el siguiente agente (ya verificados)

Estos archivos fueron revisados por Challenger + Auditor y están estables:
- `domain/assignments/service.ts`
- `domain/comments/service.ts`
- `domain/audit/service.ts`
- `domain/shared/events.ts`
- `features/volunteer/actions.ts`
- `app/api/realtime/route.ts`
- `hooks/useRealtime.ts`
- `components/dashboard/VolunteerTasksDashboard.tsx`
- `components/dashboard/TaskDetailsDrawer.tsx`

Solo modificar si se encuentra un bug durante la prueba visual.
