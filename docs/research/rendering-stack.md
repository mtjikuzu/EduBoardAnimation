# Deterministic whiteboard-rendering stack research

**Decision input:** [Evaluate deterministic whiteboard rendering stacks](https://github.com/mtjikuzu/EduBoardAnimation/issues/4)

## Recommendation

Use a **custom, data-driven SVG scene renderer**: storyboard → normalized SVG layers/path-draw timeline → fixed-fps PNG frames via headless Chromium → FFmpeg scene MP4 → FFmpeg concat. Do not adopt an unverified Canvas Commons/VibeFrame dependency as the beta’s critical rendering core.

Rough.js can supply the consistent sketch treatment for approved vector assets. MathJax can produce SVG for equations. The renderer owns the animation contract: fixed canvas, 30 fps, deterministic seeded roughness, explicit element ordering, narration-derived timing, and stable H.264/AAC output settings. Every scene cache key includes the canonical scene JSON, global style version, voice/audio hash, renderer version, and media contract.

## Why this wins

- SVG is inspectable, asset-library-friendly, and straightforward to animate with path length / dash offset.
- Headless Chromium has mature SVG/font layout; FFmpeg owns frame/audio encoding and concat, rather than an immature animation framework owning the pipeline.
- A scene boundary makes changed-scene rendering and post-render A/V checks explicit.

## Sources

- Rough.js, [source repository and MIT license](https://github.com/rough-stuff/rough) — vector sketch rendering and license.
- MathJax, [official documentation](https://docs.mathjax.org/en/latest/output/index.html) — SVG output support.
- FFmpeg, [official documentation](https://ffmpeg.org/documentation.html) and [licensing](https://ffmpeg.org/legal.html) — encoding/filtering capability and LGPL/GPL build obligations.
- Chrome for Testing, [official documentation](https://developer.chrome.com/blog/chrome-for-testing/) — pinned headless browser binaries for reproducible rendering.
