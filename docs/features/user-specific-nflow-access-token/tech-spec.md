# Technical Specification: User-Specific NFlow API Access Tokens

## 1. Introduction

This document details the technical implementation for using user-specific Keycloak access tokens to authenticate with the NFlow API, replacing the current global API key approach. This change enhances security and enables user-level auditing.

## 2. Current Architecture

- **NFlow API Authentication**: Uses a global `NFLOW_API_KEY` (environment variable).
- **User Authentication**: Keycloak is integrated for user authentication.
- **Session Management**: User sessions, including `userId`, Keycloak `accessToken`, and `refreshToken`, are stored in Redis via `RedisSessionService`.
- **NFlow Service**: `BaseNFlowService` handles all communication with the NFlow API.

## 3. Proposed Solution

The primary change involves modifying `BaseNFlowService` to fetch the user's Keycloak `accessToken` from their Redis session and use it for NFlow API calls.

### 3.1. Token Retrieval Strategy

- **Input**: `userId`.
- **Process**: The `BaseNFlowService` will require the `userId` of the currently authenticated user.
  - This `userId` will be used to fetch the user's session data from Redis using the existing `RedisSessionService.getSession(userId)` method.
  - The `accessToken` will be extracted from the retrieved session data.
- **Output**: Keycloak `accessToken`.

**Security and Performance Considerations for Token Retrieval:**

- **Security**: Retrieving the session from Redis by `userId` is a standard and generally secure approach, provided that:
  - Redis is appropriately secured (e.g., network access, authentication).
  - The `userId` cannot be easily spoofed or manipulated by unauthorized parties. Since `userId` will be sourced from the authenticated user's context (e.g., from a JWT parsed by a guard), this risk is mitigated.
  - The `accessToken` is only used for the NFlow API call and not logged or stored elsewhere unnecessarily.
- **Performance**: Redis is an in-memory data store, so fetching session data is typically very fast (sub-millisecond). This should not introduce significant latency. However, continuous monitoring post-implementation is recommended.

**Alternative Solutions Considered & Rejected:**

1.  **Passing `accessToken` directly to `BaseNFlowService`**:
    - **Pros**: Simplifies `BaseNFlowService` as it wouldn't need to know about Redis or `userId`.
    - **Cons**: Requires `accessToken` to be propagated through potentially many layers of the application to reach `BaseNFlowService`. This increases coupling and the risk of accidental token exposure. It also makes context management more complex, especially with asynchronous operations or background tasks that might need to call NFlow API.
2.  **Using a Request-Scoped Provider for `accessToken`**:
    - **Pros**: Token could be injected directly into `BaseNFlowService` if it were request-scoped.
    - **Cons**: `BaseNFlowService` is likely a singleton or a transient provider injected into other services, not necessarily request-scoped itself. Making it request-scoped could have broader implications for its lifecycle and how it's used. While a dedicated request-scoped service could _provide_ the token to `BaseNFlowService`, this essentially moves the problem of context propagation to that new service, which would still need access to the current user's identity.

The proposed solution (fetching from Redis using `userId`) offers a good balance: it leverages existing session management infrastructure, centralizes token retrieval logic within `BaseNFlowService` (or a dedicated helper service it uses), and relies on a `userId` which is a common piece of context available post-authentication.

### 3.2. Modifying `BaseNFlowService`

- The constructor or a dedicated method within `BaseNFlowService` will need to accept or have access to the `userId`.
- If `BaseNFlowService` is a singleton, passing `userId` per method call is necessary. If it can be request-scoped or transient, `userId` could be injected.
- The service will call `RedisSessionService.getSession(userId)` to get the session.
- It will extract the `accessToken` from the session.
- The `Authorization` header for NFlow API requests will be set to `Bearer <accessToken>`.
- The global `NFLOW_API_KEY` will no longer be used by `BaseNFlowService` for API calls.

### 3.3. Context Propagation for `userId`

- **HTTP Requests**: For standard HTTP controller flows, the `userId` can be obtained from the `request.user` object, typically populated by an authentication guard (e.g., `KeycloakAuthGuard`). This `userId` can then be passed down to services that use `BaseNFlowService`.
- **WebSocket Connections**: For WebSocket gateways (e.g., `ChatGateway`), the `userId` must be extracted from the client's socket connection, usually during the `handleConnection` phase using a WebSocket authentication guard (e.g., `WsKeycloakAuthGuard`). This `userId` should be associated with the socket session and made available to services handling WebSocket messages.
  - The `WsKeycloakAuthGuard` already attaches the user to the socket: `client.user = { userId: session.userId, ...session };`
  - Services called from the gateway can receive `client.user.userId`.

### 3.4. Token Refresh Logic

