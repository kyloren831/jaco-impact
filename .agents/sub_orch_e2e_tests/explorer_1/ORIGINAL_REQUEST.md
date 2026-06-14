## 2026-06-08T05:36:44Z

Explore the 'Mis Tareas' repository to find:
1. Available testing setups (e.g. any existing test files, dev dependencies, frameworks).
2. The authentication mechanism: how do users log in? Is there a session cookie, JWT, or header? Where is this logic defined?
3. How the Server Actions (features/volunteer/actions.ts and features/evidences/actions.ts) are structured and how they handle request validation/session retrieval.
4. The API endpoints, especially /api/realtime SSE route and how we can connect to programmatically in our test suite.
5. The Prisma database setup, connection variables, and whether there are seed/admin creation scripts we can use to prepare test data.
Write a comprehensive analysis report to /home/aaron/Projects/jaco-impact/.agents/sub_orch_e2e_tests/explorer_analysis.md summarizing your findings and recommending an architecture/runner for our E2E testing framework. Include exact file paths, function names, and database fields where relevant.
