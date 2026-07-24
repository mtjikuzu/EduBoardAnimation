# Open-source SaaS licensing audit

**Decision input:** [Audit dependency and provider licensing for the open-source SaaS](https://github.com/mtjikuzu/EduBoardAnimation/issues/7)

## Recommendation

The beta can remain an **MIT application** if it uses permissive JavaScript libraries and an LGPL-compliant FFmpeg build. Maintain a machine-readable third-party notice/SBOM, pin each package/version/license, and review every asset’s provenance before inclusion. Do not include AGPL dependencies or tldraw/Remotion in the production path.

## Material findings

- TanStack Start/Router, React, Zod, Drizzle, Tailwind, shadcn/ui, Excalidraw, Rough.js, and BullMQ publish permissive MIT licenses; Excalidraw is deferred from Phase 0–1 but is compatible if reintroduced.
- MathJax is Apache-2.0, compatible with MIT distribution when notices are retained.
- FFmpeg is LGPL by default but can become GPL depending on enabled components/configuration. Use a documented LGPL build and retain required notices; never claim FFmpeg itself is MIT.
- Hosted AI, identity, billing, and YouTube services are not software dependencies licensed into the app; their contractual terms, data policies, and branding/attribution requirements belong in provider governance.

## Required controls

1. Enforce dependency-license allowlisting in CI (MIT, Apache-2.0, BSD/ISC and reviewed equivalents).
2. Generate SBOM/notices for every release and record asset source/license in the asset library.
3. Pin the FFmpeg build configuration and scan it for GPL-enabled codecs/libraries.
4. Review provider terms and API policies at each major integration update.

## Sources

- [TanStack license](https://github.com/TanStack/router/blob/main/LICENSE), [React license](https://github.com/facebook/react/blob/main/LICENSE), [Zod license](https://github.com/colinhacks/zod/blob/main/LICENSE), [Rough.js license](https://github.com/rough-stuff/rough/blob/main/LICENSE), [BullMQ license](https://github.com/taskforcesh/bullmq/blob/master/LICENSE.md), and [Excalidraw license](https://github.com/excalidraw/excalidraw/blob/master/LICENSE) — MIT terms.
- [MathJax license](https://github.com/mathjax/MathJax/blob/master/LICENSE) — Apache-2.0.
- FFmpeg, [legal information](https://ffmpeg.org/legal.html) — LGPL/GPL configuration distinction.
- [SPDX specification](https://spdx.dev/use/specifications/) — standard software-bill-of-materials/license expression vocabulary.
