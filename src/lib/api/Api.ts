import type { AxiosResponse } from 'axios';

import { apiClient } from '@/lib/api/client';
import { setupInterceptors } from '@/lib/api/interceptor';
import type {
  AcceptInvitePayload,
  AcceptInviteResponse,
  BackupCodesResponse,
  BillingPlanResponse,
  BillingPlansResponse,
  CancelSubscriptionPayload,
  CancelSubscriptionResponse,
  DisableTotpPayload,
  EnableTotpPayload,
  MfaStatusResponse,
  RegenerateBackupCodesPayload,
  TotpEnrollmentResponse,
  UpdateMfaPreferencesPayload,
  VerifyMfaPayload,
  RequestLoginCodePayload,
  VerifyMfaResponse,
  RequestLoginCodeResponse,
  ChatEligibilityResponse,
  ChatMessagesListResponse,
  ChatSendMessageResponse,
  ChatSessionCreateResponse,
  ChatSessionDeleteResponse,
  ChatSessionListResponse,
  ChatSessionPatchResponse,
  CreateChatSessionPayload,
  PatchChatSessionPayload,
  SendChatMessagePayload,
  CreateUploadSignaturePayload,
  CreateUploadSignatureResponse,
  CreateWorkspacePayload,
  CreateWorkspaceTaskPayload,
  DeleteFileAssetPayload,
  DeleteTenantUserResponse,
  CheckoutSuccessSyncResponse,
  CheckoutSessionResponse,
  ConfirmCheckoutSessionPayload,
  CreateCheckoutSessionPayload,
  FileAssetDeleteResponse,
  GetMeResponse,
  InviteTenantUserPayload,
  InviteTenantUserResponse,
  InAppNotificationListResponse,
  InAppNotificationMarkReadResponse,
  InAppNotificationMarkAllReadResponse,
  ListTenantUsersQuery,
  ListWorkspaceTasksQuery,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  LogoutResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RegisterFileAssetPayload,
  RegisterFileAssetResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
  RequestRefundPayload,
  RefundRequestResponse,
  TenantMePatchResponse,
  TenantUserDetailResponse,
  TenantProfileResponse,
  TenantSubscriptionResponse,
  UpdateTenantMePayload,
  UpdateTenantPayload,
  UpdateTenantUserPayload,
  UpdateTenantUserResponse,
  UpdateWorkspaceTaskPayload,
  WorkspaceDeleteResponse,
  WorkspaceListResponse,
  WorkspaceResponse,
  WorkspaceTaskDeleteResponse,
  TenantUserListResponse,
  WorkspaceTaskListResponse,
  WorkspaceTaskResponse,
} from '@/lib/api/types';
import { API_BASE_URL } from '@/lib/api/env';

