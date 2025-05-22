# Roadmap: User and Chat Session Management

## Phase 1: Core Implementation (13/13 completed - 100%)

- **Authentication & User ID (`src/modules/auth`)**
  - [V] **Task 1.1**: Update `SessionData` type (`src/modules/auth/types/session.ts`) to include `userId` and optional `userInfo`.
    - _Files_: `src/modules/auth/types/session.ts`
  - [V] **Task 1.2**: Modify `KeycloakController.callback` to extract `userId` (Keycloak `sub`) from ID token and store in `session.userId` and `session.userInfo`.
    - _Files_: `src/modules/auth/controllers/keycloak.controller.ts`, `src/modules/auth/services/keycloak.service.ts`
  - [V] **Task 1.3**: Ensure `KeycloakController.refresh` preserves `session.userId` and `session.userInfo`.
    - _Files_: `src/modules/auth/controllers/keycloak.controller.ts`
  - [V] **Task 1.4**: Modify `KeycloakController.logout` to clear `session.userId` and `session.userInfo`.
    - _Files_: `src/modules/auth/controllers/keycloak.controller.ts`
  - [V] **Task 1.5**: Update `AuthStatusResponseDto` and `KeycloakController.getStatus` to include `userId` and basic `userInfo` if available.
    - _Files_: `src/modules/auth/dto/auth-status-response.dto.ts`, `src/modules/auth/controllers/keycloak.controller.ts`
- **Database (`prisma`)**
  - [V] **Task 1.6**: Add `userId` field and `@@index([userId])` to `ChatSession` model in `prisma/schema.prisma`.
    - _Files_: `prisma/schema.prisma`
  - [V] **Task 1.7**: Generate and apply Prisma migration: `npx prisma migrate dev --name add_user_to_chat_session`.
    - _Commands_: `npx prisma migrate dev --name add_user_to_chat_session`
- **Chat Session Logic (`src/modules/chat-session`)**
  - [V] **Task 1.8**: Modify `ChatSessionService.create` to accept `userId` and associate it with the new session.
    - _Files_: `src/modules/chat-session/services/chat-session.service.ts`
  - [V] **Task 1.9**: Modify `ChatSessionService.findAll` to accept `userId` and filter sessions by it.
    - _Files_: `src/modules/chat-session/services/chat-session.service.ts`
  - [V] **Task 1.10**: Modify `ChatSessionService.findOne` to accept `userId` and enforce ownership.
    - _Files_: `src/modules/chat-session/services/chat-session.service.ts`
  - [V] **Task 1.11**: Modify `ChatSessionService.update` to accept `userId` and enforce ownership before updating.
    - _Files_: `src/modules/chat-session/services/chat-session.service.ts`
  - [V] **Task 1.12**: Modify `ChatSessionService.remove` to accept `userId` and enforce ownership before deleting.
    - _Files_: `src/modules/chat-session/services/chat-session.service.ts`
- **Controller Layer (`src/modules/chat-session`)**
  - [V] **Task 1.13**: Update all `ChatSessionController` methods to extract `userId` from `@Session() session: SessionData` and pass it to the service methods. Implement `UnauthorizedException` if `userId` is missing.
    - _Files_: `src/modules/chat-session/controllers/chat-session.controller.ts`

## Phase 2: Securing Access to Related Data (3/3 completed - 100%)

- **Message Access Control**
  - [V] **Task 2.1**: Modify `MessageService` methods (e.g., `create`, `findAllInSession`) to verify that the parent `ChatSession` belongs to the authenticated `userId` before proceeding. This might involve fetching the chat session first or joining tables in Prisma queries if possible.
    - _Files_: `src/modules/chat/services/chat-message.service.ts` (assuming, path might vary)
  - [V] **Task 2.2**: Update `MessageController` methods to pass `userId` (obtained from session) to service methods for authorization checks.
    - _Files_: `src/modules/chat/controllers/chat-message.controller.ts` (assuming, path might vary)
- **Other Related Data (Agent Results, Generated Apps)**
  - [V] **Task 2.3**: Review and update services and controllers for `AgentResult` and `GeneratedApp` to ensure access is restricted based on the ownership of the parent `ChatSession` (similar to messages). This requires identifying the relevant service/controller files and applying ownership checks using `userId`.
    - _Files_: `src/modules/chat/services/chat.service.ts`, `src/modules/chat/controllers/chat.controller.ts`

## Phase 3: Testing (0/4 completed - 0%)

- **Unit Tests**
  - [ ] **Task 3.1**: Write unit tests for `KeycloakController` changes (session `userId` management).
    - _Files_: `src/modules/auth/controllers/keycloak.controller.spec.ts`
  - [ ] **Task 3.2**: Write unit tests for `ChatSessionService` methods (ownership logic, Prisma query changes).
    - _Files_: `src/modules/chat-session/services/chat-session.service.spec.ts`
  - [ ] **Task 3.3**: Write unit tests for `ChatSessionController` methods (`userId` extraction, unauthorized exceptions).
    - _Files_: `src/modules/chat-session/controllers/chat-session.controller.spec.ts`
- **Integration/E2E Tests**
  - [ ] **Task 3.4**: Develop E2E tests for the chat session CRUD flow:
    - User A logs in.
    - User A creates chat session 1.
    - User A can list, get, update, delete chat session 1.
    - User B logs in.
    - User B cannot list, get, update, delete chat session 1 (expect 403/404).
    - User B creates chat session 2.
    - User A cannot access chat session 2.
    - Test access to messages within an owned vs unowned chat session.
    - Test logout and session invalidation.
    - _Files_: (New E2E test files, likely in `test/` directory)

## Phase 4: Documentation & Refinements (1/2 completed - 50%)

- **API Documentation**
  - [ ] **Task 4.1**: Update API documentation (e.g., Swagger/OpenAPI) to reflect any changes in request/response related to user authentication and authorization for chat sessions. Note that `userId` is mostly an internal concern passed via session, so public API contracts might not change significantly but behavior does.
    - _Files_: (API documentation files, e.g. Swagger YAML/JSON)
- **Code Refinements**
  - [V] **Task 4.2**: Create and use the `@AuthenticatedUser()` decorator (as outlined in `tech-spec.md`) for cleaner `userId` access in controllers.
    - _Files_: `src/shared/decorators/user.decorator.ts`, `src/modules/chat-session/controllers/chat-session.controller.ts`, other controllers as needed.

---

**Total Progress: 17/22 tasks completed (77%)**
