import { combineReducers } from "redux"
import Layout from "./layout/reducer"
import Breadcrumb from "./Breadcrumb/reducer"
import Login from "./auth/login/reducer"
import Account from "./auth/register/reducer"
import ForgetPassword from "./auth/forgetpwd/reducer"
import Profile from "./auth/profile/reducer"
import dashboardReducer from "./dashboard/reducer"
import leadsReducer from "./leads/reducer"
import conversationsReducer from "./conversations/reducer"
import botConfigReducer from "./botconfig/reducer"

const rootReducer = combineReducers({
  Layout, Breadcrumb, Login, Account, ForgetPassword, Profile,
  Dashboard: dashboardReducer,
  Leads: leadsReducer,
  Conversations: conversationsReducer,
  BotConfig: botConfigReducer,
})
export default rootReducer