export type {
  AcceptInvitePayload,
  AcceptInviteResponse,
  ApiSuccessResponse,
  AuthHealthData,
  AuthSessionData,
  AuthSessionUser,
  BillingPlan,
  BillingPlanResponse,
  BillingPlansResponse,
  CheckoutSuccessSyncData,
  CheckoutSuccessSyncResponse,
  CheckoutSessionData,
  CheckoutSessionResponse,
  ConfirmCheckoutSessionPayload,
  CreateCheckoutSessionPayload,
  CancelSubscriptionPayload,
  CancelSubscriptionResponse,
  ChatEligibilityResponse,
  ChatMessage,
  ChatMessagesListResponse,
  ChatSendMessageResponse,
  ChatSession,
  ChatSessionCreateResponse,
  ChatSessionDeleteResponse,
  ChatSessionListResponse,
  ChatSessionPatchResponse,
  CreateChatSessionPayload,
  PatchChatSessionPayload,
  SendChatMessagePayload,
  AuthLoginScope,
  LoginPayload,
  LogoutPayload,
  LogoutResponse,
  LoginResponse,
  LoginResultData,
  MfaChallengeMethod,
  MfaRequiredData,
  MfaStatus,
  MfaStatusResponse,
  TotpEnrollmentData,
  TotpEnrollmentResponse,
  BackupCodesData,
  BackupCodesResponse,
  DisableTotpPayload,
  EnableTotpPayload,
  RegenerateBackupCodesPayload,
  UpdateMfaPreferencesPayload,
  VerifyMfaPayload,
  RequestLoginCodePayload,
  VerifyMfaResponse,
  RequestLoginCodeResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
  RequestRefundPayload,
  RefundRequestResponse,
  RegisterPayload,
  RegisterResponse,
  RegisterSuccessData,
  TenantLoginPortalRole,
  VerifyEmailPayload,
  VerifyEmailResponse,
  GetMeResponse,
  InAppNotificationItem,
  InAppNotificationListResponse,
  InAppNotificationMarkReadResponse,
  AuthTokens,
  CreateUploadSignatureData,
  CreateUploadSignaturePayload,
  CreateUploadSignatureResponse,
  TenantProfile,
  TenantProfileResponse,
  TenantSubscriptionResponse,
  TenantSubscriptionSnapshot,
  TaskStatus,
  WorkspaceTaskStatusCounts,
  RegisterFileAssetPayload,
  RegisteredFileAssetData,
  RegisterFileAssetResponse,
  FileAssetDeleteData,
  FileAssetDeleteResponse,
  DeleteFileAssetPayload,
  DeleteTenantUserResponse,
  InviteTenantUserPayload,
  InviteTenantUserResponse,
  PaginatedTenantUsersData,
  TenantMePatchResponse,
  TenantUserDetailResponse,
  TenantUserProfile,
  UpdateTenantMePayload,
  UpdateTenantUserPayload,
  UpdateTenantUserResponse,
  Workspace,
  WorkspaceDeleteData,
  WorkspaceDeleteResponse,
  WorkspaceListResponse,
  WorkspaceResponse,
  WorkspaceTask,
  WorkspaceTaskDeleteData,
  WorkspaceTaskDeleteResponse,
  WorkspaceTaskListData,
  WorkspaceTaskListResponse,
  WorkspaceTaskResponse,
  ListTenantUsersQuery,
  ListWorkspaceTasksQuery,
  CreateWorkspacePayload,
  CreateWorkspaceTaskPayload,
  UpdateTenantPayload,
  UpdateWorkspaceTaskPayload,
} from '@/lib/api/types';

/** Shared axios instance (`api/client.ts`). Interceptors: token attach + queued refresh (`/auth/refresh`). */
export const API = apiClient;

setupInterceptors(API);

export { API_BASE_URL };
/** Legacy CRA-style alias for the same value */
export const REACT_APP_BASE_URL: string = API_BASE_URL;

export const ACCEPT_INVITE = (
  data: AcceptInvitePayload,
): Promise<AxiosResponse<AcceptInviteResponse>> =>
  API.post<AcceptInviteResponse>('/tenant/users/accept-invite', data);

export const REGISTER = (
  data: RegisterPayload,
): Promise<AxiosResponse<RegisterResponse>> =>
  API.post<RegisterResponse>('/auth/register', data);

export const VERIFY_EMAIL = (
  data: VerifyEmailPayload,
): Promise<AxiosResponse<VerifyEmailResponse>> =>
  API.post<VerifyEmailResponse>('/auth/verify-email', data);

export const LOGIN = (
  data: LoginPayload,
): Promise<AxiosResponse<LoginResponse>> =>
  API.post<LoginResponse>('/auth/login', data);

export const LOGOUT = (
  data: LogoutPayload = {},
): Promise<AxiosResponse<LogoutResponse>> =>
  API.post<LogoutResponse>('/auth/logout', data);

export const VERIFY_MFA = (
  data: VerifyMfaPayload,
): Promise<AxiosResponse<VerifyMfaResponse>> =>
  API.post<VerifyMfaResponse>('/auth/mfa/verify', data);

