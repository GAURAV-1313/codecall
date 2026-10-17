# Observability

## structured-logging

- **Name:** Structured logging and log levels
- **Requires:** none
- **Signals:** `pino`, `structlog`, `log/slog`, `logger.info({`, `LOG_LEVEL`, `logstash-logback-encoder`
- **Idea:** Logs emitted as key-value JSON with a level, timestamp and request id can be filtered and queried in production, unlike free-text lines that someone must grep and guess at.
- **Misconceptions:**
  - More logging is always safer; logging every request body at info level costs money, buries the signal and often leaks passwords, tokens or personal data.
  - Interpolating values into the message string is structured logging; put variables in separate fields so queries can filter on `user_id` or `order_id`.
- **Checks:**
  - If this request fails in production, which fields in your log lines would let you find every line from that one request?
  - Which values logged by your code could contain secrets or personal data, and where are they redacted?
- **Go deeper:**
  - [Sriniously · Backend from first principles #18 · 18:12](https://www.youtube.com/watch?v=5PEuwgLOQQM&t=1092s)
  - [OpenTelemetry: Logs](https://opentelemetry.io/docs/concepts/signals/logs/)

## metrics-monitoring

- **Name:** Metrics and monitoring
- **Requires:** none
- **Signals:** `prom-client`, `prometheus_client`, `/metrics`, `http_requests_total`, `Micrometer`, `histogram_quantile(`
- **Idea:** Metrics are cheap numeric time series such as request rate, error rate, latency and saturation that you aggregate, graph and alert on, so you learn a service is unhealthy before users report it.
- **Misconceptions:**
  - Adding user id or full URL as a metric label is harmless; each unique value creates a new series, and high cardinality can overwhelm the metrics backend.
  - Alerting on CPU and memory covers you; alert on symptoms users feel, such as error rate and latency, and use resource metrics for diagnosis.
- **Checks:**
  - Which metric would move first if the code you just changed started failing, and is there an alert on it?
  - What labels does your code attach to this metric, and how many distinct values could each one take?
- **Go deeper:**
  - [Sriniously · Backend from first principles #18 · 3:57](https://www.youtube.com/watch?v=5PEuwgLOQQM&t=237s)
  - [Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)

## distributed-tracing

- **Name:** Distributed tracing
- **Requires:** `request-context`
- **Signals:** `traceparent`, `@opentelemetry/api`, `tracer.start_as_current_span`, `otelhttp.NewHandler`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `span.setAttribute(`
- **Idea:** Tracing gives each request a trace id that travels across services and queues, recording timed spans for every hop so you can see where a slow or failing request spent its time.
- **Misconceptions:**
  - Installing the tracing SDK traces everything; context is lost across queues, hand-rolled HTTP clients and thread pools unless `traceparent` is propagated explicitly.
  - Tracing every request in production is free; most systems sample, so a missing trace for one request does not mean the request never happened.
- **Checks:**
  - When your code enqueues a job or calls another service here, how does the current trace context get passed along?
  - If this endpoint becomes slow, which spans in your code would show whether the time goes to the database, an external API or your own logic?
- **Go deeper:**
  - [Sriniously · Backend from first principles #18 · 28:10](https://www.youtube.com/watch?v=5PEuwgLOQQM&t=1690s)
  - [OpenTelemetry: Traces](https://opentelemetry.io/docs/concepts/signals/traces/)

## latency-percentiles

- **Name:** Latency percentiles
- **Requires:** `metrics-monitoring`
- **Signals:** `histogram_quantile(0.99`, `http_request_duration_seconds`, `_bucket{le=`, `p99`, `buckets:`
- **Idea:** Percentiles like p50, p95 and p99 show how slow requests are for typical users and for the unlucky tail, which averages hide even though busy users hit that tail constantly.
- **Misconceptions:**
  - Average latency is a fine health signal; a few very slow requests barely move the mean while a real slice of users waits seconds.
  - You can average p99 values across instances; percentiles do not combine that way, so compute them from merged histogram buckets instead.
- **Checks:**
  - When your code fans out to several services per request, how does the slowest call's tail latency shape the latency of the whole request?
  - Do the histogram buckets in your code have enough resolution around your latency target to tell 300 ms from 900 ms?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 8:00](https://www.youtube.com/watch?v=z7kt_p44rjs&t=480s)
  - [Prometheus: Histograms and summaries](https://prometheus.io/docs/practices/histograms/)
