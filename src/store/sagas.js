import { all, fork } from "redux-saga/effects"
import AccountSaga from "./auth/register/saga"
import AuthSaga from "./auth/login/saga"
import ForgetSaga from "./auth/forgetpwd/saga"
import ProfileSaga from "./auth/profile/saga"
import LayoutSaga from "./layout/saga"
import dashboardSaga from "./dashboard/saga"
import leadsSaga from "./leads/saga"
import conversationsSaga from "./conversations/saga"
import botConfigSaga from "./botconfig/saga"

export default function* rootSaga() {
  yield all([
    AccountSaga(), fork(AuthSaga), ProfileSaga(), ForgetSaga(), LayoutSaga(),
    fork(dashboardSaga), fork(leadsSaga), fork(conversationsSaga), fork(botConfigSaga),
  ])
}