export const REQUEST_LOGIN_CODE = (
  data: RequestLoginCodePayload,
): Promise<AxiosResponse<RequestLoginCodeResponse>> =>
  API.post<RequestLoginCodeResponse>('/auth/login/email-code', data);

export const GET_MFA_STATUS = (): Promise<AxiosResponse<MfaStatusResponse>> =>
  API.get<MfaStatusResponse>('/auth/mfa/status');

export const SETUP_TOTP = (): Promise<AxiosResponse<TotpEnrollmentResponse>> =>
  API.post<TotpEnrollmentResponse>('/auth/mfa/totp/setup');

export const ENABLE_TOTP = (
  data: EnableTotpPayload,
): Promise<AxiosResponse<BackupCodesResponse>> =>
  API.post<BackupCodesResponse>('/auth/mfa/totp/enable', data);

export const DISABLE_TOTP = (
  data: DisableTotpPayload,
): Promise<AxiosResponse<MfaStatusResponse>> =>
  API.post<MfaStatusResponse>('/auth/mfa/totp/disable', data);

export const REGENERATE_BACKUP_CODES = (
  data: RegenerateBackupCodesPayload,
): Promise<AxiosResponse<BackupCodesResponse>> =>
  API.post<BackupCodesResponse>('/auth/mfa/backup-codes/regenerate', data);

export const PATCH_MFA_PREFERENCES = (
  data: UpdateMfaPreferencesPayload,
): Promise<AxiosResponse<MfaStatusResponse>> =>
  API.patch<MfaStatusResponse>('/auth/mfa/preferences', data);

export const REFRESH_TOKEN = (
  data: RefreshTokenPayload = {},
): Promise<AxiosResponse<RefreshTokenResponse>> =>
  API.post<RefreshTokenResponse>('/auth/refresh', data);

export const GET_ME = (): Promise<AxiosResponse<GetMeResponse>> =>
  API.get<GetMeResponse>('/auth/me');

export const GET_IN_APP_NOTIFICATIONS = (
  limit = 30,
): Promise<AxiosResponse<InAppNotificationListResponse>> =>
  API.get<InAppNotificationListResponse>('/notifications/in-app', {
    params: { limit },
  });

export const MARK_IN_APP_NOTIFICATION_READ = (
  notificationId: string,
): Promise<AxiosResponse<InAppNotificationMarkReadResponse>> =>
  API.patch<InAppNotificationMarkReadResponse>(
    `/notifications/in-app/${encodeURIComponent(notificationId)}/read`,
  );

export const MARK_ALL_IN_APP_NOTIFICATIONS_READ =
  (): Promise<AxiosResponse<InAppNotificationMarkAllReadResponse>> =>
    API.patch<InAppNotificationMarkAllReadResponse>(
      '/notifications/in-app/read-all',
    );

export const GET_BILLING_PLANS = (): Promise<AxiosResponse<BillingPlansResponse>> =>
  API.get<BillingPlansResponse>('/billing/plans');

export const GET_BILLING_PLAN_BY_ID = (
  planId: string,
): Promise<AxiosResponse<BillingPlanResponse>> =>
  API.get<BillingPlanResponse>(`/billing/plans/${encodeURIComponent(planId)}`);

export const GET_TENANT_SUBSCRIPTION = (): Promise<
  AxiosResponse<TenantSubscriptionResponse>
> => API.get<TenantSubscriptionResponse>('/billing/subscription');

export const GET_TENANT_ME = (): Promise<AxiosResponse<TenantProfileResponse>> =>
  API.get<TenantProfileResponse>('/tenants/me');

export const PATCH_TENANT_ME = (
  data: UpdateTenantPayload,
): Promise<AxiosResponse<TenantProfileResponse>> =>
  API.patch<TenantProfileResponse>('/tenants/me', data);

