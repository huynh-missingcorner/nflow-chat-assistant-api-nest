# PRD: Keycloak SSO Integration for Nflow API

## 1. Introduction

This document outlines the requirements for integrating Keycloak Single Sign-On (SSO) into our web application. The primary goal is to automate the retrieval and management of Nflow API access tokens, eliminating the current manual process and enhancing security and scalability.

## 2. Goals

- **Automate Token Retrieval:** Eliminate the need for developers to manually log into the Nflow UI, copy access tokens, and paste them into the application's `.env` file.
- **Seamless User Experience:** Allow users to log in once via Keycloak and seamlessly call the Nflow API from the application without further manual intervention for token management.
- **Enhanced Security:** Securely handle access tokens and refresh tokens, minimizing exposure and adhering to best practices for OAuth2.
- **Scalability:** Provide a robust authentication mechanism that supports production environments and a growing user base.
- **Maintainability:** Implement a solution that is easy to maintain and troubleshoot.

## 3. Target Users

- **Developers:** Will benefit from a streamlined development workflow without manual token handling.
- **Application Users:** Will experience a smoother login process and uninterrupted access to Nflow API-dependent features.

## 4. User Stories

- **As a developer, I want the application to automatically obtain an Nflow API token after I log in via Keycloak, so I don't have to manually copy and paste tokens.**
- **As an application user, I want to log in once using my Keycloak credentials and have the application manage Nflow API access transparently.**
- **As an administrator, I want the token handling mechanism to be secure and follow industry best practices to protect sensitive API access.**
- **As a developer, I want the system to automatically refresh expired Nflow API tokens, so API calls continue to work without interruption.**

## 5. Requirements

### 5.1. Functional Requirements

- **FR1: Keycloak OAuth2 Integration:** The system must integrate with Keycloak using the OAuth2 Authorization Code Flow.
- **FR2: User Authentication:** Users must be able to initiate login via the application, be redirected to Keycloak for authentication, and then redirected back to the application.
- **FR3: Authorization Grant:** Upon successful authentication, Keycloak will provide an authorization code to the application.
- **FR4: Token Exchange:** The application backend must exchange the authorization code for an access token and a refresh token (if configured and available) from Keycloak.
- **FR5: Secure Token Storage:** Access tokens and refresh tokens must be stored securely.
  - Access tokens can be stored in a secure, HTTP-only cookie or server-side session.
  - Refresh tokens (if used) must be stored securely, preferably encrypted, and accessible only by the backend.
- **FR6: API Call Authentication:** Backend services must use the retrieved access token to authenticate requests to the Nflow API.
- **FR7: Token Refresh:** The system must automatically use the refresh token to obtain a new access token when the current one is about to expire or has expired. This should be transparent to the user.
- **FR8: Logout:** Users must be able to log out of the application, which should invalidate the local session/token and ideally trigger a logout from Keycloak (single logout if feasible).
- **FR9: HTTPS Communication:** All communication with Keycloak and the Nflow API must be over HTTPS.

### 5.2. Non-Functional Requirements

- **NFR1: Security:**
  - Prevent CSRF attacks (e.g., using `state` parameter).
  - Prevent token leakage (e.g., by not exposing tokens to the frontend JavaScript directly if possible).
  - Regularly review and update security configurations.
- **NFR2: Performance:** The authentication process should not introduce significant latency to the user login experience. Token refresh should be efficient.
- **NFR3: Reliability:** The authentication system must be reliable and handle transient network issues or Keycloak unavailability gracefully (e.g., with appropriate error messages or retry mechanisms).
- **NFR4: Usability:** The login process should be intuitive for users.
- **NFR5: Configurability:** Keycloak client ID, client secret, realm, and URLs should be configurable through environment variables.

## 6. Assumptions

- The Nflow API is already configured to use Keycloak for authentication.
- The web application has backend capabilities to handle the OAuth2 flow.
- HTTPS is enforced for the application, Keycloak, and Nflow API.

## 7. Scope

### 7.1. In Scope

- Implementation of Keycloak OAuth2 Authorization Code Flow.
- Frontend components for initiating login and handling redirects.
- Backend endpoints for OAuth2 callback, token exchange, token refresh, and logout.
- Secure storage of tokens.
- Integration with existing Nflow API client to use the managed access token.
- Basic error handling and user feedback for authentication failures.

### 7.2. Out of Scope

- Keycloak server setup and administration (assumed to be existing and managed).
- Advanced Keycloak features beyond standard OAuth2 Authorization Code Flow unless explicitly required.
- User provisioning or synchronization with Keycloak (users are assumed to exist in Keycloak).
- Modifications to the Nflow API or Nflow UI.

## 8. Success Metrics

- **SM1:** 100% elimination of manual token copying for developers and users.
- **SM2:** Successful login and Nflow API access via Keycloak for 99.9% of attempts.
- **SM3:** No security incidents related to token handling post-implementation.
- **SM4:** Positive feedback from developers regarding the ease of use and improved workflow.

## 9. Future Considerations

- Single Logout (SLO) implementation for a more comprehensive logout experience.
- Support for other OAuth2 flows if needed in the future.
- More granular role-based access control based on Keycloak roles/groups.

## 10. Open Questions

- What is the exact Nflow API endpoint for token validation or introspection, if needed?
- Are there any specific Nflow API rate limits for token-related operations we need to be aware of?
- What is the preferred method for storing refresh tokens securely on the backend? (e.g., encrypted in database, secure vault)

---
