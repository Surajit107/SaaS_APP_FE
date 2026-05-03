import { combineReducers } from '@reduxjs/toolkit';

import { tenantSubscriptionSlice } from '@/features/subscription/slice/tenantSubscriptionSlice';
import { tenantAuthSlice } from '@/features/tenant/slice/tenantAuthSlice';
import { tenantUserAdminSlice } from '@/features/tenant/slice/tenantUserAdminSlice';
import { tenantUserListSlice } from '@/features/tenant/slice/tenantUserListSlice';
import { workspaceSlice } from '@/features/workspace/slice/workspaceSlice';
import { workspaceTaskBoardSlice } from '@/features/workspace/slice/workspaceTaskBoardSlice';

export const rootReducer = combineReducers({
  tenantAuth: tenantAuthSlice.reducer,
  tenantUserList: tenantUserListSlice.reducer,
  tenantUserAdmin: tenantUserAdminSlice.reducer,
  tenantSubscription: tenantSubscriptionSlice.reducer,
  workspace: workspaceSlice.reducer,
  workspaceTaskBoard: workspaceTaskBoardSlice.reducer,
});
