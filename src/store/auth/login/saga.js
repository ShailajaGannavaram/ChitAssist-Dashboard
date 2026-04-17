import { call, put, takeEvery } from "redux-saga/effects";
import { LOGIN_USER, LOGOUT_USER } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";
import { postAdminLogin } from "../../../helpers/fakebackend_helper";

function* loginUser({ payload: { user, history } }) {
  try {
    const response = yield call(postAdminLogin, {
      email: user.email,
      password: user.password,
    });
    const userData = response.data || response;
    localStorage.setItem("authUser", JSON.stringify(userData));
    yield put(loginSuccess(userData));
    history("/dashboard");
  } catch (error) {
    yield put(apiError("Invalid email or password"));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");
    yield put(logoutUserSuccess({}));
    history("/login");
  } catch (error) {
    yield put(apiError(error));
  }
}

function* authSaga() {
  yield takeEvery(LOGIN_USER, loginUser);
  yield takeEvery(LOGOUT_USER, logoutUser);
}

export default authSaga;