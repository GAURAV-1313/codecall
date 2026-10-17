# Scaling and concurrency

## stateless-services

- **Name:** Stateless services and horizontal scaling
- **Requires:** none
- **Signals:** `MemoryStore`, `connect-redis`, `SESSION_ENGINE`, `sticky sessions`, `replicas:`, `HorizontalPodAutoscaler`
- **Idea:** A stateless instance keeps nothing between requests in local memory or disk, putting sessions, uploads and caches in shared stores, so any instance can serve any request and you scale by adding copies.
- **Misconceptions:**
  - Stateless means no state anywhere; the state still exists, it just moves to a database, cache or object store that all instances share.
  - An in-process cache or rate-limit counter behaves the same with more replicas; each instance keeps its own copy, so limits multiply and caches disagree.
- **Checks:**
  - If a second instance of your service starts behind the load balancer, which variables or files in your code would give users different answers?
  - Where does your code keep sessions, uploaded files and in-memory counters, and what happens to them when an instance restarts?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.2 · 0:43](https://www.youtube.com/watch?v=sOhAopEwjH4&t=43s)
  - [The Twelve-Factor App: Processes](https://12factor.net/processes)

## load-balancing

- **Name:** Load balancing
- **Requires:** `stateless-services`
- **Signals:** `upstream backend {`, `proxy_pass`, `least_conn`, `X-Forwarded-For`, `readinessProbe`, `trust proxy`
- **Idea:** A load balancer spreads requests across healthy instances, by round robin or least connections, skipping ones that fail health checks so no single machine is overloaded or a single point of failure.
- **Misconceptions:**
  - Behind a load balancer, `req.ip` is the client's address; it is the proxy's unless you parse `X-Forwarded-For` and trust only your own proxies.
  - An endpoint that always returns 200 is a good health check; readiness should fail whenever the instance cannot serve, such as during startup or shutdown.
- **Checks:**
  - If one instance behind your load balancer becomes slow but not dead, how would your current health check and balancing policy react?
  - Does your code rely on the same client reaching the same instance twice, such as for socket state or uploads, and what breaks if it does not?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.2 · 9:11](https://www.youtube.com/watch?v=sOhAopEwjH4&t=551s)
  - [Google SRE book: Load balancing in the datacenter](https://sre.google/sre-book/load-balancing-datacenter/)

## io-vs-cpu-bound

- **Name:** IO-bound vs CPU-bound work
- **Requires:** none
- **Signals:** `worker_threads`, `ProcessPoolExecutor`, `asyncio.to_thread(`, `bcrypt.hashSync`, `GOMAXPROCS`
- **Idea:** IO-bound work spends its time waiting on networks and disks and scales with concurrency, while CPU-bound work like hashing, image resizing or parsing huge JSON needs real cores, so they need different tools.
- **Misconceptions:**
  - Marking a function `async` makes CPU-heavy work non-blocking; async only helps while waiting, and a tight loop still freezes the event loop.
  - Python threads speed up CPU-bound code; in standard CPython builds the GIL runs one thread's bytecode at a time, so use processes or native code.
- **Checks:**
  - Which step in your handler is CPU-heavy, and what happens to other users' requests on the same instance while it runs?
  - Would more concurrency or more cores make this part of your code faster, and how could you measure which one it needs?
- **Go deeper:**
  - [Sriniously · Backend from first principles #22 · 5:55](https://www.youtube.com/watch?v=bs9MEYRTA30&t=355s)
  - [Node.js: Don't block the event loop (or the worker pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

## event-loop-async

- **Name:** Event loop and async/await
- **Requires:** `io-vs-cpu-bound`
- **Signals:** `async def`, `Promise.all(`, `asyncio.gather(`, `setImmediate`, `readFileSync`, `CompletableFuture`
- **Idea:** An event loop runs many tasks on one thread by switching whenever a task awaits IO, so it handles thousands of connections cheaply as long as no task blocks the thread.
- **Misconceptions:**
  - Awaiting calls one by one in a loop runs them in parallel; each `await` waits for the previous one, so use `Promise.all` or `gather` for independent calls.
  - Calling a blocking library inside an async function is fine; synchronous drivers, `time.sleep` or `fs.readFileSync` stall every request on that loop.
- **Checks:**
  - Which awaited calls in your handler are independent of each other, and how much latency would running them concurrently save?
  - Does any library your async code calls perform blocking IO under the hood, and how would you notice it in production?
- **Go deeper:**
  - [Sriniously · Backend from first principles #22 · 37:15](https://www.youtube.com/watch?v=bs9MEYRTA30&t=2235s)
  - [Node.js: The Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)

## race-conditions

- **Name:** Race conditions and locks
- **Requires:** none
- **Signals:** `SELECT ... FOR UPDATE`, `pg_advisory_xact_lock`, `sync.Mutex`, `SET stock = stock - 1`, `WHERE version = $1`, `SET key val NX PX`
- **Idea:** A race condition happens when concurrent requests read and write the same data and the result depends on timing, so code needs atomic updates, constraints or locks to keep its invariants.
- **Misconceptions:**
  - A single-threaded runtime like Node cannot have races; any `await` between reading and writing lets another request interleave, and multiple instances race anyway.
  - An in-memory mutex protects shared data; it only covers one process, so across replicas use row locks, conditional updates or a distributed lock.
- **Checks:**
  - If two requests run the read-then-write sequence in your code at the same moment, what final value ends up in the database?
  - Could a single conditional `UPDATE ... WHERE` replace the lock in your code, and what would you gain or lose?
- **Go deeper:**
  - [Sriniously · Backend from first principles #22 · 1:15:32](https://www.youtube.com/watch?v=bs9MEYRTA30&t=4532s)
  - [PostgreSQL: Explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
