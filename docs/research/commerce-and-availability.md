# Creator identity, commerce, tax, and availability research

**Decision input:** [Research creator identity, payments, tax, and regional availability](https://github.com/mtjikuzu/EduBoardAnimation/issues/6)

## Updated recommendation

Use **Clerk** for consumer authentication and **Polar** for subscriptions and one-off render-credit packs. Launch paid beta only in a short, verified set of creator countries; keep other regions on a waitlist. Do not advertise Namibia paid availability until Polar’s seller/onboarding, payment-method, tax, and payout coverage has been specifically verified.

Model render credits in EduWhiteboard’s own immutable ledger, not as a Polar balance: Polar records the commercial transaction; the product records grants, holds, consumption, refunds, expiry, and cache-free reuse. Allocate trial credits through the same ledger. Treat Polar as the commercial system of record only after a verified webhook has been processed idempotently; never grant or revoke product credits solely from a browser redirect.

Polar provides hosted/embedded checkout and dynamically-created Checkout Sessions. Its webhook integration is therefore the required source of subscription, order, refund, and cancellation state. Whether Polar’s merchant-of-record and tax handling covers a particular creator market must remain a launch checklist item rather than an assumed global claim.

## Sources

- Polar, [Checkout documentation](https://docs.polar.sh/features/checkout) — checkout links, embedded checkout, and dynamically created Checkout Sessions.
- Polar, [Webhook documentation](https://docs.polar.sh/integrate/webhooks) — server-side event integration and verification requirements.
- Polar, [Benefits documentation](https://docs.polar.sh/features/benefits) — product entitlement concepts.
- Polar, [official documentation](https://docs.polar.sh/) — current platform capabilities and integration surface.
- Clerk, [authentication documentation](https://clerk.com/docs) — hosted consumer identity/session capabilities.
