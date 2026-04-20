import React from "react"
import { Navigate } from "react-router-dom"
import Login from "../pages/Authentication/Login"
import Logout from "../pages/Authentication/Logout"
import Register from "../pages/Authentication/Register"
import ForgetPwd from "../pages/Authentication/ForgetPassword"
import Login1 from "../pages/AuthenticationInner/Login"
import Register1 from "../pages/AuthenticationInner/Register"
import Recoverpw from "../pages/AuthenticationInner/Recoverpw"
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen"
import Dashboard from "../pages/Dashboard/index"
import Leads from "../pages/Leads/index"
import Conversations from "../pages/Conversations/index"
import BotConfig from "../pages/BotConfig/index"
import AdminBots from "../pages/AdminBots/index"
import UserManagement from "../pages/UserManagement/index"
import CreateBot from "../pages/CreateBot/index"
import Pages404 from "../pages/Extra Pages/pages-404"
import Pages500 from "../pages/Extra Pages/pages-500"

const userRoutes = [
  { path: "/dashboard",      component: <Dashboard /> },
  { path: "/leads",          component: <Leads /> },
  { path: "/conversations",  component: <Conversations /> },
  { path: "/bot-config",     component: <BotConfig /> },
  { path: "/admin-bots",     component: <AdminBots /> },
  { path: "/users",          component: <UserManagement /> },
  { path: "/create-bot",     component: <CreateBot /> },
  { path: "/", exact: true,  component: <Navigate to="/dashboard" /> },
]

const authRoutes = [
  { path: "/logout",          component: <Logout /> },
  { path: "/login",           component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register",        component: <Register /> },
  { path: "/pages-404",       component: <Pages404 /> },
  { path: "/pages-500",       component: <Pages500 /> },
  { path: "/pages-login",     component: <Login1 /> },
  { path: "/pages-register",  component: <Register1 /> },
  { path: "/page-recoverpw",  component: <Recoverpw /> },
  { path: "/auth-lock-screen",component: <LockScreen /> },
]

export { userRoutes, authRoutes }