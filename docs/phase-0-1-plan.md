# EduWhiteboard Phase 0–1 implementation plan

## Objective

Ship an invite-only, US-paid B2C beta for 50–100 adult English-speaking educational creators. A creator can create a 3–8 minute secondary-school lesson from chat, inspect and revise its storyboard, approve an estimated render-credit cost, obtain a canonical 16:9 1080p MP4 with captions, and explicitly publish it to YouTube.

## Fixed decisions

- **Hosting:** TanStack Start web/API on ECS Fargate; separate Fargate render workers; RDS PostgreSQL, S3, Redis, SQS, KMS/Secrets Manager, and OpenTelemetry.
- **Generation:** OpenAI Structured Outputs for lesson/storyboard generation and ElevenLabs timestamped English TTS, both behind provider ports and Zod validation.
- **Rendering:** deterministic storyboard → SVG/HTML timeline → pinned Chromium frames → FFmpeg scene MP4/assembly. Rough.js, MathJax, curated assets; no freeform canvas or AI illustration generation.
- **Commerce:** Clerk authentication, Stripe Checkout/Billing, and a first-party immutable render-credit ledger. Paid beta is US-only; global visitors may join the waitlist.
- **Publishing:** creator-approved YouTube OAuth upload with the least-privilege upload scope, encrypted revocable refresh tokens, private default visibility, quota-aware worker, and processing reconciliation.

## Phased backlog

### Phase 0 — foundations

1. Replace the prototype workspace with a TanStack Start application and shared TypeScript packages for domain schemas, database access, worker contracts, and UI.
2. Define Zod schemas and database migrations for Creator, LessonProject, StoryboardRevision, Scene, Asset, Generation, RenderJob, RenderArtifact, YouTubeConnection, PublishJob, CreditLedgerEntry, and AuditEvent.
3. Provision infrastructure-as-code for dev/staging/production and a pinned renderer image; establish secret handling, migrations, backups, S3 lifecycle rules, CI license/SBOM checks, and OpenTelemetry.
4. Implement Clerk session boundary, creator ownership authorization, project CRUD, hard-delete workflow, retention policy execution, and audit logging.

**Exit:** a creator can sign in, create/private-delete a project, and no cross-creator read/write path exists in integration tests.

### Phase 1A — storyboard and approval

1. Build chat brief capture, OpenAI planner adapter, strict Zod parsing/repair policy, calculation-check hook, and safety-policy gate.
2. Persist immutable storyboard revisions and expose the guided scene-card editor: narration, element values, ordering, duration, validation state, and revision chat.
3. Implement preview/credit-estimate state and final-render approval that atomically creates a credit hold and an idempotent render job.

**Exit:** a valid FIFO/AVCO example produces an editable storyboard; invalid schema or calculation results never enter a render queue; approval shows cost before a hold.

### Phase 1B — media pipeline

1. Build curated asset registry/provenance checks, Rough.js normalizer, MathJax equation/table rendering, and fixed style versioning.
2. Build SVG timeline compilation, Chromium frame capture, ElevenLabs narration/alignment, caption generation, FFmpeg scene encoding, assembly, thumbnail, artifact storage, and A/V duration checks.
3. Implement content-hash cache keys and scene-only invalidation; expose truthful queued/running/failed/succeeded progress with retry and credit-release rules.

**Exit:** a 3–8 minute approved lesson yields a captioned canonical MP4; repeating it is a cache hit; changing one scene only rerenders that scene and master assembly.

### Phase 1C — publishing, billing, and beta operations

1. Add Stripe Checkout/webhooks and immutable credit-ledger operations; protect webhook endpoints and reconcile payment events.
2. Add Google OAuth/YouTube connection, explicit metadata/visibility review, resumable quota-aware upload, processing polling, revocation, and publish audit events.
3. Complete Terms, Privacy Policy, consent copy, Google verification materials, support workflows, abuse/suspension/appeal tools, status page, budget alarms, and invite/waitlist flow.

**Exit:** a test creator can buy credits, render, explicitly upload a private video, revoke access, and receive actionable errors for failed payment/render/upload paths.

## Acceptance and beta scorecard

### Functional acceptance

- Every project, object, job, export, token, and credit entry is creator-scoped and authorization tested.
- Storyboard is the sole render input; all provider output is schema validated; calculation flags require acknowledgement.
- Every final scene conforms to a fixed 1080p/30fps/H.264/AAC media contract; assembled duration and A/V drift are automatically checked.
- Upload never happens without an approved export and an immediately preceding creator action; private is the default.
- Credit debits are idempotent, explainable, reversible on failed work, and zero for cache hits.

### Measured beta gates

- Storyboard draft p95 ≤90 seconds; first preview p95 ≤2 minutes.
- Approved 3–8 minute export median ≤10 minutes and p95 ≤15 minutes.
- Changed-scene revision p95 ≤3 minutes, including assembly.
- At least 90% of beta storyboards need only minor creator correction, measured using a pre-defined correction taxonomy.
- At least 95% of completed render jobs have a terminal status and a creator-actionable failure/retry outcome.
- No confirmed cross-creator data exposure, unaccounted credit mutation, or unrevocable stored YouTube token.
- Publish flow succeeds for at least 95% of test uploads excluding documented YouTube-side processing/rejection states.

## Operational rules

- Pin and record every model/provider/renderer/style version per generated artifact; use golden lessons before any version change.
- Daily reconcile SQS jobs, credit holds, provider failures, uploaded video status, Stripe events, object retention, and error-budget alerts.
- Pause new paid invitations if p95 render latency, provider error rate, rendering cost, moderation escape rate, or support load exceeds pre-set operational thresholds.
- Run quarterly dependency/license and provider-policy review; retain SBOM, notices, asset provenance, and FFmpeg build configuration.

## Explicitly deferred

Self-hosting/offline execution, school organizations, non-English voices, collaboration, freeform canvas/MCP, creator visual uploads, AI images, extra media formats, analytics/scheduling, and multi-platform publishing are separate future efforts.
