import { fork, all } from 'redux-saga/effects';

import { tenantSubscriptionSaga } from '@/features/subscription/saga/tenantSubscriptionSaga';
import { tenantAuthSaga } from '@/features/tenant/saga/tenantAuthSaga';
import { tenantUserAdminSaga } from '@/features/tenant/saga/tenantUserAdminSaga';
import { tenantUserListSaga } from '@/features/tenant/saga/tenantUserListSaga';
import { userTaskBoardSaga } from '@/features/workspace/saga/userTaskBoardSaga';
import { workspaceSaga } from '@/features/workspace/saga/workspaceSaga';
import { workspaceTaskBoardSaga } from '@/features/workspace/saga/workspaceTaskBoardSaga';

export function* rootSaga(): Generator {
  yield all([
    fork(tenantAuthSaga),
    fork(tenantUserListSaga),
    fork(tenantUserAdminSaga),
    fork(tenantSubscriptionSaga),
    fork(workspaceSaga),
    fork(workspaceTaskBoardSaga),
    fork(userTaskBoardSaga),
  ]);
}
