# VoltFlow remediation status

This archive contains a focused first pass based on the supplied audit. It is not a claim that every audit item is complete.

## Implemented in this pass
- Removed the customer `POST /api/sessions/{id}/refund` controller endpoint and the matching frontend API method. The admin refund route remains the intended path.
- Prevented paying a session whose status or payment status is `REFUNDED`.
- Configured Spring Security's authentication entry point to return HTTP 401 for unauthenticated requests.
- Added a frontend unauthorized event so a 401 with an existing token clears auth state and redirects to `/login`.
- Capped calculated session energy to the vehicle battery capacity when that capacity is present and positive.
- Added a four-hour stale-session watchdog. It stops abandoned sessions and records a system audit action.
- Added a cumulative `meter_reading_kwh` field to chargers through a new Flyway migration V8; session starts use the charger's current meter and stops update it.
- Reworked the PowerShell backup to write the dump inside the container and copy the raw file bytes to Windows, avoiding PowerShell UTF-16 redirection.
- Set production `server.error.include-message` to `never`.
- Changed JWT secret encoding to UTF-8 explicitly.
- Added a non-root user to the backend runtime image.
- Made the development Vite API URL a build argument instead of a runtime environment variable.
- Added a dedicated HTTP 200 `/healthz` endpoint for the production gateway health check and repeated security headers in the static asset location.
- Pinned the production MySQL image to `mysql:8.0.44`.
- Added an MIT `LICENSE`, replaced the frontend Vite template README, and removed timestamped duplicate audit screenshots.

## Still requires work before calling this production-ready
- Add rate limiting for login and registration.
- Upgrade Spring Boot and JJWT to compatible maintained versions, then run the full backend suite.
- Pin all base images, including Nginx and Node, to reviewed immutable versions/digests.
- Review and test production TLS/certificate environment configuration.
- Add bounded pagination to customer session and wallet transaction endpoints.
- Replace `double` in all simulation/billing paths with `BigDecimal` and add regression tests.
- Introduce precise conflict/domain exceptions (e.g. HTTP 409 for an occupied charger).
- Remove duplicate role/ownership helper logic.
- Fetch the real user immediately after login/register rather than temporarily using `id: 0`.
- Lazy-load customer pages; add an error boundary/toast handling; add React tests for protected routes, login, and 401 behavior.
- Add `buildQuery()` in the API client, typecheck-only CI, Docker build CI, dependency auditing, `.editorconfig`, pre-commit checks, and README/CI test-count reconciliation.
- Review all seed/demo credentials and deployment secrets manually before any production use.

## Validation limitation
This environment did not have Maven installed. An `npm ci` attempt did not finish within the available execution window. Therefore no claim is made that backend tests, frontend tests, lint, builds, or Docker builds passed after these changes. Run the project's documented checks locally before committing or pushing.
