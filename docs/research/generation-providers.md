# Generation-provider research

**Decision input:** [Benchmark structured lesson-planning and English narration providers](https://github.com/mtjikuzu/EduBoardAnimation/issues/3)

## Recommendation

Adopt **OpenAI Responses API with Structured Outputs** for planning/revision and **ElevenLabs Text to Speech with timestamps** for English narration in the beta. Put both behind small `LessonPlanner` and `TTSProvider` ports; validate every result with the shared Zod schema, and retain provider/model/version metadata on every generation.

OpenAI’s official Structured Outputs documentation states that responses can adhere to a supplied JSON Schema and supports Zod helpers. This directly matches the editable storyboard contract; JSON mode alone is insufficient because it does not guarantee schema adherence. ElevenLabs’ timestamp endpoint returns generated audio with character alignment, suitable for deriving sentence timing. Benchmark two representative 3–8 minute scripts before committing to credit prices; provider pricing and voice availability change too frequently to hard-code in the architecture.

## Required safeguards

- Use version-pinned model identifiers/configuration, timeout/retry policy, request-size limits, redacted tracing, and per-provider circuit breaking.
- Validate model output, run deterministic calculation checks separately, and preserve a human approval gate; structured output is not factual correctness.
- Store provider data-processing configuration and user-data disclosures alongside the provider adapter. Provide fallback to a second provider only after its voice/timing contract is verified.
- Do not use provider APIs for voice cloning in the beta.

## Sources

- OpenAI, [Structured model outputs](https://platform.openai.com/docs/guides/structured-outputs) — JSON Schema adherence, strict mode, and Zod integration.
- OpenAI, [Text to speech](https://platform.openai.com/docs/guides/text-to-speech) — hosted TTS capabilities and disclosure requirements.
- ElevenLabs, [Convert with timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps) — audio plus alignment/timestamp response.
- ElevenLabs, [Privacy and security documentation](https://elevenlabs.io/docs/overview/administration/privacy) — data-processing due-diligence input.
- Google Cloud, [SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml#timepoints) — viable fallback pattern to benchmark if a second TTS is required.
