import { call, put, takeEvery } from "redux-saga/effects";
import { LOGIN_USER, LOGOUT_USER } from "./actionTypes";
import { apiError, loginSuccess, logoutUserSuccess } from "./actions";
import { postAdminLogin } from "../../../helpers/fakebackend_helper";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

// Auto refresh token before expiry
const scheduleTokenRefresh = (refreshToken, rememberMe) => {
  // Refresh 5 minutes before expiry (access token is 30 min)
  const refreshIn = 25 * 60 * 1000;
  setTimeout(async () => {
    try {
      const res = await fetch(`${API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        authUser.access = data.access;
        localStorage.setItem("authUser", JSON.stringify(authUser));
        // Schedule next refresh
        scheduleTokenRefresh(refreshToken, rememberMe);
      }
    } catch (e) {
      console.log("Token refresh failed:", e);
    }
  }, refreshIn);
};

function* loginUser({ payload: { user, history } }) {
  try {
    const response = yield call(postAdminLogin, {
      email: user.email,
      password: user.password,
    });
    const userData = response.data || response;

    // If Remember Me — store in localStorage (persists after browser close)
    // If not — store in sessionStorage (cleared when browser closes)
    if (user.rememberMe) {
      localStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.setItem("rememberMe", "false");
    }

    // Start auto token refresh
    if (userData.refresh) {
      scheduleTokenRefresh(userData.refresh, user.rememberMe);
    }

    yield put(loginSuccess(userData));
    history("/dashboard");
  } catch (error) {
    yield put(apiError("Invalid email or password"));
  }
}

function* logoutUser({ payload: { history } }) {
  try {
    localStorage.removeItem("authUser");
    localStorage.removeItem("rememberMe");
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