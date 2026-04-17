export * from "./layout/actions"
export * from "./auth/register/actions"
export * from "./auth/login/actions"
export * from "./auth/forgetpwd/actions"
export * from "./auth/profile/actions"
export * from "./Breadcrumb/actions"

// Dashboard
export const fetchDashboardData = (botId) => ({ type: "FETCH_DASHBOARD_DATA", payload: { botId } });
export const setDashboardData = (data) => ({ type: "SET_DASHBOARD_DATA", payload: data });
export const setDashboardLoading = (loading) => ({ type: "SET_DASHBOARD_LOADING", payload: loading });

// Leads
export const fetchLeads = (botId) => ({ type: "FETCH_LEADS", payload: { botId } });
export const setLeads = (data) => ({ type: "SET_LEADS", payload: data });
export const setLeadsLoading = (loading) => ({ type: "SET_LEADS_LOADING", payload: loading });

// Conversations
export const fetchConversations = (botId) => ({ type: "FETCH_CONVERSATIONS", payload: { botId } });
export const setConversations = (data) => ({ type: "SET_CONVERSATIONS", payload: data });
export const setConversationsLoading = (loading) => ({ type: "SET_CONVERSATIONS_LOADING", payload: loading });
export const fetchConversationHistory = (sessionId, botId) => ({ type: "FETCH_CONVERSATION_HISTORY", payload: { sessionId, botId } });
export const setConversationHistory = (data) => ({ type: "SET_CONVERSATION_HISTORY", payload: data });

// BotConfig
export const fetchBotConfig = (botId) => ({ type: "FETCH_BOT_CONFIG", payload: { botId } });
export const setBotConfig = (data) => ({ type: "SET_BOT_CONFIG", payload: data });
export const setBotConfigLoading = (loading) => ({ type: "SET_BOT_CONFIG_LOADING", payload: loading });
export const saveBotConfig = (data) => ({ type: "SAVE_BOT_CONFIG", payload: data });