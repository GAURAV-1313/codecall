# Request flow and layering

## middleware-pipeline

- **Name:** Middleware pipeline
- **Requires:** `http-messages`
- **Signals:** `app.use(`, `next()`, `MIDDLEWARE = [`, `func(next http.Handler)`, `@app.middleware("http")`, `OncePerRequestFilter`
- **Idea:** Middleware are functions wrapped around every handler in a fixed order, handling cross-cutting work like logging, auth, parsing and error handling once instead of in each route.
- **Misconceptions:**
  - Middleware order is cosmetic; auth after the router, or the error handler registered first, silently changes what runs and what is protected.
  - A middleware that forgets to call `next()` just skips itself; the request hangs or ends there without reaching the handler.
- **Checks:**
  - In your app, does the body parser or auth middleware run before the route that needs it, and what happens if the order flips?
  - If a handler throws, which middleware in your chain turns it into a response, and does logging still record the request?
- **Go deeper:**
  - [Sriniously · Backend from first principles #10 · 26:52](https://www.youtube.com/watch?v=hyc-7w3pee8&t=1612s)
  - [Microsoft Learn: ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)

## request-context

- **Name:** Request context
- **Requires:** `middleware-pipeline`
- **Signals:** `context.Context`, `r.Context()`, `res.locals`, `req.user`, `AsyncLocalStorage`, `contextvars`
- **Idea:** Request context carries per-request data such as user, request id and deadline through middleware and layers, and lets cancellation stop downstream work when the client disconnects.
- **Misconceptions:**
  - Storing the current user in a module-level variable works; concurrent requests overwrite each other and one user sees another's data.
  - Context is a bag for any parameter; it suits request-scoped metadata, while required business inputs belong in explicit arguments.
- **Checks:**
  - If the client disconnects mid-request, does your code pass the context or signal into the database call so the query is cancelled?
  - How does the request id set in your middleware reach the log lines your service and repository write?
- **Go deeper:**
  - [Sriniously · Backend from first principles #10 · 50:57](https://www.youtube.com/watch?v=hyc-7w3pee8&t=3057s)
  - [Go blog: Go Concurrency Patterns: Context](https://go.dev/blog/context)

## handler-service-repository

- **Name:** Handler, service and repository layers
- **Requires:** `routing-params`
- **Signals:** `controllers/`, `services/`, `repositories/`, `@Service`, `@Repository`, `UserRepository`
- **Idea:** Handlers translate HTTP, services hold business rules, and repositories hide storage, so each layer changes for one reason and logic can run without HTTP or a database.
- **Misconceptions:**
  - Layers are bureaucracy for small apps; even a thin service keeps rules out of handlers so a job or CLI can reuse them.
  - Services can return HTTP status codes or take `req`; that leaks transport into business logic and blocks reuse.
- **Checks:**
  - Which business rule in your handler would have to be copied if a background job needed the same behavior?
  - Does your repository return database rows or domain objects, and what breaks in callers if a column is renamed?
- **Go deeper:**
  - [Sriniously · Backend from first principles #10 · 18:23](https://www.youtube.com/watch?v=hyc-7w3pee8&t=1103s)
  - [Martin Fowler: Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html)

## dependency-injection

- **Name:** Dependency injection and a testable core
- **Requires:** `handler-service-repository`
- **Signals:** `constructor(private readonly`, `Depends(`, `@Autowired`, `@Injectable()`, `NewUserService(repo`, `wire.Build(`
- **Idea:** A component receives its collaborators (database, clock, HTTP client) from outside instead of creating them, so tests and other environments can swap in fakes without editing the code.
- **Misconceptions:**
  - Dependency injection requires a framework or container; passing dependencies as constructor or function arguments is the whole idea.
  - Mocking imports with patching is equivalent; it couples tests to file layout and hides how many dependencies a component really has.
- **Checks:**
  - To unit test your service without a real database, what would you pass in, and does your code currently allow that?
  - Where does your code call `new`, a global client, or the current time directly, and how would that make a test flaky?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 37:24](https://www.youtube.com/watch?v=HgVrfHX92y4&t=2244s)
  - [Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
