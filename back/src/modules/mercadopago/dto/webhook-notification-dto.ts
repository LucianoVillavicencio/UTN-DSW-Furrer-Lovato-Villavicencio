/**
 * Shape of the JSON body Mercado Pago posts to the webhook, e.g.:
 * `{ action: 'payment.created', api_version: 'v1', data: { id: '123' },
 * date_created: '...', id: 456, live_mode: true, type: 'payment',
 * user_id: 789 }`.
 *
 * Deliberately a plain `interface`, not a `class` with `class-validator`
 * decorators: the app's global `ValidationPipe` runs with `whitelist: true` +
 * `forbidNonWhitelisted: true`, which is exactly right for DTOs bound from
 * our own front-end but is the wrong tool here. Mercado Pago is an external,
 * uncontrolled sender — a class-validated DTO would 400 on any field it adds
 * that this file doesn't already know about, and MP treats a non-2xx as
 * "retry", so a single unrecognized field would mean four days of retries
 * that can never succeed. An `interface` reflects to `Object` at runtime
 * (interfaces don't survive compilation), which Nest's `ValidationPipe`
 * skips entirely — the body passes through untouched.
 *
 * None of this matters for security or correctness either way: the body is
 * never trusted for payment status or amount (WebhookService always
 * re-fetches from `client.getPayment`), and `data.id`/`type` are read from
 * the query string, not from this body, per Mercado Pago's own webhook
 * contract. This type exists purely for the `@Body()` parameter to have a
 * name and a shape to document, not to gate anything.
 */
export interface WebhookNotificationDto {
  action?: string;
  api_version?: string;
  data?: { id?: string };
  date_created?: string;
  id?: number | string;
  live_mode?: boolean;
  type?: string;
  user_id?: number | string;
}
