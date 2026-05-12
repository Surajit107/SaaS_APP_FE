import { createAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { all, call, put, select, takeLatest } from 'redux-saga/effects';

import {
  bootstrapEligibleCompleted,
  bootstrapFailed,
  bootstrapIneligibleCompleted,
  bootstrapRequested,
  createSessionFailed,
  createSessionRequested,
  createSessionSucceeded,
  deleteSessionFailed,
  deleteSessionRequested,
  deleteSessionSucceeded,
  selectSessionFailed,
  selectSessionRequested,
  selectSessionSucceeded,
  sendMessageFailed,
  sendMessageRequested,
  sendMessageSucceeded,
} from '@/features/tenant/slice/tenantFloatingChatSlice';
import {
  CREATE_CHAT_SESSION,
  DELETE_CHAT_SESSION,
  GET_CHAT_ELIGIBILITY,
  GET_CHAT_MESSAGES,
  LIST_CHAT_SESSIONS,
  SEND_CHAT_MESSAGE,
  type ChatSession,
} from '@/lib/api/Api';
import { getApiErrorMessage } from '@/lib/api/errorMessage';
import type { RootState } from '@/store/store';

const CHAT_SESSION_LIST_LIMIT = 40;

export const tenantFloatingChatBootstrapFlowRequested = createAction(
  'tenantFloatingChat/bootstrapFlowRequested',
);

export const tenantFloatingChatSelectSessionFlowRequested = createAction<{
  sessionId: string;
}>('tenantFloatingChat/selectSessionFlowRequested');

export const tenantFloatingChatCreateSessionFlowRequested = createAction(
  'tenantFloatingChat/createSessionFlowRequested',
);

export const tenantFloatingChatSendMessageFlowRequested = createAction<{
  content: string;
}>('tenantFloatingChat/sendMessageFlowRequested');

export const tenantFloatingChatDeleteSessionFlowRequested = createAction<{
  sessionId: string;
}>('tenantFloatingChat/deleteSessionFlowRequested');

function* handleBootstrapFlow(): Generator {
  try {
    const { isPrimed, allowed } = (yield select((s: RootState) => ({
      isPrimed: s.tenantFloatingChat.isPrimed,
      allowed: s.tenantFloatingChat.allowed,
    }))) as { isPrimed: boolean; allowed: boolean | null };

    const skipInitialSpinner = isPrimed === true && allowed === true;
    if (!skipInitialSpinner) {
      yield put(bootstrapRequested());
    }

    const elig = (yield call(GET_CHAT_ELIGIBILITY)) as Awaited<
      ReturnType<typeof GET_CHAT_ELIGIBILITY>
    >;
    if (!elig.data.data.allowed) {
      yield put(bootstrapIneligibleCompleted());
      return;
    }

    if (skipInitialSpinner) {
      return;
    }

    let rows = (yield call(LIST_CHAT_SESSIONS, CHAT_SESSION_LIST_LIMIT)) as Awaited<
      ReturnType<typeof LIST_CHAT_SESSIONS>
    >;
    let sessions = rows.data.data;
    if (sessions.length === 0) {
      const created = (yield call(CREATE_CHAT_SESSION, {})) as Awaited<
        ReturnType<typeof CREATE_CHAT_SESSION>
      >;
      sessions = [created.data.data];
    }
    const firstId = sessions[0]?.id;
    if (firstId === undefined) {
      yield put(bootstrapFailed('Unable to load assistant'));
      return;
    }
    const msgRes = (yield call(GET_CHAT_MESSAGES, firstId)) as Awaited<
      ReturnType<typeof GET_CHAT_MESSAGES>
    >;
    yield put(
      bootstrapEligibleCompleted({
        sessions,
        activeSessionId: firstId,
        messages: msgRes.data.data,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to load assistant');
    yield put(bootstrapFailed(message));
  }
}

function* handleSelectSessionFlow(
  action: ReturnType<typeof tenantFloatingChatSelectSessionFlowRequested>,
): Generator {
  const { sessionId } = action.payload;
  try {
    yield put(selectSessionRequested(sessionId));
    const msgRes = (yield call(GET_CHAT_MESSAGES, sessionId)) as Awaited<
      ReturnType<typeof GET_CHAT_MESSAGES>
    >;
    yield put(selectSessionSucceeded(msgRes.data.data));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      yield put(bootstrapIneligibleCompleted());
    }
    const message = getApiErrorMessage(error, 'Unable to load messages');
    yield put(selectSessionFailed(message));
  }
}

function* handleCreateSessionFlow(): Generator {
  try {
    yield put(createSessionRequested());
    const res = (yield call(CREATE_CHAT_SESSION, {})) as Awaited<
      ReturnType<typeof CREATE_CHAT_SESSION>
    >;
    const session = res.data.data;
    const msgRes = (yield call(GET_CHAT_MESSAGES, session.id)) as Awaited<
      ReturnType<typeof GET_CHAT_MESSAGES>
    >;
    yield put(createSessionSucceeded({ session, messages: msgRes.data.data }));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      yield put(bootstrapIneligibleCompleted());
    }
    const message = getApiErrorMessage(error, 'Unable to start a new chat');
    yield put(createSessionFailed(message));
  }
}

function* handleSendMessageFlow(
  action: ReturnType<typeof tenantFloatingChatSendMessageFlowRequested>,
): Generator {
  const activeSessionId = (yield select(
    (s: RootState) => s.tenantFloatingChat.activeSessionId,
  )) as string | null;
  const text = action.payload.content.trim();
  if (activeSessionId === null || text.length === 0) {
    return;
  }
  try {
    yield put(sendMessageRequested());
    const sendRes = (yield call(SEND_CHAT_MESSAGE, activeSessionId, {
      content: text,
    })) as Awaited<ReturnType<typeof SEND_CHAT_MESSAGE>>;
    const messagesRes = (yield call(GET_CHAT_MESSAGES, activeSessionId)) as Awaited<
      ReturnType<typeof GET_CHAT_MESSAGES>
    >;
    const sessions = (yield select(
      (s: RootState) => s.tenantFloatingChat.sessions,
    )) as ChatSession[];
    const updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? {
            ...s,
            title: s.title === 'New conversation' ? text.slice(0, 80) : s.title,
            updatedAt: new Date().toISOString(),
          }
        : s,
    );
    const assistant = sendRes.data.data.assistantMessage;
    yield put(
      sendMessageSucceeded({
        messages: messagesRes.data.data,
        sessions: updatedSessions,
        assistantRevealSeed: {
          messageId: assistant.id,
          full: assistant.content,
        },
      }),
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      yield put(bootstrapIneligibleCompleted());
    }
    const message = getApiErrorMessage(error, 'Unable to send message');
    yield put(
      sendMessageFailed({
        message,
        draftRestore: action.payload.content.trim(),
      }),
    );
  }
}

function* handleDeleteSessionFlow(
  action: ReturnType<typeof tenantFloatingChatDeleteSessionFlowRequested>,
): Generator {
  const { sessionId } = action.payload;
  try {
    yield put(deleteSessionRequested(sessionId));
    yield call(DELETE_CHAT_SESSION, sessionId);
    const activeSessionId = (yield select(
      (s: RootState) => s.tenantFloatingChat.activeSessionId,
    )) as string | null;
    const sessions = (yield select(
      (s: RootState) => s.tenantFloatingChat.sessions,
    )) as ChatSession[];
    const messages = (yield select(
      (s: RootState) => s.tenantFloatingChat.messages,
    )) as RootState['tenantFloatingChat']['messages'];
    const wasActive = activeSessionId === sessionId;
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (!wasActive) {
      yield put(
        deleteSessionSucceeded({
          sessions: remaining,
          activeSessionId,
          messages,
        }),
      );
      return;
    }
    if (remaining.length > 0) {
      const nextId = remaining[0].id;
      const msgRes = (yield call(GET_CHAT_MESSAGES, nextId)) as Awaited<
        ReturnType<typeof GET_CHAT_MESSAGES>
      >;
      yield put(
        deleteSessionSucceeded({
          sessions: remaining,
          activeSessionId: nextId,
          messages: msgRes.data.data,
        }),
      );
      return;
    }
    const created = (yield call(CREATE_CHAT_SESSION, {})) as Awaited<
      ReturnType<typeof CREATE_CHAT_SESSION>
    >;
    const createdSession = created.data.data;
    const msgRes = (yield call(GET_CHAT_MESSAGES, createdSession.id)) as Awaited<
      ReturnType<typeof GET_CHAT_MESSAGES>
    >;
    yield put(
      deleteSessionSucceeded({
        sessions: [createdSession],
        activeSessionId: createdSession.id,
        messages: msgRes.data.data,
      }),
    );
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, 'Unable to delete chat');
    yield put(deleteSessionFailed(message));
  }
}

export function* tenantFloatingChatSaga(): Generator {
  yield all([
    takeLatest(tenantFloatingChatBootstrapFlowRequested, handleBootstrapFlow),
    takeLatest(tenantFloatingChatSelectSessionFlowRequested, handleSelectSessionFlow),
    takeLatest(tenantFloatingChatCreateSessionFlowRequested, handleCreateSessionFlow),
    takeLatest(tenantFloatingChatSendMessageFlowRequested, handleSendMessageFlow),
    takeLatest(tenantFloatingChatDeleteSessionFlowRequested, handleDeleteSessionFlow),
  ]);
}
