# Generation-provider research

**Decision input:** [Benchmark structured lesson-planning and English narration providers](https://github.com/mtjikuzu/EduBoardAnimation/issues/3)

## Recommendation

Adopt **OpenAI Responses API with Structured Outputs** for planning/revision and **Kokoro TTS** for English narration. Put both behind small `LessonPlanner` and `TTSProvider` ports; validate every result with the shared Zod schema, and retain provider/model/version metadata on every generation.

OpenAI's official Structured Outputs documentation states that responses can adhere to a supplied JSON Schema and supports Zod helpers. This directly matches the editable storyboard contract; JSON mode alone is insufficient because it does not guarantee schema adherence.

Kokoro is a fully open-source (MIT, Apache-2.0 weights) TTS model with 82M parameters that runs 100% locally. It replaces the previously-considered ElevenLabs hosted service, keeping the entire stack license-clean. Sentence timing is estimated from speaking rate (~150 wpm) since Kokoro does not provide word-level alignment, but the architecture supports adding a second TTS provider if timing precision becomes critical.

## Required safeguards

- Use version-pinned model identifiers/configuration, timeout/retry policy, request-size limits, redacted tracing, and per-provider circuit breaking.
- Validate model output, run deterministic calculation checks separately, and preserve a human approval gate; structured output is not factual correctness.
- Store provider data-processing configuration and user-data disclosures alongside the provider adapter.
- Do not use Kokoro or any provider for voice cloning in the beta.

## Sources

- OpenAI, [Structured model outputs](https://platform.openai.com/docs/guides/structured-outputs) — JSON Schema adherence, strict mode, and Zod integration.
- Kokoro TTS, [GitHub repository](https://github.com/hexgrad/kokoro) — MIT-licensed, 82M-parameter TTS model with Apache-2.0 weights.
- Kokoro-js, [NPM package](https://www.npmjs.com/package/kokoro-js) — JavaScript/TypeScript API for local TTS inference via Transformers.js.
- Google Cloud, [SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml#timepoints) — viable fallback pattern if a second TTS provider is required for timing precision.
