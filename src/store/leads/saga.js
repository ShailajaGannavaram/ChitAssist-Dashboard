import { call, put, takeEvery } from "redux-saga/effects";
import { setLeads, setLeadsLoading } from "../actions";
import { getLeads } from "../../helpers/fakebackend_helper";
function* fetchLeadsSaga({ payload: { botId } }) {
  try {
    yield put(setLeadsLoading(true));
    const data = yield call(getLeads, botId);
    yield put(setLeads(Array.isArray(data) ? data : []));
  } catch (e) { yield put(setLeadsLoading(false)); }
}
function* leadsSaga() { yield takeEvery("FETCH_LEADS", fetchLeadsSaga); }
export default leadsSaga;