- **Current**: `BaseNFlowService` might have logic to use a global NFlow refresh token.
- **New**: If an NFlow API call fails with a 401/403 due to an expired/invalid `accessToken`:
  1.  `BaseNFlowService` should attempt to use the Keycloak `refreshToken` (also from the user's Redis session) to obtain a new `accessToken` and `refreshToken` pair from Keycloak.
  2.  This will involve calling the Keycloak token endpoint (`/protocol/openid-connect/token`) with `grant_type=refresh_token`.
  3.  The `KeycloakService` (or a similar utility) might be responsible for this refresh logic. An instance of `KeycloakAdminService` (if appropriate, or a new client-focused Keycloak interaction service) could be used, or a direct HTTP call made.
  4.  If successful, the new `accessToken` and `refreshToken` must be updated in the user's Redis session by calling `RedisSessionService.setSession(userId, newSessionData)`.
  5.  The NFlow API request should be retried with the new `accessToken`.
  6.  If refreshing fails (e.g., `refreshToken` is also invalid), a specific error should be thrown, prompting the user to re-authenticate.

### 3.5. Error Handling

- If `userId` is not available: Throw an error indicating a missing user context.
- If session is not found in Redis for `userId`: Throw an error (e.g., `UnauthorizedException` or a custom session-not-found error).
- If `accessToken` is missing from session: Throw an error.
- If token refresh fails: Propagate an error that signals re-authentication is needed.

## 4. Affected Modules and Files

1.  **`src/shared/services/nflow-api/base-nflow.service.ts`**:
    - Modify constructor or methods to accept `userId`.
    - Inject `RedisSessionService`.
    - Implement logic to fetch session and extract `accessToken`.
    - Update `Authorization` header.
    - Implement Keycloak `refreshToken` logic.
    - Remove usage of `NFLOW_API_KEY` for request authentication.
2.  **`src/modules/auth/services/redis-session.service.ts`**:
    - Ensure `getSession` and `setSession` methods are suitable and robust.
    - Session data structure should clearly include `accessToken` and `refreshToken`.
3.  **`src/modules/auth/services/keycloak.service.ts` (or a new service, e.g., `KeycloakClientService.ts`)**:
    - May need a new method to refresh Keycloak tokens using a `refreshToken` for a specific user (not the admin-cli client).
4.  **Consumers of `BaseNFlowService`** (various services across modules like `ChatService`, etc.):
    - Need to be updated to pass the `userId` to `BaseNFlowService` methods.
    - Example: `src/modules/chat/services/chat.service.ts`.
5.  **Guards (`KeycloakAuthGuard`, `WsKeycloakAuthGuard`)**:
    - Ensure they correctly populate `request.user.userId` or `client.user.userId`.
    - `WsKeycloakAuthGuard` already seems to store `userId` in `client.user`.
6.  **`src/config/env/env.validation.ts` and `.env.example`**:
    - `NFLOW_API_KEY` might become optional or removed if no other part of the system uses it directly. If it's still needed for some bootstrap or non-user-specific calls, this needs to be clarified.

## 5. Testing Strategy

- **Unit Tests**:
  - `BaseNFlowService`:
    - Test token retrieval logic with mocked `RedisSessionService`.
    - Test correct `Authorization` header formation.
    - Test token refresh success and failure scenarios (mocking Keycloak calls and Redis updates).
    - Test error handling for missing session/token.
  - `RedisSessionService`: Verify session structure and R/W operations.
  - Keycloak token refresh service: Test token refresh logic.
- **Integration Tests**:
  - Test a full flow: API call from a controller -> service -> `BaseNFlowService` -> NFlow API (mocked).
    - Ensure `userId` is propagated correctly.
    - Ensure actual Redis lookups work.
  - Test WebSocket flow: Message from client -> `ChatGateway` -> service -> `BaseNFlowService` -> NFlow API (mocked).
- **End-to-End Tests**:
  - If possible, test against a dev/staging NFlow environment that supports Keycloak token authentication.

## 6. Deployment Considerations

- The global `NFLOW_API_KEY` environment variable might be phased out or its role re-evaluated.
- Ensure Keycloak is configured to issue tokens with appropriate audience/scope if NFlow API validates these.
- Monitor performance and error rates post-deployment, especially around Redis access and NFlow API call latencies.

## 7. Open Questions/Concerns

1.  **NFlow API Support**: Confirm NFlow API supports authentication with Keycloak-issued Bearer tokens and doesn't require any specific claims not already present.
2.  **Global `NFLOW_API_KEY`**: Is it used anywhere else, or can it be completely removed? If some system-level calls to NFlow are needed without a user context, a separate mechanism or a dedicated service account token might be required.
3.  **Token Lifetime Mismatch**: Keycloak `accessToken` lifetime vs. NFlow API session lifetime. The refresh logic should handle this, but it's good to be aware of the typical lifetimes.
