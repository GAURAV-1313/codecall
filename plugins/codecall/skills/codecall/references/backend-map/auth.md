# Authentication and authorization

## session-auth

- **Name:** Session-based authentication
- **Requires:** `http-messages`
- **Signals:** `express-session`, `req.session`, `SESSION_ENGINE`, `connect-redis`, `session_id` cookie, `regenerate(`
- **Idea:** After login the server stores session state and gives the browser an opaque random id in a cookie, so each request is authenticated by looking that id up server-side.
- **Misconceptions:**
  - Keeping the same session id after login is fine; it enables session fixation, so regenerate the id whenever privilege changes.
  - In-memory session stores work in production; they vanish on restart and are not shared across instances behind a load balancer.
- **Checks:**
  - When a user logs out or changes their password, which line in your code destroys the server-side session, and do other sessions survive?
  - With two instances of your app behind a load balancer, where do sessions live and does a request reaching the other instance still work?
- **Go deeper:**
  - [Sriniously · Backend from first principles #8 · 18:26](https://www.youtube.com/watch?v=A95rliroC8Q&t=1106s)
  - [OWASP Cheat Sheet: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## cookie-security

- **Name:** Cookie security attributes
- **Requires:** `session-auth`
- **Signals:** `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-`, `res.cookie(`, `SESSION_COOKIE_SECURE`
- **Idea:** Cookie attributes control who can read a cookie and when browsers send it, limiting theft by scripts, exposure over plain HTTP and cross-site request forgery.
- **Misconceptions:**
  - `HttpOnly` stops XSS; it only hides the cookie from JavaScript, while injected script can still send requests as the user.
  - `SameSite=Lax` replaces all CSRF defenses; state-changing GET requests and same-site subdomains still need protection.
- **Checks:**
  - Which attributes does your code set on the session cookie, and what could a script injected into your page do with it?
  - If your frontend and API live on different sites, which `SameSite` value does your cookie need, and what CSRF defense must replace it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 1:07:17](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=4037s)
  - [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)

## jwt-auth

- **Name:** JWTs and stateless authentication
- **Requires:** `http-messages`
- **Signals:** `Authorization: Bearer`, `jwt.verify(`, `jsonwebtoken`, `PyJWT`, `golang-jwt`, `exp` claim
- **Idea:** A JWT is a signed token carrying claims the server verifies with a key instead of a database lookup, trading easy horizontal scaling for harder revocation.
- **Misconceptions:**
  - JWT payloads are encrypted; they are only base64url-encoded and signed, so anyone holding the token can read the claims.
  - Logging out deletes the token; a stolen JWT stays valid until `exp` unless you keep short lifetimes or a denylist.
- **Checks:**
  - Does your verification pin the expected algorithm and check `exp`, `iss` and `aud`, or does it trust whatever the token header says?
  - If an account is disabled right now, how long can an already-issued token keep calling your API, and is that acceptable?
- **Go deeper:**
  - [Sriniously · Backend from first principles #8 · 25:40](https://www.youtube.com/watch?v=A95rliroC8Q&t=1540s)
  - [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725)

## oauth2-oidc

- **Name:** OAuth 2.0 and OpenID Connect
- **Requires:** `jwt-auth`
- **Signals:** `/oauth/authorize`, `code_challenge`, `redirect_uri`, `id_token`, `openid profile email`, `passport-google-oauth20`
- **Idea:** OAuth 2.0 lets an app obtain scoped access tokens without seeing the user's password, and OpenID Connect adds an ID token so the app also learns who signed in.
- **Misconceptions:**
  - OAuth is an authentication protocol; it grants access, and using an access token as proof of identity is unsafe without OIDC's ID token.
  - PKCE is only for mobile apps; current best practice recommends it for every authorization code flow, including server-side apps.
- **Checks:**
  - In your callback handler, which checks verify `state`, the ID token signature, `aud` and `nonce` before you create a local session?
  - Which scopes does your code request, and what could an attacker do if the stored provider token leaked?
- **Go deeper:**
  - [Sriniously · Backend from first principles #8 · 50:25](https://www.youtube.com/watch?v=A95rliroC8Q&t=3025s)
  - [OAuth.net: OAuth 2.0](https://oauth.net/2/)

## password-hashing

- **Name:** Password hashing
- **Requires:** none
- **Signals:** `argon2id`, `bcrypt.hash(`, `scrypt`, `PBKDF2`, `password_hash`, `check_password(`
- **Idea:** Passwords are stored as slow, salted one-way hashes, so a leaked database cannot be reversed cheaply and identical passwords produce different hashes.
- **Misconceptions:**
  - SHA-256 with a salt is enough; fast hashes allow billions of guesses per second, so use Argon2id, scrypt or bcrypt.
  - Encrypting passwords is safer than hashing; anyone holding the key decrypts every password, while hashes cannot be reversed.
- **Checks:**
  - What work factor does your code use, and how would you upgrade old hashes when users next log in?
  - Does your login handler take the same time and return the same error for an unknown email and a wrong password?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 45:25](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=2725s)
  - [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## rbac-authorization

- **Name:** Role-based authorization
- **Requires:** `session-auth`
- **Signals:** `@PreAuthorize`, `hasRole(`, `requireRole(`, `user.role ===`, `permission_required`, `WHERE owner_id =`
- **Idea:** Authorization decides what an authenticated user may do, typically by mapping roles to permissions and checking both the action and ownership of the specific resource on the server.
- **Misconceptions:**
  - Hiding a button in the UI enforces permissions; the API must check every request because anyone can call it directly.
  - A role check is enough; without verifying the user owns the record, changing an id in the URL exposes other users' data.
- **Checks:**
  - If a regular user changes the id in this request to someone else's record, which line in your code stops them?
  - Your code checks `role === "admin"` in several handlers; how would you add a new role without editing each of them?
- **Go deeper:**
  - [Sriniously · Backend from first principles #8 · 1:19:10](https://www.youtube.com/watch?v=A95rliroC8Q&t=4750s)
  - [OWASP Cheat Sheet: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
