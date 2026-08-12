/**
 * Mirrors backend `{ success: true; message; data }` envelopes from Nest controllers.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  data: null;
  path: string;
}

/** JWT user summary from `/auth/login` | `/auth/refresh`. */
export interface AuthSessionUser {
  id: string;
  email: string;
  tenantId: string;
  platformAdmin: boolean;
  tenantRole?: 'admin' | 'member';
  displayName?: string;
}

/** Session payload nested under `data` for auth mutations. */
export interface AuthSessionData {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthSessionUser;
}

export type AuthTokens = Pick<AuthSessionData, 'accessToken' | 'refreshToken'>;

/** Second factors a pending sign-in challenge will accept. */
export type MfaChallengeMethod = 'totp' | 'backup_code' | 'email_code';

/**
 * `/auth/login` when the account carries a second factor. This is a ticket, not
 * a session — no tokens exist until `/auth/mfa/verify` accepts a code.
 */
export interface MfaRequiredData {
  mfaRequired: true;
  challengeToken: string;
  methods: MfaChallengeMethod[];
  expiresAt: string;
}

/** `/auth/login` hands back either a session or a second-factor challenge. */
export type LoginResultData = AuthSessionData | MfaRequiredData;

/** `/auth/mfa/status` — the signed-in user's own second-factor state. */
export interface MfaStatus {
  isTotpEnabled: boolean;
  totpEnabledAt: string | null;
  hasPendingEnrollment: boolean;
  backupCodesRemaining: number;
  isEmailCodeLoginEnabled: boolean;
}

/** `/auth/mfa/totp/setup` — nothing is enforced until enable succeeds. */
export interface TotpEnrollmentData {
  /** Base32 secret, for apps that cannot scan the QR code. */
  secret: string;
  otpauthUri: string;
  /** PNG data URL rendered server-side. */
  qrCodeDataUrl: string;
  expiresAt: string;
}

/** Recovery codes, returned in plain text exactly once. */
export interface BackupCodesData {
  backupCodes: string[];
  generatedAt: string;
}

/** `/auth/register` — account created; verify email then `/auth/login` (no tokens here). */
export interface RegisterSuccessData {
  email: string;
  tenantId: string;
  organizationName: string;
  emailVerificationSent: boolean;
}

export type VerifyEmailResponse = ApiSuccessResponse<{ email: string }>;

export type RegisterResponse = ApiSuccessResponse<RegisterSuccessData>;
export type LoginResponse = ApiSuccessResponse<LoginResultData>;
export type VerifyMfaResponse = ApiSuccessResponse<AuthSessionData>;
/** Always a challenge, even for an address with no account behind it. */
export type RequestLoginCodeResponse = ApiSuccessResponse<MfaRequiredData>;
export type RefreshTokenResponse = ApiSuccessResponse<AuthSessionData>;
export type LogoutResponse = ApiSuccessResponse<null>;
export type MfaStatusResponse = ApiSuccessResponse<MfaStatus>;
export type TotpEnrollmentResponse = ApiSuccessResponse<TotpEnrollmentData>;
export type BackupCodesResponse = ApiSuccessResponse<BackupCodesData>;

export interface AuthHealthData {
  module: string;
  dbReady: boolean;
}

/** `/auth/me` — tenant-scoped (requires JWT + tenant guard). */
export type GetMeResponse = ApiSuccessResponse<AuthSessionUser>;

export interface BillingPlan {
  id: string;
  name: string;
  stripePriceId: string;
  amount: number;
  currency: string;
  interval: string;
  trialDays: number;
  isTrialEnabled: boolean;
  features: {
    maxWorkspaces?: number;
    maxUsers?: number;
    maxFileAssets?: number;
    maxStorageMb?: number;
    aiChatbot?: boolean;
  } | null;
  entitlements: {
    aiChatbot: boolean;
  };
  featureHighlights: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  purgeAt: string | null;
}

