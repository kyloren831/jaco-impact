# Scope: E2E Testing Track

## Architecture
- Opaque-box testing framework targeting Next.js server actions, APIs, and client-like flows.
- Features under test:
  1. Volunteer Dashboard & Assignment Status Transitions (Accept, Decline, Start, Submit)
  2. Task Comments & Real-time SSE Broadcasting
  3. Evidence Storage Presigned URLs & Upload Verification
  4. Real-world end-to-end task workflows

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Test Infra & Tier 1 Feature Coverage | Setup test runner, utilities, and implement Tier 1 tests (happy-path feature tests) | None | PLANNED |
| 2 | Tier 2 Boundary & Corner Cases | Implement Tier 2 tests (boundary values, invalid transitions, error handling) | M1 | PLANNED |
| 3 | Tier 3 Combinations & Tier 4 Scenarios | Implement Tier 3 (cross-feature interactions) and Tier 4 (real-world workflows) | M1, M2 | PLANNED |
| 4 | Verification & Acceptance | Run complete E2E test suite, verify against implementation, publish TEST_READY.md | M3 | PLANNED |

## Interface Contracts
- Tests must be strictly opaque-box.
- Tests communicate via Next.js Server Actions (using Node API or raw HTTP calls) and SSE endpoints (`/api/realtime`).
