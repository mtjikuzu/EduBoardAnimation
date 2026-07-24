# Creator identity, commerce, tax, and availability research

**Decision input:** [Research creator identity, payments, tax, and regional availability](https://github.com/mtjikuzu/EduBoardAnimation/issues/6)

## Recommendation

Use **Clerk** for consumer authentication and **Stripe Billing/Checkout** for subscriptions and one-off render-credit packs. Launch paid beta only in a short, verified list of Stripe-supported creator countries; keep other regions on a waitlist. Do not advertise Namibia paid availability until a supported payment/tax path has been specifically verified.

Model render credits in EduWhiteboard’s own immutable ledger, not as a Stripe balance: Stripe records money; the product records grants, holds, consumption, refunds, expiry, and cache-free reuse. Allocate trial credits through the same ledger. Delegate sales-tax/VAT calculation and invoice records to Stripe Tax where it is available, with a clearly documented country policy.

## Sources

- Clerk, [authentication documentation](https://clerk.com/docs) — hosted consumer identity/session capabilities.
- Stripe, [Billing documentation](https://docs.stripe.com/billing) — recurring subscriptions and usage/entitlements primitives.
- Stripe, [Checkout documentation](https://docs.stripe.com/payments/checkout) — hosted payment flow.
- Stripe, [Tax documentation](https://docs.stripe.com/tax) — automated tax calculation and tax-record support.
- Stripe, [global availability](https://stripe.com/global) — country availability must be checked before launch claims.