export interface TenantSubscriptionSnapshot {
  tenantId: string;
  status: string;
  planKey: string;
  stripePriceId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  nextBillingDate?: string;
  nextBillingInDays?: number;
  plan: {
    id: string;
    name: string;
    stripePriceId: string;
    amount: number;
    currency: string;
    interval: string;
    trialDays: number;
    isTrialEnabled: boolean;
    features: BillingPlan['features'];
    entitlements: BillingPlan['entitlements'];
    featureHighlights: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface CheckoutSessionData {
  sessionId: string;
  url: string | null;
}

export interface CheckoutSuccessSyncData {
  sessionId: string;
  synced: boolean;
  subscriptionStatus: string;
  planKey: string;
  cancelAtPeriodEnd: boolean;
}

export interface CancelSubscriptionData {
  canceledNow: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string;
  currentPeriodEnd?: string;
}

export interface RefundRequestData {
  refundId: string;
  status: string | null;
  chargeId: string;
  amount: number;
  currency: string;
}

/** POST /tenant/users/accept-invite — account activation success. */
export interface AcceptInviteData {
  message: string;
}
export type AcceptInviteResponse = ApiSuccessResponse<AcceptInviteData>;

/** GET /tenant/users — one row in the paginated list. */
export interface TenantUserProfile {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'member';
  isActive: boolean;
  isEmailVerified: boolean;
  tenantId: string;
  createdAt?: string;
}

export interface PaginatedTenantUsersData {
  users: TenantUserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type TenantUserListResponse = ApiSuccessResponse<PaginatedTenantUsersData>;

export type TenantMePatchResponse = ApiSuccessResponse<TenantUserProfile>;

export type TenantUserDetailResponse = ApiSuccessResponse<TenantUserProfile>;
export type InviteTenantUserResponse = ApiSuccessResponse<TenantUserProfile>;
export type UpdateTenantUserResponse = ApiSuccessResponse<TenantUserProfile>;
export type DeleteTenantUserResponse = ApiSuccessResponse<null>;

export type BillingPlansResponse = ApiSuccessResponse<BillingPlan[]>;
export type BillingPlanResponse = ApiSuccessResponse<BillingPlan>;
export type TenantProfileResponse = ApiSuccessResponse<TenantProfile>;
export type TenantSubscriptionResponse = ApiSuccessResponse<TenantSubscriptionSnapshot>;
export type CheckoutSessionResponse = ApiSuccessResponse<CheckoutSessionData>;
export type CheckoutSuccessSyncResponse = ApiSuccessResponse<CheckoutSuccessSyncData>;
export type CancelSubscriptionResponse = ApiSuccessResponse<CancelSubscriptionData>;
export type RefundRequestResponse = ApiSuccessResponse<RefundRequestData>;

export const TASK_STATUS_VALUES = [
  'TODO',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
] as const;
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];

export type WorkspaceTaskStatusCounts = Record<TaskStatus, number>;

export interface WorkspaceTask {
  id: string;
  workspaceId: string;
  tenantId: string;
  title: string;
  description: string | null;
  attachmentUrls: string[];
  status: TaskStatus;
  assignedTo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTaskListData {
  items: WorkspaceTask[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  statusCounts: WorkspaceTaskStatusCounts;
}

export interface WorkspaceTaskDeleteData {
  taskId: string;
  deleted: true;
}

export type WorkspaceTaskListResponse = ApiSuccessResponse<WorkspaceTaskListData>;
export type WorkspaceTaskResponse = ApiSuccessResponse<WorkspaceTask>;
export type WorkspaceTaskDeleteResponse = ApiSuccessResponse<WorkspaceTaskDeleteData>;

export interface CreateUploadSignatureData {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  resourceType: string;
  allowedFormats: string[];
  expiresAt: string;
}

export interface RegisteredFileAssetData {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  mimeType: string;
  uploadStage: 'TEMPORARY' | 'FINALIZED';
  expiresAt?: string;
}

export interface FileAssetDeleteData {
  publicId: string;
  deleted: boolean;
}

export type CreateUploadSignatureResponse = ApiSuccessResponse<CreateUploadSignatureData>;
export type RegisterFileAssetResponse = ApiSuccessResponse<RegisteredFileAssetData>;
export type FileAssetDeleteResponse = ApiSuccessResponse<FileAssetDeleteData>;

export interface InAppNotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type InAppNotificationListResponse = ApiSuccessResponse<InAppNotificationItem[]>;

export interface InAppNotificationMarkReadData {
  id: string;
  status: string;
}

export type InAppNotificationMarkReadResponse =
  ApiSuccessResponse<InAppNotificationMarkReadData>;

export interface InAppNotificationMarkAllReadData {
  matched: number;
  modified: number;
}

export type InAppNotificationMarkAllReadResponse =
  ApiSuccessResponse<InAppNotificationMarkAllReadData>;

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDeleteData {
  workspaceId: string;
  deleted: true;
}

export type WorkspaceListResponse = ApiSuccessResponse<Workspace[]>;
export type WorkspaceResponse = ApiSuccessResponse<Workspace>;
export type WorkspaceDeleteResponse = ApiSuccessResponse<WorkspaceDeleteData>;

export type ChatEligibilityResponse = ApiSuccessResponse<{
  allowed: boolean;
  reason?: string;
}>;

export interface ChatSession {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  createdAt: string;
}

export type ChatModuleStatusResponse = ApiSuccessResponse<{
  module: string;
  dbReady: boolean;
}>;

export type ChatSessionListResponse = ApiSuccessResponse<ChatSession[]>;
export type ChatSessionCreateResponse = ApiSuccessResponse<ChatSession>;
export type ChatSessionPatchResponse = ApiSuccessResponse<ChatSession>;
export type ChatSessionDeleteResponse = ApiSuccessResponse<null>;
export type ChatMessagesListResponse = ApiSuccessResponse<ChatMessage[]>;
export type ChatSendMessageResponse = ApiSuccessResponse<{
  assistantMessage: ChatMessage;
}>;
