import { post, get, patch } from "./api_helper";
import * as url from "./url_helper";

export const postJwtLogin = (data) => post(url.POST_JWT_LOGIN, data);
export const postAdminLogin = (data) => post(url.POST_ADMIN_LOGIN, data);

export const getDashboardStats = (botId) => get(`${url.GET_DASHBOARD_STATS}?bot_id=${botId}`);
export const getLeadsChart = (botId) => get(`${url.GET_LEADS_CHART}?bot_id=${botId}`);
export const getConversationsChart = (botId) => get(`${url.GET_CONVERSATIONS_CHART}?bot_id=${botId}`);
export const getLeads = (botId) => get(`${url.GET_LEADS}?bot_id=${botId}`);
export const getRecentLeads = (botId) => get(`${url.GET_RECENT_LEADS}?bot_id=${botId}`);
export const getConversations = (botId) => get(`${url.GET_CONVERSATIONS}?bot_id=${botId}`);
export const getBotConfig = (botId) => get(`${url.GET_BOT_CONFIG}?bot_id=${botId}`);
export const updateBotConfig = (data) => post(url.UPDATE_BOT_CONFIG, data);
export const getAdminAllBots = () => get(url.GET_ADMIN_ALL_BOTS);

// History: /api/history/<session_id>/?bot_id=xxx  (session_id is PATH param)
export const getConversationHistory = (sessionId, botId) =>
  get(`${url.GET_CONVERSATION_HISTORY}?session_id=${sessionId}&bot_id=${botId}`);

// Keep these so template doesn't break
export const postJwtRegister = (data) => post(url.POST_JWT_LOGIN, data);
export const postJwtForgetPwd = (data) => post(url.POST_JWT_LOGIN, data);
export const postJwtProfile = (data) => post(url.POST_JWT_LOGIN, data);
export const postFakeLogin = (data) => post(url.POST_JWT_LOGIN, data);
export const postFakeRegister = (data) => post(url.POST_JWT_LOGIN, data);
export const postFakeForgetPwd = (data) => post(url.POST_JWT_LOGIN, data);
export const postFakeProfile = (data) => post(url.POST_JWT_LOGIN, data);