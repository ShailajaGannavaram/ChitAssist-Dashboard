import { call, put, takeEvery } from "redux-saga/effects";
import { setBotConfig, setBotConfigLoading } from "../actions";
import { getBotConfig, updateBotConfig } from "../../helpers/fakebackend_helper";

function* fetchBotConfigSaga({ payload: { botId } }) {
  try {
    yield put(setBotConfigLoading(true));
    const data = yield call(getBotConfig, botId);
    yield put(setBotConfig(data));
  } catch (e) { yield put(setBotConfigLoading(false)); }
}

function* saveBotConfigSaga({ payload }) {
  try {
    yield put({ type: "SET_BOT_CONFIG_SAVING", payload: true });
    yield call(updateBotConfig, payload);
    yield put({ type: "SET_BOT_CONFIG_SAVE_SUCCESS", payload });
  } catch (e) {
    yield put({ type: "SET_BOT_CONFIG_SAVE_ERROR", payload: "Save failed. Please try again." });
  }
}

function* botConfigSaga() {
  yield takeEvery("FETCH_BOT_CONFIG", fetchBotConfigSaga);
  yield takeEvery("SAVE_BOT_CONFIG", saveBotConfigSaga);
}

export default botConfigSaga;