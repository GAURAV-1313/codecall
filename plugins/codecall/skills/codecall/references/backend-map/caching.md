# Caching

## cache-aside

- **Name:** Cache-aside pattern
- **Requires:** none
- **Signals:** `redis.get(` then `redis.set(`, `cache.get_or_set(`, `@Cacheable`, `SETEX`, `if cached == nil`
- **Idea:** The application checks the cache first, and on a miss reads the database and stores the result, so repeated reads skip the slow store while the database stays the source of truth.
- **Misconceptions:**
  - A cache miss is harmless; when a hot key expires, many requests miss together and stampede the database unless one request refills it.
  - The cache is always available; if it is down or slow, your code should fall back to the database rather than fail the request.
- **Checks:**
  - If the cached key for this endpoint expires during peak traffic, how many requests in your code hit the database at once to rebuild it?
  - What does your handler do when the cache call times out, and does that turn a cache outage into a full outage?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 1:17:35](https://www.youtube.com/watch?v=z7kt_p44rjs&t=4655s)
  - [Microsoft Learn: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## cache-invalidation

- **Name:** Cache invalidation
- **Requires:** `cache-aside`
- **Signals:** `redis.del(`, `cache.delete(`, `@CacheEvict`, `revalidateTag(`, `user:${id}` cache keys, `PUBLISH` invalidation event
- **Idea:** When the underlying data changes, cached copies must be deleted or updated, otherwise readers keep getting the old value until it happens to expire.
- **Misconceptions:**
  - Deleting the key before the database write is safe; a concurrent reader can refill the old value in between, so update first, then delete.
  - Invalidating one key is enough; lists, counts and aggregates that include the changed row are cached under other keys too.
- **Checks:**
  - After your code updates this record, which cached keys still contain the old value, including lists or summaries that embed it?
  - If the database write succeeds but your cache delete fails, how long does stale data survive, and what bounds it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 1:17:35](https://www.youtube.com/watch?v=z7kt_p44rjs&t=4655s)
  - [Microsoft Learn: Caching guidance](https://learn.microsoft.com/en-us/azure/architecture/best-practices/caching)

## cache-eviction-ttl

- **Name:** Eviction policies and TTLs
- **Requires:** `cache-aside`
- **Signals:** `EX 300`, `EXPIRE`, `maxmemory-policy`, `allkeys-lru`, `ttl=`, `lru-cache`
- **Idea:** A TTL bounds how stale an entry can get, while an eviction policy decides what to drop when memory fills, together keeping the cache fresh and within its size.
- **Misconceptions:**
  - A longer TTL is always better; it raises the hit rate but also how long users see outdated data after a change.
  - Unbounded in-process caches are fine; without a size limit they grow until the process runs out of memory.
- **Checks:**
  - How stale can the data your code caches safely be, and does the TTL you chose match that rather than a round number?
  - If many keys in your code share one TTL and were written together, what happens to the database when they all expire at once?
- **Go deeper:**
  - [Sriniously · Backend from first principles #13 · 42:48](https://www.youtube.com/watch?v=estH64OkwxU&t=2568s)
  - [Redis docs: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)

## cdn-edge-caching

- **Name:** CDNs and edge caching
- **Requires:** `http-caching-headers`
- **Signals:** `Cache-Control: public, s-maxage=`, `Surrogate-Key`, `CDN-Cache-Control`, `Vary`, `CF-Cache-Status`, purge API call
- **Idea:** A CDN keeps copies of responses at servers near users, cutting latency and origin load, with your cache headers deciding what is shared and for how long.
- **Misconceptions:**
  - Only static files belong on a CDN; public API responses can be edge-cached too with short `s-maxage` and stale-while-revalidate.
  - Marking a response `public` is harmless; if it is personalized and the cache key ignores the cookie, the CDN serves one user's data to others.
- **Checks:**
  - Does any response your code marks cacheable depend on the cookie, auth header or language, and how does the CDN key keep users apart?
  - After your code updates content, how does the edge copy get refreshed: by TTL expiry, a purge call or a versioned URL?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.2 · 51:22](https://www.youtube.com/watch?v=sOhAopEwjH4&t=3082s)
  - [Cloudflare docs: Origin Cache Control](https://developers.cloudflare.com/cache/concepts/cache-control/)
