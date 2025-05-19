# Roadmap: Keycloak SSO Integration for Nflow API

This document outlines the tasks required to implement Keycloak SSO integration for automated Nflow API token retrieval.

## Overall Progress: 0/18 completed (0%)

## Phase 1: Setup and Configuration (0/4 completed - 0%)

- [ ] **Task 1.1:** Coordinate with Nflow team to get/create a Keycloak client for the application.
  - **Files/Deliverables:** Keycloak Client ID, Client Secret, Realm details.
- [ ] **Task 1.2:** Add new environment variables for Keycloak configuration to `.env.example` and development `.env` files.
  - **Files:** `.env.example`, local `.env`.
  - **Variables:** `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_REALM`, `KEYCLOAK_AUTH_SERVER_URL`, `KEYCLOAK_CALLBACK_URL`, `SESSION_SECRET`, `REFRESH_TOKEN_ENCRYPTION_KEY` (if applicable).
- [ ] **Task 1.3:** Update `src/config/env/env.config.ts` to include validation for new Keycloak environment variables.
  - **Files:** `src/config/env/env.config.ts`
- [ ] **Task 1.4:** Update `src/config/env/env.config.ts` to load and expose new Keycloak configuration.
  - **Files:** `src/config/env/env.config.ts`

## Phase 2: Backend Implementation (NestJS) (0/8 completed - 0%)

- [ ] **Task 2.1:** Create or update `src/modules/auth` module to include Keycloak integration.
  - **Files:** `src/modules/auth/auth.module.ts`
- [ ] **Task 2.2:** Implement `KeycloakController` with endpoints for `/login`, `/callback`, `/logout`, `/refresh` (if exposed), and `/status`.
  - **Files:** `src/modules/auth/controllers/keycloak.controller.ts`
- [ ] **Task 2.3:** Implement `KeycloakService` for token exchange, refresh logic, and token storage/management.
  - **Files:** `src/modules/auth/services/keycloak.service.ts`
- [ ] **Task 2.4:** Implement Passport strategy for Keycloak OAuth2.
  - **Files:** `src/modules/auth/strategies/keycloak.strategy.ts`
- [ ] **Task 2.5:** Configure session management and HTTP-only cookies for access token.
  - **Files:** `src/shared/infrastructure/session/session.module.ts`
- [ ] **Task 2.6:** Implement secure storage for refresh tokens (Redis or database via Prisma).
  - **Files:** Update or create relevant repository or service.
- [ ] **Task 2.7:** Create an interceptor to attach Keycloak access tokens to Nflow API requests.
  - **Files:** `src/shared/services/nflow-api/nflow-api.interceptor.ts`
- [ ] **Task 2.8:** Add unit and integration tests for the Keycloak authentication components.
  - **Files:** Appropriate test files for controllers and services.

## Phase 3: Frontend Implementation (0/3 completed - 0%)

- [ ] **Task 3.1:** Create a "Login with Keycloak" button/link in the UI.
  - **Files:** Relevant frontend components.
- [ ] **Task 3.2:** Implement frontend logic to call backend login/logout endpoints and manage authenticated state.
  - **Files:** Frontend auth service and components.
- [ ] **Task 3.3:** Ensure frontend calls backend APIs that require Nflow access.
  - **Files:** Frontend API services.

## Phase 4: Documentation and Testing (0/3 completed - 0%)

- [ ] **Task 4.1:** Update developer documentation on how to set up and use the new Keycloak SSO feature.
  - **Files:** `README.md` or other relevant docs.
- [ ] **Task 4.2:** Perform end-to-end testing in a development/staging environment with a real Keycloak instance.
  - **Deliverables:** Test plan, test results.
- [ ] **Task 4.3:** Review and update security configurations and ensure all sensitive data is handled correctly.
  - **Deliverables:** Security review checklist/report.

---
