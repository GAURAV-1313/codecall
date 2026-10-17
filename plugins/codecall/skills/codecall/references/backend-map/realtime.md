# Real-time

## polling-long-polling

- **Name:** Polling and long polling
- **Requires:** `http-messages`
- **Signals:** `setInterval(`, `refetchInterval`, `?since=`, `WaitTimeSeconds`, `204 No Content`
- **Idea:** Polling asks the server for updates on a timer, while long polling holds each request open until data arrives or a timeout passes, giving near-real-time updates over plain HTTP.
- **Misconceptions:**
  - Short polling every second is harmless; with many clients most requests return nothing yet still cost auth checks, database queries and connections.
  - A long-poll request can stay open indefinitely; proxies and load balancers cut idle connections, so respond within their timeout and let the client reconnect.
- **Checks:**
  - If the client misses a response from your polling endpoint, how does your code let it resume without losing or duplicating updates?
  - How many requests per minute will your polling interval produce at your expected number of open clients, and what does each one cost?
- **Go deeper:**
  - [Sriniously · Backend from first principles #25 · 2:26](https://www.youtube.com/watch?v=wUQryt697cs&t=146s)
  - [IETF: RFC 6202, Long polling and streaming in bidirectional HTTP](https://datatracker.ietf.org/doc/html/rfc6202)

## server-sent-events

- **Name:** Server-sent events
- **Requires:** `polling-long-polling`
- **Signals:** `text/event-stream`, `EventSource`, `Last-Event-ID`, `StreamingResponse`, `SseEmitter`, `retry:`
- **Idea:** Server-sent events stream one-way updates from server to browser over a long-lived HTTP response, with built-in reconnection and resume via event ids, which suits feeds, notifications and LLM token streaming.
- **Misconceptions:**
  - SSE needs WebSockets underneath; it is a plain HTTP response with `text/event-stream`, so it works through most proxies and over HTTP/2 without a protocol upgrade.
  - Events reach the client as soon as you write them; compression or proxy buffering can hold them back unless you flush and disable buffering, for example `X-Accel-Buffering: no`.
- **Checks:**
  - When a client reconnects with `Last-Event-ID`, how does your code replay the events it missed?
  - How does your code notice that a client disconnected and stop the work and timers feeding that stream?
- **Go deeper:**
  - [Sriniously · Backend from first principles #25 · 11:57](https://www.youtube.com/watch?v=wUQryt697cs&t=717s)
  - [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

## websockets

- **Name:** WebSockets
- **Requires:** `polling-long-polling`
- **Signals:** `new WebSocket(`, `Upgrade: websocket`, `socket.io`, `ws.on('message'`, `websocket.accept()`, `gorilla/websocket`
- **Idea:** A WebSocket upgrades one HTTP request into a persistent, full-duplex connection where client and server send messages anytime, suiting chat, collaboration and games but requiring you to manage connection state.
- **Misconceptions:**
  - CORS protects WebSocket endpoints like it protects fetch; browsers do not apply it to the handshake, so your server must check `Origin` and authenticate the connection itself.
  - A connection stays open until someone closes it; NATs and proxies silently drop idle sockets, so use ping/pong heartbeats and client reconnection with backoff.
- **Checks:**
  - When a client reconnects after a network drop, how does your code recover the messages sent while it was offline?
  - What does your code do when a client stops reading and outgoing messages pile up in that socket's buffer?
- **Go deeper:**
  - [Sriniously · Backend from first principles #25 · 19:21](https://www.youtube.com/watch?v=wUQryt697cs&t=1161s)
  - [MDN: The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## pub-sub-fanout

- **Name:** Pub/sub fan-out across instances
- **Requires:** `websockets`, `stateless-services`
- **Signals:** `redis.publish(`, `@socket.io/redis-adapter`, `CHANNEL_LAYERS`, `pg_notify(`, `XADD`
- **Idea:** When clients are spread across many server instances, each instance subscribes to a shared broker channel so an event published once reaches every instance and its locally connected sockets.
- **Misconceptions:**
  - Broadcasting to your in-memory connection list reaches all users; once you run more than one replica, it only reaches sockets on that instance.
  - Redis Pub/Sub keeps messages for subscribers that are briefly offline; it is at-most-once, so use Streams or a durable log when missed messages matter.
- **Checks:**
  - If the instance holding a user's socket restarts while an event is published, how does your code make sure that user still sees it?
  - How does your code avoid sending every event to every instance when only a few hold interested subscribers?
- **Go deeper:**
  - [Sriniously · Backend from first principles #25 · 40:51](https://www.youtube.com/watch?v=wUQryt697cs&t=2451s)
  - [Redis: Redis Pub/sub](https://redis.io/docs/latest/develop/pubsub/)
