import { call, put, takeEvery } from "redux-saga/effects";
import { setConversations, setConversationsLoading, setConversationHistory } from "../actions";
import { getConversations, getConversationHistory } from "../../helpers/fakebackend_helper";
function* fetchConversationsSaga({ payload: { botId } }) {
  try {
    yield put(setConversationsLoading(true));
    const data = yield call(getConversations, botId);
    yield put(setConversations(Array.isArray(data) ? data : []));
  } catch (e) { yield put(setConversationsLoading(false)); }
}
function* fetchHistorySaga({ payload: { sessionId, botId } }) {
  try {
    const data = yield call(getConversationHistory, sessionId, botId);
    yield put(setConversationHistory(data));
  } catch (e) { console.error("History error:", e); }
}
function* conversationsSaga() {
  yield takeEvery("FETCH_CONVERSATIONS", fetchConversationsSaga);
  yield takeEvery("FETCH_CONVERSATION_HISTORY", fetchHistorySaga);
}
export default conversationsSaga;