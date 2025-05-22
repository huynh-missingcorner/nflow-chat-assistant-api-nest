# Technical Specification: User and Chat Session Management

## 1. Introduction

This document provides the technical details for implementing user management with Keycloak SSO and associating chat sessions with users. It builds upon the requirements outlined in the PRD (`prd.md`).

## 2. System Architecture Overview

- **Authentication Flow**: The application will use the OAuth 2.0 Authorization Code Grant flow with Keycloak as the identity provider.
- **Session Management**: User sessions will be managed using `express-session`, with session data storing Keycloak tokens and user identifiers.
- **Authorization**: Access to chat session resources will be controlled by checking the `userId` associated with the session against the authenticated user's ID.
- **Database**: Prisma will be used to interact with the PostgreSQL database. The `ChatSession` schema will be updated to include a `userId`.

## 3. Detailed Design

### 3.1. Keycloak Integration (`src/modules/auth`)

- **Configuration**: Keycloak client ID, client secret, realm, and auth server URL will continue to be managed via environment variables and `EnvConfig`.
- **Login (`KeycloakController.login`)**: No changes to the initiation of the login flow.
- **Callback (`KeycloakController.callback`)**:
  - After exchanging the authorization code for tokens, extract the user ID (typically the `sub` claim) from the ID token.
  - Store this `userId` in the session data (e.g., `session.userId = keycloakUserInfo.sub`).
  - The `KeycloakUserInfo` type and `getAuthenticatedUserInfo` method in `KeycloakService` can be used to parse the ID token.
- **Refresh (`KeycloakController.refresh`)**: Ensure `userId` in the session is preserved or re-validated if necessary after token refresh.
- **Logout (`KeycloakController.logout`)**: Clear `userId` from the session along with tokens.
- **Status (`KeycloakController.getStatus`)**: Include `userId` in the `AuthStatusResponseDto` if available in the session.

### 3.2. User Representation

- We will not create a separate `User` table in our application database initially. The Keycloak `sub` (subject) claim will serve as the unique `userId`.
- User profile information (name, email) can be retrieved from the ID token or by calling Keycloak's userinfo endpoint if needed, and stored in the session for quick access.
- The `SessionData` type in `src/modules/auth/types/session.ts` will be updated:
  ```typescript
  export interface SessionData extends Record<string, any> {
    state?: string;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    userId?: string; // Add this line
    userInfo?: KeycloakUserInfo; // Optional: store basic user info
  }
  ```

### 3.3. Database Schema Changes (`prisma/schema.prisma`)

- Modify the `ChatSession` model to include a `userId` field:

  ```prisma
  model ChatSession {
    id        String   @id @default(uuid())
    userId    String   // New field to store Keycloak user ID
    title     String
    archived  Boolean  @default(false)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // Relations
    messages     Message[]
    agentResults AgentResult[]
    generatedApp GeneratedApp?

    @@index([userId]) // Add index for querying by userId
    @@map("chat_sessions")
  }
  ```

- After modifying the schema, new Prisma migrations need to be generated and applied:
  ```bash
  npx prisma migrate dev --name add_user_to_chat_session
  ```

### 3.4. Chat Session Service (`src/modules/chat-session/chat-session.service.ts`)

- **`create(createChatSessionDto: CreateChatSessionDto, userId: string)`**:
  - The `create` method will now require a `userId` parameter.
  - This `userId` will be passed from the controller, extracted from the authenticated user's session.
  - When creating a `ChatSession`, the `userId` must be included in the data passed to `prisma.chatSession.create`.
  - Update `CreateChatSessionDto` if necessary, though `userId` will likely come from the session context, not the request body directly for security.
    ```typescript
    // In ChatSessionService
    async create(createChatSessionDto: CreateChatSessionDto, userId: string) {
      try {
        return await this.prisma.chatSession.create({
          data: {
            ...createChatSessionDto,
            userId, // Associate with user
          },
        });
      }
      // ... error handling
    }
    ```
