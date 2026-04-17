import { call, put, takeEvery, all } from "redux-saga/effects";
import { setDashboardData, setDashboardLoading } from "../actions";
import {
  getDashboardStats,
  getLeadsChart,
  getConversationsChart,
  getRecentLeads,
} from "../../helpers/fakebackend_helper";

function* fetchDashboardDataSaga({ payload: { botId } }) {
  try {
    yield put(setDashboardLoading(true));

    const [stats, leadsChart, convsChart, recentLeads] = yield all([
      call(getDashboardStats, botId),
      call(getLeadsChart, botId),
      call(getConversationsChart, botId),
      call(getRecentLeads, botId),
    ]);

    yield put(
      setDashboardData({
        stats,
        leadsChart: leadsChart.chart_data || [],
        convsChart: convsChart.chart_data || [],
        recentLeads: Array.isArray(recentLeads) ? recentLeads : [],
      })
    );
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    yield put(setDashboardLoading(false));
  }
}

function* dashboardSaga() {
  yield takeEvery("FETCH_DASHBOARD_DATA", fetchDashboardDataSaga);
}

export default dashboardSaga;