export const PATCH_TENANT_USER_ME = (
  data: UpdateTenantMePayload,
): Promise<AxiosResponse<TenantMePatchResponse>> =>
  API.patch<TenantMePatchResponse>('/tenant/me', data);

export const GET_TENANT_USERS = (
  query: ListTenantUsersQuery = {},
): Promise<AxiosResponse<TenantUserListResponse>> =>
  API.get<TenantUserListResponse>('/tenant/users', {
    params: query,
  });

export const INVITE_TENANT_USER = (
  data: InviteTenantUserPayload,
): Promise<AxiosResponse<InviteTenantUserResponse>> =>
  API.post<InviteTenantUserResponse>('/tenant/users', data);

export const GET_TENANT_USER_BY_ID = (
  userId: string,
): Promise<AxiosResponse<TenantUserDetailResponse>> =>
  API.get<TenantUserDetailResponse>(
    `/tenant/users/${encodeURIComponent(userId)}`,
  );

export const PATCH_TENANT_USER = (
  userId: string,
  data: UpdateTenantUserPayload,
): Promise<AxiosResponse<UpdateTenantUserResponse>> =>
  API.patch<UpdateTenantUserResponse>(
    `/tenant/users/${encodeURIComponent(userId)}`,
    data,
  );

export const DELETE_TENANT_USER = (
  userId: string,
): Promise<AxiosResponse<DeleteTenantUserResponse>> =>
  API.delete<DeleteTenantUserResponse>(
    `/tenant/users/${encodeURIComponent(userId)}`,
  );

export const CREATE_CHECKOUT_SESSION = (
  data: CreateCheckoutSessionPayload,
): Promise<AxiosResponse<CheckoutSessionResponse>> =>
  API.post<CheckoutSessionResponse>('/billing/checkout-session', data);

export const CONFIRM_CHECKOUT_SUCCESS = (
  data: ConfirmCheckoutSessionPayload,
): Promise<AxiosResponse<CheckoutSuccessSyncResponse>> =>
  API.post<CheckoutSuccessSyncResponse>('/billing/checkout-success', data);

export const CANCEL_TENANT_SUBSCRIPTION = (
  data: CancelSubscriptionPayload = {},
): Promise<AxiosResponse<CancelSubscriptionResponse>> =>
  API.post<CancelSubscriptionResponse>('/billing/subscription/cancel', data);

export const REQUEST_TENANT_SUBSCRIPTION_REFUND = (
  data: RequestRefundPayload = {},
): Promise<AxiosResponse<RefundRequestResponse>> =>
  API.post<RefundRequestResponse>('/billing/subscription/refund', data);

export const GET_WORKSPACE_TASKS = (
  workspaceId: string,
  query: ListWorkspaceTasksQuery = {},
): Promise<AxiosResponse<WorkspaceTaskListResponse>> =>
  API.get<WorkspaceTaskListResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/tasks`,
    { params: query },
  );

/** GET /workspaces/me/tasks — tasks assigned to the signed-in user across all workspaces. */
export const GET_MY_TASKS = (
  query: Omit<ListWorkspaceTasksQuery, 'assignedTo'> = {},
): Promise<AxiosResponse<WorkspaceTaskListResponse>> =>
  API.get<WorkspaceTaskListResponse>('/workspaces/me/tasks', { params: query });

export const GET_WORKSPACE_TASK_DETAILS = (
  workspaceId: string,
  taskId: string,
): Promise<AxiosResponse<WorkspaceTaskResponse>> =>
  API.get<WorkspaceTaskResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/tasks/${encodeURIComponent(taskId)}`,
  );