- **`findAll(userId: string)`**:
  - The `findAll` method will now require a `userId` parameter.
  - It will fetch only chat sessions where `ChatSession.userId` matches the provided `userId`.
    ```typescript
    // In ChatSessionService
    async findAll(userId: string) {
      try {
        return await this.prisma.chatSession.findMany({
          where: { userId }, // Filter by userId
          orderBy: { createdAt: 'desc' },
        });
      }
      // ... error handling
    }
    ```
- **`findOne(id: string, userId: string)`**:
  - The `findOne` method will now require a `userId` parameter.
  - It will fetch the chat session only if its `ChatSession.id` matches AND `ChatSession.userId` matches the provided `userId`.
  - If no matching session is found (either wrong ID or wrong user), throw `NotFoundException`.
    ```typescript
    // In ChatSessionService
    async findOne(id: string, userId: string) {
      try {
        const chatSession = await this.prisma.chatSession.findUnique({
          where: { id, userId }, // Check both id and userId
          include: {
            messages: true,
            generatedApp: true,
          },
        });
        if (!chatSession) {
          throw new NotFoundException(`Chat session with ID ${id} not found or access denied`);
        }
        return chatSession;
      }
      // ... error handling
    }
    ```
- **`update(id: string, updateChatSessionDto: UpdateChatSessionDto, userId: string)`**:
  - The `update` method will now require a `userId` parameter.
  - First, verify that the chat session with the given `id` belongs to the `userId` before attempting an update.
  - This can be done by querying `findUnique({ where: { id, userId } })` first, or by including `userId` in the `where` clause of the update operation if Prisma supports it directly for ensuring ownership during update. A safer approach is to fetch and verify, then update.
    ```typescript
    // In ChatSessionService
    async update(id: string, updateChatSessionDto: UpdateChatSessionDto, userId: string) {
      // First, verify ownership
      const existingSession = await this.prisma.chatSession.findUnique({
        where: { id, userId },
      });
      if (!existingSession) {
        throw new NotFoundException(`Chat session with ID ${id} not found or access denied`);
      }
      // Then, update
      return await this.prisma.chatSession.update({
        where: { id }, // ID is sufficient here as ownership is verified
        data: updateChatSessionDto,
      });
      // ... error handling and NotFoundException if update fails on non-existent ID after check
    }
    ```
- **`remove(id: string, userId: string)`**:
  - The `remove` method will now require a `userId` parameter.
  - Similar to `update`, verify ownership before deletion.
    ```typescript
    // In ChatSessionService
    async remove(id: string, userId: string) {
      // First, verify ownership
      const existingSession = await this.prisma.chatSession.findUnique({
        where: { id, userId },
      });
      if (!existingSession) {
        throw new NotFoundException(`Chat session with ID ${id} not found or access denied`);
      }
      // Then, delete
      return await this.prisma.chatSession.delete({
        where: { id }, // ID is sufficient here
      });
      // ... error handling
    }
    ```

### 3.5. Chat Session Controller (`src/modules/chat-session/chat-session.controller.ts`)

- All `ChatSessionController` methods will now need to extract the `userId` from the authenticated session.
- A custom decorator or retrieving `userId` from `@Session()` directly can be used.
- **`@Session() session: SessionData`** will provide access to `session.userId`.
- **`create(@Body() createChatSessionDto: CreateChatSessionDto, @Session() session: SessionData)`**:
  - Get `userId` from `session.userId`.
  - If `userId` is not present, throw `UnauthorizedException`.
  - Pass `userId` to `chatSessionService.create()`.
- **`findAll(@Session() session: SessionData)`**:
  - Get `userId` from `session.userId`.
  - If `userId` is not present, throw `UnauthorizedException`.
  - Pass `userId` to `chatSessionService.findAll()`.
