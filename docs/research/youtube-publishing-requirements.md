# YouTube publishing requirements for the creator beta

**Research date:** 2026-07-24  
**Decision input for:** [Verify YouTube publishing requirements for the creator beta](https://github.com/mtjikuzu/EduBoardAnimation/issues/2)

## Conclusion

EduWhiteboard can support the planned explicit, creator-approved YouTube upload, but it must be treated as a production OAuth integration—not as a simple file-upload feature. The beta should request only `https://www.googleapis.com/auth/youtube.upload`, complete Google OAuth verification before broad public use, encrypt and persist refresh tokens, default uploads to `private`, and meter uploads independently of video rendering because YouTube quota is a hard external limit.

## Current requirements and implications

| Area | Primary-source finding | Phase 0–1 implication |
| --- | --- | --- |
| Authorization | Google documents OAuth 2.0 authorization as the way for an application to obtain permission to upload to a user’s YouTube channel. The `youtube.upload` scope is sufficient for uploading videos. | Use the server-side authorization-code flow with PKCE/state protection. Request the upload scope only when a creator chooses **Connect YouTube**; do not combine it with sign-in scopes unnecessarily. |
| Token handling | Google’s server-side OAuth guide recommends offline access for refresh tokens and says production applications need secure, persistent token storage. Tokens can be revoked or expire. | Encrypt refresh tokens using a managed key service; never put them in browser storage or logs. Model a connection as revocable and turn `invalid_grant`/authorization failures into a reconnect action. |
| Verification | Google’s OAuth guide says a public application using scopes that permit access to user data must complete verification to remove the unverified-app experience. The verification requirements require a verified domain, homepage, privacy policy, and a disclosure of how Google user data is accessed, used, stored, and shared. | Create the production Google Cloud project, verified domain, privacy policy, consent-screen copy, and a short verification demo before opening the beta beyond test users. Treat approval lead time as a launch dependency. |
| Upload API | `videos.insert` uploads a video and supports `snippet` and `status` resource parts. `status.privacyStatus` supports `private`, `public`, and `unlisted`. | Make a creator explicitly choose visibility at the final publish step; default to `private` (or `unlisted` only when consciously selected). Persist the returned video id and canonical watch URL. |
| Processing | The video resource exposes upload/processing status and processing details. | Publishing is an asynchronous job. After an upload succeeds, poll/reconcile status and show separate states for upload accepted, processing, processed, rejected, and unavailable. Do not represent an accepted upload as a completed public publish. |
| Quota | Google’s quota-cost guide lists `videos.insert` at 1,600 quota units. The default daily project allocation is 10,000 units, which permits only six full uploads before other API usage. | Put YouTube upload behind a dedicated quota-aware queue and budget. For the beta, limit publish attempts per creator/day and request a higher quota only after monitoring real usage. Rendering credits must not be conflated with Google quota. |
| Policy | Google requires least-privilege scopes and its verification requirements require clear user-data disclosures. YouTube API Services terms also apply. | Publish Google-data disclosures and a connection-revocation path. Prohibit automatic/repeated uploading and keep the creator’s final confirmation immediately adjacent to the upload action. |

## Recommended implementation contract

1. **Connection:** authenticated creator selects **Connect YouTube**; start authorization-code flow with `state`, PKCE, exact HTTPS redirect URI, and `youtube.upload` only.
2. **Storage:** persist the channel connection and encrypted refresh token separately from the creator record; record granted scopes, connected time, last refresh, and revocation/failure state.
3. **Publish:** only an approved canonical export can enqueue a YouTube upload. Require title, description, thumbnail decision, and an explicit `private | unlisted | public` selection; preselect `private`.
4. **Worker:** use resumable upload, idempotency at the application job level, bounded retry/backoff for transient failures, and quota-aware admission control.
5. **Status:** persist returned video id and poll `videos.list(part=status,processingDetails)` until terminal state. Surface YouTube’s returned failure/rejection reason without pretending EduWhiteboard can repair it.
6. **Disconnect/delete:** disconnect revokes local access by deleting the stored refresh token; project deletion must remove the associated YouTube connection metadata unless it is still needed for a separately disclosed billing/security purpose.

## Launch blockers

- A verified production OAuth consent screen, verified domain, matching privacy policy, and Google’s required disclosure of Google-user-data handling.
- A secure token-encryption/key-rotation design and operational log redaction.
- A quota alarm, per-creator publish throttling, and a reconciliation job for uploads whose final processing status is delayed or failed.
- Terms, privacy, and UI copy reviewed against the current YouTube API Services Terms and Google API Services User Data Policy before public availability.

## Sources

- Google, [Using OAuth 2.0 for Web Server Applications](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) — authorization-code flow, scopes, state verification, offline access, and secure persistent refresh-token storage.
- Google, [`videos.insert` reference](https://developers.google.com/youtube/v3/docs/videos/insert) — upload endpoint, resource parts, and upload behavior.
- Google, [`videos` resource reference](https://developers.google.com/youtube/v3/docs/videos) — `status`, privacy states, and processing fields.
- Google, [Quota costs for API requests](https://developers.google.com/youtube/v3/determine_quota_cost) — 1,600-unit `videos.insert` cost and default daily allocation.
- Google, [OAuth verification requirements](https://support.google.com/cloud/answer/13464321) — verified domain, homepage, privacy policy, and Google-user-data disclosures.
- Google, [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification) — verification process for public applications using sensitive scopes.
- Google, [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service) — applicable API-services terms.