export const CREATE_WORKSPACE_TASK = (
  workspaceId: string,
  data: CreateWorkspaceTaskPayload,
): Promise<AxiosResponse<WorkspaceTaskResponse>> =>
  API.post<WorkspaceTaskResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/tasks`,
    data,
  );

export const UPDATE_WORKSPACE_TASK = (
  workspaceId: string,
  taskId: string,
  data: UpdateWorkspaceTaskPayload,
): Promise<AxiosResponse<WorkspaceTaskResponse>> =>
  API.patch<WorkspaceTaskResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/tasks/${encodeURIComponent(taskId)}`,
    data,
  );

export const DELETE_WORKSPACE_TASK = (
  workspaceId: string,
  taskId: string,
): Promise<AxiosResponse<WorkspaceTaskDeleteResponse>> =>
  API.delete<WorkspaceTaskDeleteResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}/tasks/${encodeURIComponent(taskId)}`,
  );

export const CREATE_UPLOAD_SIGNATURE = (
  data: CreateUploadSignaturePayload,
): Promise<AxiosResponse<CreateUploadSignatureResponse>> =>
  API.post<CreateUploadSignatureResponse>('/files/upload-signature', data);

export const REGISTER_FILE_ASSET = (
  data: RegisterFileAssetPayload,
): Promise<AxiosResponse<RegisterFileAssetResponse>> =>
  API.post<RegisterFileAssetResponse>('/files/assets', data);

export const DELETE_FILE_ASSET = (
  data: DeleteFileAssetPayload,
): Promise<AxiosResponse<FileAssetDeleteResponse>> =>
  API.delete<FileAssetDeleteResponse>('/files/assets', {
    data,
  });

export const GET_WORKSPACES = (): Promise<AxiosResponse<WorkspaceListResponse>> =>
  API.get<WorkspaceListResponse>('/workspaces');

export const CREATE_WORKSPACE = (
  data: CreateWorkspacePayload,
): Promise<AxiosResponse<WorkspaceResponse>> =>
  API.post<WorkspaceResponse>('/workspaces', data);

export const DELETE_WORKSPACE = (
  workspaceId: string,
): Promise<AxiosResponse<WorkspaceDeleteResponse>> =>
  API.delete<WorkspaceDeleteResponse>(
    `/workspaces/${encodeURIComponent(workspaceId)}`,
  );

export const GET_CHAT_ELIGIBILITY = (): Promise<AxiosResponse<ChatEligibilityResponse>> =>
  API.get<ChatEligibilityResponse>('/chat/eligibility');

export const LIST_CHAT_SESSIONS = (
  limit = 30,
): Promise<AxiosResponse<ChatSessionListResponse>> =>
  API.get<ChatSessionListResponse>('/chat/sessions', { params: { limit } });

export const CREATE_CHAT_SESSION = (
  data: CreateChatSessionPayload = {},
): Promise<AxiosResponse<ChatSessionCreateResponse>> =>
  API.post<ChatSessionCreateResponse>('/chat/sessions', data);

export const PATCH_CHAT_SESSION = (
  sessionId: string,
  data: PatchChatSessionPayload,
): Promise<AxiosResponse<ChatSessionPatchResponse>> =>
  API.patch<ChatSessionPatchResponse>(
    `/chat/sessions/${encodeURIComponent(sessionId)}`,
    data,
  );

export const DELETE_CHAT_SESSION = (
  sessionId: string,
): Promise<AxiosResponse<ChatSessionDeleteResponse>> =>
  API.delete<ChatSessionDeleteResponse>(
    `/chat/sessions/${encodeURIComponent(sessionId)}`,
  );

export const GET_CHAT_MESSAGES = (
  sessionId: string,
  limit = 100,
): Promise<AxiosResponse<ChatMessagesListResponse>> =>
  API.get<ChatMessagesListResponse>(
    `/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    { params: { limit } },
  );

export const SEND_CHAT_MESSAGE = (
  sessionId: string,
  data: SendChatMessagePayload,
): Promise<AxiosResponse<ChatSendMessageResponse>> =>
  API.post<ChatSendMessageResponse>(
    `/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    data,
  );