- **`findOne(@Param('id') id: string, @Session() session: SessionData)`**:
  - Get `userId` from `session.userId`.
  - If `userId` is not present, throw `UnauthorizedException`.
  - Pass `id` and `userId` to `chatSessionService.findOne()`.
- **`update(@Param('id') id: string, @Body() updateChatSessionDto: UpdateChatSessionDto, @Session() session: SessionData)`**:
  - Get `userId` from `session.userId`.
  - If `userId` is not present, throw `UnauthorizedException`.
  - Pass `id`, `updateChatSessionDto`, and `userId` to `chatSessionService.update()`.
- **`remove(@Param('id') id: string, @Session() session: SessionData)`**:
  - Get `userId` from `session.userId`.
  - If `userId` is not present, throw `UnauthorizedException`.
  - Pass `id` and `userId` to `chatSessionService.remove()`.
- Ensure `NflowAuthGuard` correctly populates session with `userId` or that necessary information is available via `KeycloakService.getAuthenticatedUserInfo` and stored in session upon login.

### 3.6. Authentication Guard (`src/modules/auth/guards/nflow-auth.guard.ts`)

- The `NflowAuthGuard` should ensure that `session.accessToken` is present and valid.
- It doesn't strictly need to be modified for `userId` as long as the `KeycloakController` correctly populates `session.userId` upon successful login/callback. Controllers protected by this guard can then assume `session.userId` is available if authentication was successful.
- If `session.userId` is not populated during login, the guard could be extended to fetch/validate it, but it's cleaner to handle it in the auth controller logic.

### 3.7. Accessing User Information

- A utility function or a method in a shared service could be created to easily retrieve the current `userId` from the request/session object in controllers or services where needed, ensuring consistency.
  Example (conceptual decorator):

  ```typescript
  // src/shared/decorators/user.decorator.ts
  import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
  import { SessionData } from '@/modules/auth/types/session';

  export const AuthenticatedUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const session = request.session as SessionData;
    if (!session.userId) {
      // This check might be redundant if NflowAuthGuard already ensures session validity
      // and userId presence after login.
      throw new UnauthorizedException('User ID not found in session');
    }
    return { userId: session.userId, userInfo: session.userInfo }; // Or just session.userId
  });
  ```

  Usage in controller:
  `create(@Body() dto: Dto, @AuthenticatedUser() user: { userId: string })`

## 4. API Endpoint Changes (Summary)

- No new endpoints are created.
- Existing `ChatSessionController` endpoints (`POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`) will internally enforce ownership based on the authenticated user's `userId`.
- Request bodies for `ChatSession` creation/update do not need to change to include `userId`; it's derived from the session.

## 5. Testing Considerations

- **Unit Tests**:
  - `ChatSessionService`: Test methods with mocked Prisma calls, ensuring `userId` is correctly used in queries and ownership logic is sound.
  - `ChatSessionController`: Mock `ChatSessionService` and test that `userId` is correctly extracted from the session and passed to the service. Test `UnauthorizedException` cases when `userId` is missing.
  - `KeycloakController`: Ensure `session.userId` is set on callback and cleared on logout.
- **Integration Tests / E2E Tests**:
  - Simulate login flow to establish a session with a `userId`.
  - Test CRUD operations on chat sessions, verifying:
    - A user can manage their own sessions.
    - A user cannot access/modify another user's sessions (expect 403 Forbidden or 404 Not Found responses).
  - Test logout functionality.

## 6. Deployment Considerations

- Ensure Keycloak is configured correctly for the deployed environment (redirect URIs, client secrets).
- Apply Prisma migrations to the database as part of the deployment process.

## 7. Future Considerations

- **Admin Access**: Define how administrators might access or manage all chat sessions (requires RBAC).
- **Sharing Chat Sessions**: Functionality to share chat sessions between users.
- **User Profile Page**: If a dedicated user profile page is needed in the app, beyond what Keycloak offers.
