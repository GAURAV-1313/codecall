# Errors and reliability

## error-handling-global

- **Name:** Centralized error handling
- **Requires:** `middleware-pipeline`
- **Signals:** `app.use((err, req, res, next)`, `setErrorHandler`, `@ControllerAdvice`, `@app.exception_handler`, `rescue_from`, `application/problem+json`
- **Idea:** One error-handling layer at the edge of the app turns any thrown error into a consistent, safe HTTP response and a log entry, so handlers do not each reinvent status codes and leak internals.
- **Misconceptions:**
  - Sending `err.message` or the stack trace to the client helps debugging; it leaks internals, so return a generic message with a request id and log details server-side.
  - Every error should become a 500; validation, not-found and conflict errors are expected outcomes and deserve their own 4xx codes.
- **Checks:**
  - If an async function in your handler rejects without a try/catch, does the error reach your central handler, or does the request hang or the process crash?
  - How does your error handler decide between a 4xx and a 500, and what does it log for each?
- **Go deeper:**
  - [Sriniously · Backend from first principles #16 · 41:48](https://www.youtube.com/watch?v=8NaM_9aKS24&t=2508s)
  - [OWASP Cheat Sheet Series: Error handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

## timeouts-external-calls

- **Name:** Timeouts on external calls
- **Requires:** none
- **Signals:** `AbortSignal.timeout(`, `requests.get(url, timeout=`, `context.WithTimeout`, `http.Client{Timeout:`, `statement_timeout`, `connectTimeout`
- **Idea:** Every network call to a database, API or cache needs an explicit time limit, because without one a slow dependency holds threads, connections and memory until your own service stops responding.
- **Misconceptions:**
  - HTTP clients ship with sensible timeouts; Python `requests` and Go's default `http.Client` wait forever, and Node `fetch` waits minutes before giving up.
  - A timeout means the remote operation failed; it may have succeeded after you gave up, so blindly retrying a non-idempotent call can apply it twice.
- **Checks:**
  - What is the total time budget for this request in your code, and do the timeouts on each downstream call fit inside it?
  - When this external call times out in your code, what does the user see, and is it safe to retry?
- **Go deeper:**
  - [Sriniously · Backend from first principles #16 · 10:40](https://www.youtube.com/watch?v=8NaM_9aKS24&t=640s)
  - [Google SRE book: Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/)

## retries-backoff-jitter

- **Name:** Retries with backoff and jitter
- **Requires:** `timeouts-external-calls`, `idempotency-keys`
- **Signals:** `Retry-After`, `p-retry`, `tenacity`, `@Retryable`, `maxAttempts`, `2 ** attempt`
- **Idea:** Retrying transient failures after exponentially growing, randomized delays lets a call recover from blips without a synchronized storm of retries overwhelming a dependency that is already struggling.
- **Misconceptions:**
  - Any error is worth retrying; 400s, auth failures and validation errors fail identically every time, so retry only timeouts, connection errors, 429 and selected 5xx.
  - Retrying at every layer adds safety; three layers with three attempts each multiply into 27 calls against a dependency that is already failing.
- **Checks:**
  - Is the operation your code retries idempotent, and if not, what stops a retry after a timeout from doing it twice?
  - What is the worst-case total time your retry loop can spend, including backoff, and does it fit inside the caller's timeout?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 34:31](https://www.youtube.com/watch?v=eWM0CVReP04&t=2071s)
  - [AWS SDKs and Tools: Retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)

## graceful-shutdown

- **Name:** Graceful shutdown and connection draining
- **Requires:** none
- **Signals:** `SIGTERM`, `server.close(`, `srv.Shutdown(ctx)`, `terminationGracePeriodSeconds`, `preStop`, `server.shutdown=graceful`
- **Idea:** On SIGTERM a service should stop accepting new work, let in-flight requests and jobs finish, close pools cleanly, then exit, so deploys and scale-downs do not drop requests or corrupt half-done work.
- **Misconceptions:**
  - Shutdown needs no code; without a SIGTERM handler most runtimes exit instantly, and a process running as container PID 1 may ignore the signal until SIGKILL.
  - Closing the server is enough; the load balancer may keep routing new requests for a few seconds, so fail readiness first and keep serving briefly.
- **Checks:**
  - What happens to a request your code is halfway through when the container receives SIGTERM during a deploy?
  - Does your shutdown path finish within the platform's grace period, and what is left undone if it gets killed early?
- **Go deeper:**
  - [Sriniously · Backend from first principles #19 · 8:49](https://www.youtube.com/watch?v=6rfBgphiCWM&t=529s)
  - [Kubernetes: Pod lifecycle, termination of Pods](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)
