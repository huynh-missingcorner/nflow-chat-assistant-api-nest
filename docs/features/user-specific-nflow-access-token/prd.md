# Product Requirements Document: User-Specific NFlow API Access Tokens

## 1. Introduction

This document outlines the requirements for updating the NFlow API integration to use user-specific access tokens instead of a global API key. This change will enhance security and enable more granular control and auditing of API access.

## 2. Goals

- Completely remove the use of "NFLOW_API_KEY" env
- Enhance security by using user-specific access tokens for NFlow API calls.
- Ensure that NFlow API requests are made on behalf of the authenticated user.
- Maintain a seamless experience for users.
- Allow for better auditing and tracking of API usage at the user level.

## 3. Current System

Currently, all requests to the NFlow API are authenticated using a single, global `NFLOW_API_KEY` stored as an environment variable. The backend system has Keycloak integration for user authentication, and user sessions (including Keycloak `accessToken` and `userId`) are stored in Redis.

## 4. Proposed Changes

The `BaseNFlowService` will be modified to retrieve the Keycloak `accessToken` associated with the current user making the request. This token will then be used to authenticate requests to the NFlow API.

## 5. Functional Requirements

1.  **User-Specific Token Retrieval:**
    - The system must be able to retrieve the Keycloak `accessToken` for the currently authenticated user.
    - This retrieval mechanism will likely involve fetching the user's session data from Redis.
2.  **NFlow API Authentication:**
    - The `BaseNFlowService` must use the retrieved user-specific `accessToken` in the `Authorization` header for all NFlow API requests.
    - The existing `refreshToken` logic within `BaseNFlowService` might need to be re-evaluated or adapted, as token refresh will now be tied to the user's Keycloak session rather than a global NFlow refresh token.
3.  **Context Propagation:**
    - The `userId` (or a similar identifier) must be available in the context where `BaseNFlowService` is used, so it can fetch the correct user session.
4.  **Error Handling:**
    - If a user's `accessToken` is not found or is invalid, appropriate error handling must be implemented.
    - If an NFlow API call fails due to an expired or invalid user token, the system should attempt to use the Keycloak `refreshToken` (if available in the user's session) to obtain a new `accessToken` and retry the request.
5.  **Security Considerations:**
    - Ensure that the process of retrieving and using user tokens is secure and does not expose tokens unnecessarily.
    - Consider the implications of session expiration and token lifecycle management.

## 6. Non-Functional Requirements

1.  **Performance:**
    - The token retrieval process should not introduce significant latency to API requests. Accessing Redis is generally fast, but this should be monitored.
2.  **Scalability:**
    - The solution should scale with an increasing number of users and API requests.
3.  **Maintainability:**
    - The changes should be well-documented and easy to understand and maintain.
4.  **Testability:**
    - The new token retrieval and usage logic should be unit-testable.

## 7. Out of Scope

- Changes to the Keycloak authentication flow itself (login, logout, initial token issuance).
- Modifications to the NFlow API.
- Implementing user-level permissions within the NFlow API (this feature assumes the NFlow API can handle user-specific tokens for its own authorization logic).

## 8. Success Metrics

- All NFlow API calls successfully use user-specific access tokens.
- No reported issues related to token retrieval or authentication failures after deployment.
- Reduction or elimination of reliance on the global `NFLOW_API_KEY` for NFlow API access.

## 9. Assumptions

- User sessions in Redis reliably contain the `accessToken` and `refreshToken` obtained from Keycloak.
- The NFlow API supports authentication via Bearer tokens that are Keycloak access tokens.
- The `userId` is consistently available in the application context where NFlow API calls are initiated.
