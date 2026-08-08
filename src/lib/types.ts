/**
 * Types mirroring the NestJS API contract. Keep in sync with
 * meduman_backend/prisma/schema.prisma and the module DTOs.
 */

export type UserRole = 'BUYER' | 'SELLER' | 'FREELANCER' | 'BUSINESS';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type AppRole = 'BUYER' | 'SELLER' | 'ADMIN';

export type TransactionStatus =
  | 'DRAFT'
  | 'LINK_ACTIVE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_PROTECTED'
  | 'DELIVERY_IN_PROGRESS'
  | 'CONFIRMATION_PENDING'
  | 'DISPUTED'
  | 'RELEASE_PROCESSING'
  | 'RELEASED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type FeeModel = 'BUYER_PAYS' | 'SELLER_PAYS';
export type ReleaseRule = 'BUYER_CONFIRMATION' | 'AUTO_AFTER_WINDOW' | 'ADMIN_ONLY';
export type TrustLevel = 'NEW' | 'VERIFIED' | 'TRUSTED' | 'HIGHLY_TRUSTED';

/** `GET /users/me` — the Prisma User row. Note: no `role` field. */
export interface ApiUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  roleFlags: UserRole[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/** UI-facing user: ApiUser plus role booleans derived from roleFlags + JWT appRole. */
export interface AppUser extends ApiUser {
  name: string;
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  /** Which side the dashboard renders as. Sellers default to the seller view. */
  activeRole: 'buyer' | 'seller';
}

/** Amounts are always integer minor units (kobo). Never a float. */
export interface Transaction {
  id: string;
  publicLinkId: string;
  sellerId: string;
  buyerId: string | null;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  releaseRule: ReleaseRule;
  expectedDeliveryDate: string | null;
  expiresAt: string | null;
  feeModel: FeeModel;
  feeAmount: number;
  createdAt: string;
  updatedAt: string;
}

/** Cursor-paginated list envelope used by `GET /transactions`. */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

/** `GET /public/transactions/:publicLinkId` — no `id`, seller is nested. */
export interface PublicTransactionView {
  publicLinkId: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  feeModel: FeeModel;
  feeAmount: number;
  status: TransactionStatus;
  seller: {
    displayName: string | null;
    trustLevel: TrustLevel | null;
    verified: boolean;
  };
}

/** `POST /payments/initialize` response. camelCase, not Paystack's snake_case. */
export interface InitializePaymentResponse {
  authorizationUrl: string;
  reference: string;
}

export interface TimelineEvent {
  id: string;
  transactionId: string;
  type: string;
  description: string | null;
  createdAt: string;
}

/** `Payout.status` — the Prisma PayoutStatus enum, verbatim. */
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED';

export interface PayoutView {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  attemptCount: number;
  createdAt: string;
}

/**
 * A payout row paired with the transaction it settles. The backend exposes
 * payouts only per transaction (`GET /transactions/:id/payouts`) — there is no
 * seller-wide payout list — so the ledger page joins them on the client.
 */
export interface PayoutWithTransaction extends PayoutView {
  transaction: Transaction;
}

/** `GET /admin/transactions/:id/audit` — an immutable AuditLog row (money rule 6). */
export type ActorType = 'USER' | 'ADMIN' | 'SYSTEM';

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: ActorType;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  /** For `transaction.status_change` this is `{ event, from, to }`. */
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Normalize `GET /users/me` response into AppUser.
 * Backend returns `roleFlags: UserRole[]` with no `role`. JWT `app_metadata.role`
 * carries admin status if present; Supabase client has no direct access to it, so
 * admin detection requires the backend to return it or we infer from context.
 */
export function normalizeUser(apiUser: ApiUser, jwtAppRole?: string): AppUser {
  const isSeller = apiUser.roleFlags.includes('SELLER');
  const isBuyer = apiUser.roleFlags.includes('BUYER') || apiUser.roleFlags.length === 0;
  const isAdmin = jwtAppRole === 'ADMIN';

  return {
    ...apiUser,
    name: apiUser.fullName || apiUser.email.split('@')[0] || 'User',
    isBuyer,
    isSeller,
    isAdmin,
    activeRole: isSeller ? 'seller' : 'buyer',
  };
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_RELEASE' | 'RESOLVED_REFUND' | 'RESOLVED_PARTIAL' | 'CANCELLED';
/** Prisma `DisputeReason`, verbatim. */
export type DisputeReason =
  | 'ITEM_NOT_RECEIVED'
  | 'NOT_AS_DESCRIBED'
  | 'DAMAGED'
  | 'SELLER_UNRESPONSIVE'
  | 'WRONG_ITEM'
  | 'FRAUD'
  | 'OTHER';
/** Prisma `DisputeOutcome` — what the complainant asked for. */
export type DisputeOutcome = 'REFUND' | 'RELEASE' | 'REPLACEMENT' | 'PARTIAL_REFUND';
/** `POST /disputes/:id/resolve` accepts only these two (ResolveDisputeDto). */
export type DisputeResolveOutcome = 'RELEASE' | 'REFUND';

export interface Dispute {
  id: string;
  transactionId: string;
  openedBy: string;
  reason: DisputeReason;
  description: string | null;
  desiredOutcome: DisputeOutcome | null;
  status: DisputeStatus;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `GET /admin/disputes` rows. AdminService includes a lean transaction select —
 * id/title/amount/currency/status only (no seller or buyer identity).
 */
export interface AdminDispute extends Dispute {
  transaction: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
  };
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'VOID';

/** One persisted invoice line. Every money field is server-computed kobo. */
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  title: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  position: number;
  createdAt: string;
}

/**
 * The Prisma `Invoice` row as returned by `GET /invoices` (list rows carry no
 * lineItems — the list query does not include them). All money is integer kobo
 * and computed by the server; the client never sends a total.
 */
export interface Invoice {
  id: string;
  publicViewId: string;
  sellerId: string;
  /** Allocated only at send. A DRAFT carries an empty string. */
  number: string;
  buyerId: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  /** Basis points; 750 = 7.5%. */
  taxRatePctBp: number | null;
  taxAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  transactionId: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `POST /invoices`, `PATCH /invoices/:id`, `GET /invoices/:id`,
 * `POST /invoices/:id/send|void` — these all include the ordered line items.
 */
export interface InvoiceDetail extends Invoice {
  lineItems: InvoiceLineItem[];
}

/** A line as sent to `POST /invoices` — inputs only, never a lineTotal. */
export interface InvoiceLineInput {
  title: string;
  description?: string;
  /** Positive integer. */
  quantity: number;
  /** Integer kobo, >= 0. Never a float. */
  unitPrice: number;
}

/** Body of `POST /invoices` / `PATCH /invoices/:id` (CreateInvoiceDto). */
export interface CreateInvoiceBody {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  /** ISO-8601. */
  dueDate?: string;
  /** Basis points, 0–10000. */
  taxRatePctBp?: number;
  notes?: string;
  terms?: string;
  lineItems: InvoiceLineInput[];
}

/** A line in the buyer-facing public projection (no internal ids). */
export interface PublicInvoiceLine {
  title: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/**
 * `GET /public/invoices/:publicViewId` — the allow-listed buyer projection.
 * Deliberately omits transactionId, sellerId, the buyer auth id and every
 * payout field. `payLinkId` is the transaction's publicLinkId once sent.
 */
export interface PublicInvoiceView {
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  buyerName: string | null;
  lineItems: PublicInvoiceLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  sellerName: string | null;
  sellerBadgeSlug: string | null;
  payLinkId: string | null;
}

/** `GET /users/me/seller/banks` — one option in the settlement-bank picker. */
export interface BankOption {
  name: string;
  code: string;
}

/**
 * `GET|PATCH /users/me/seller`, `POST /users/me/seller/recipient` — the caller's
 * own seller profile. Never exposes the raw Paystack recipient/subaccount code.
 */
export interface SellerProfileSelfView {
  businessName: string | null;
  category: string | null;
  verificationStatus: string;
  trustLevel: TrustLevel;
  badgeSlug: string | null;
  settlementBankVerified: boolean;
  /** Masked settlement account — last 4 digits only. */
  settlementAccountLast4: string | null;
  /** Bank-resolved account name (never client-supplied). */
  settlementAccountName: string | null;
  /** True once a payout can actually be sent (recipient onboarded). */
  settlementReady: boolean;
}

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'IN_APP'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'MESSENGER';

/**
 * Exactly the projection `GET /notifications` selects — no more. The API has no
 * title/body/link fields; display text is derived from `templateKey` + `payload`.
 * `status` is delivery state (the outbound send); `readAt` is the in-app read
 * receipt. They are independent.
 */
export interface NotificationView {
  id: string;
  channel: NotificationChannel;
  templateKey: string;
  payload: Record<string, unknown> | null;
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
}

