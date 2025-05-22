# Roadmap: User-Specific NFlow API Access Tokens

This roadmap outlines the tasks required to implement user-specific NFlow API access tokens.

## Phases and Tasks

### Phase 1: Core Logic Implementation (7/7 completed - 100%)

- [V] **Task 1.1**: Update `RedisSessionService` (`src/modules/auth/services/redis-session.service.ts`)
  - Description: Ensure session data reliably stores and retrieves `accessToken` and `refreshToken` from Keycloak.
  - Files: `src/modules/auth/services/redis-session.service.ts`, relevant DTOs/interfaces.
- [V] **Task 1.2**: Create/Update Keycloak Service for Token Refresh (`src/modules/auth/services/keycloak.service.ts` or new `KeycloakClientService.ts`)
  - Description: Implement a method to refresh Keycloak `accessToken` using a `refreshToken` for a user. This should handle communication with Keycloak's token endpoint.
  - Files: `src/modules/auth/services/keycloak.service.ts` (or new service file).
- [V] **Task 1.3**: Modify `BaseNFlowService` - Constructor and `userId` Handling (`src/shared/services/nflow-api/base-nflow.service.ts`)
  - Description: Modify `BaseNFlowService` to accept `userId` (e.g., per method call). Inject `RedisSessionService` and the Keycloak refresh service.
  - Files: `src/shared/services/nflow-api/base-nflow.service.ts`.
- [V] **Task 1.4**: Implement Token Retrieval in `BaseNFlowService` (`src/shared/services/nflow-api/base-nflow.service.ts`)
  - Description: Add logic to fetch user session from Redis using `userId` and extract the `accessToken`.
  - Files: `src/shared/services/nflow-api/base-nflow.service.ts`.
- [V] **Task 1.5**: Update NFlow API Request Authentication in `BaseNFlowService` (`src/shared/services/nflow-api/base-nflow.service.ts`)
  - Description: Change `Authorization` header to use `Bearer <userAccessToken>`. Remove usage of global `NFLOW_API_KEY` for these requests.
  - Files: `src/shared/services/nflow-api/base-nflow.service.ts`.
- [V] **Task 1.6**: Implement Token Refresh Logic in `BaseNFlowService` (`src/shared/services/nflow-api/base-nflow.service.ts`)
  - Description: Add logic to catch 401/403 errors from NFlow, use the Keycloak service to refresh the token, update the session in Redis, and retry the request.
  - Files: `src/shared/services/nflow-api/base-nflow.service.ts`.
- [V] **Task 1.7**: Error Handling in `BaseNFlowService` (`src/shared/services/nflow-api/base-nflow.service.ts`)
  - Description: Implement robust error handling for missing `userId`, session not found, token missing, and refresh failures.
  - Files: `src/shared/services/nflow-api/base-nflow.service.ts`.

### Phase 2: Context Propagation and Service Updates (4/4 completed - 100%)

- [V] **Task 2.1**: Update HTTP Consumers of `BaseNFlowService`
  - Description: Modify services called by HTTP controllers to obtain `userId` from `request.user` and pass it to `BaseNFlowService`.
  - Files: e.g., `src/modules/chat/services/chat.service.ts`, other relevant service files.
- [V] **Task 2.2**: Update WebSocket Consumers of `BaseNFlowService`
  - Description: Modify services called by WebSocket gateways to obtain `userId` from `client.user` (populated by `WsKeycloakAuthGuard`) and pass it to `BaseNFlowService`.
  - Files: e.g., services used by `ChatGateway` (`src/modules/chat/chat.gateway.ts`).
- [V] **Task 2.3**: Verify Guard Implementations (`KeycloakAuthGuard`, `WsKeycloakAuthGuard`)
  - Description: Ensure `userId` is correctly populated in `request.user` and `client.user` respectively.
  - Files: `src/modules/auth/guards/keycloak-auth.guard.ts`, `src/shared/guards/ws-keycloak-auth.guard.ts`.
- [V] **Task 2.4**: Environment Configuration (`.env.example`, `src/config/env/env.validation.ts`)
  - Description: Evaluate the need for `NFLOW_API_KEY`. If no longer needed for user-specific calls, mark as optional or remove. Update documentation if its role changes.
  - Files: `.env.example`, `src/config/env/env.validation.ts`.

### Phase 3: Testing (0/3 completed - 0%)

- [ ] **Task 3.1**: Unit Tests
  - Description: Write unit tests for `BaseNFlowService` (token retrieval, auth header, refresh logic, error handling), Keycloak refresh service, and `RedisSessionService` updates.
  - Files: Corresponding `.spec.ts` files for services in Phase 1.
- [ ] **Task 3.2**: Integration Tests
  - Description: Develop integration tests for HTTP and WebSocket flows, ensuring `userId` propagation and token usage with mocked NFlow API and real Redis.
  - Files: New or existing integration test files.
- [ ] **Task 3.3**: End-to-End Tests (Optional, if feasible)
  - Description: Test against a live NFlow environment (if available and configured for Keycloak tokens).
  - Files: New or existing e2e test files.

### Phase 4: Documentation and Review (0/3 completed - 0%)

- [ ] **Task 4.1**: Code Documentation (JSDoc)
  - Description: Add JSDoc comments to new and modified classes and methods.
  - Files: All modified `.ts` files.
- [ ] **Task 4.2**: Update PRD and Tech Spec
  - Description: Refine `prd.md` and `tech-spec.md` based on implementation details and decisions made.
  - Files: `docs/features/user-specific-nflow-access-token/prd.md`, `docs/features/user-specific-nflow-access-token/tech-spec.md`.
- [ ] **Task 4.3**: Code Review and Merge
  - Description: Conduct a thorough code review, address feedback, and merge the feature branch.

## Progress Summary

- **Phase 1: Core Logic Implementation**: 7/7 completed (100%)
- **Phase 2: Context Propagation and Service Updates**: 4/4 completed (100%)
- **Phase 3: Testing**: 0/3 completed (0%)
- **Phase 4: Documentation and Review**: 0/3 completed (0%)

**Total Progress: 11/17 tasks completed (65%)**
