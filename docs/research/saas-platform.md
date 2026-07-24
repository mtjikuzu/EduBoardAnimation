# SaaS runtime, job, storage, and observability research

**Decision input:** [Evaluate SaaS runtime, queue, storage, and observability foundations](https://github.com/mtjikuzu/EduBoardAnimation/issues/5)

## Recommendation

Deploy the web/API and rendering workers as separate **container services on AWS ECS Fargate**, with PostgreSQL on RDS, S3 object storage, ElastiCache Redis, and SQS as the durable job queue. Use OpenTelemetry instrumentation and a managed error/trace backend. Run TanStack Start as a normal Node server container; do not target edge/serverless runtimes for FFmpeg/Chromium work.

The separation gives the web application low-latency request capacity while render workers scale independently, retain retryable jobs, and can have the filesystem, codecs, fonts, CPU, and execution timeout the renderer needs. Each job must carry an idempotency key; SQS delivery is at-least-once, so the database is the job-state authority.

## Sources

- AWS, [Amazon ECS on Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) — managed container tasks.
- AWS, [Amazon SQS developer guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html) — durable asynchronous queues and delivery semantics.
- AWS, [Amazon RDS PostgreSQL guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html) — managed PostgreSQL.
- AWS, [Amazon S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) — object storage/lifecycle policies.
- OpenTelemetry, [documentation](https://opentelemetry.io/docs/) — vendor-neutral traces, metrics, and logs.
