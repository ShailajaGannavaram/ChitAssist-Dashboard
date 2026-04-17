// Auth
export const POST_JWT_LOGIN              = "/api/client/token/"
export const POST_ADMIN_LOGIN            = "/api/admin/token/"
export const POST_FAKE_LOGIN             = "/api/client/token/"
export const POST_FAKE_REGISTER          = "/api/client/token/"
export const POST_FAKE_JWT_LOGIN         = "/api/client/token/"
export const POST_FAKE_PASSWORD_FORGET   = "/api/client/token/"
export const POST_FAKE_JWT_PASSWORD_FORGET = "/api/client/token/"
export const SOCIAL_LOGIN                = "/api/client/token/"
export const POST_EDIT_JWT_PROFILE       = "/api/client/token/"
export const POST_EDIT_PROFILE           = "/api/client/token/"

// Dashboard
export const GET_DASHBOARD_STATS         = "/api/client/stats/enhanced/"
export const GET_LEADS_CHART             = "/api/client/leads/chart/"
export const GET_CONVERSATIONS_CHART     = "/api/client/conversations/chart/"

// Leads
export const GET_LEADS                   = "/api/client/leads/"
export const GET_RECENT_LEADS            = "/api/client/leads/recent/"

// Conversations
export const GET_CONVERSATIONS           = "/api/client/conversations/"

// Bot Config
export const GET_BOT_CONFIG              = "/api/config/"
export const UPDATE_BOT_CONFIG           = "/api/config/update/"

// Admin
export const GET_ADMIN_ALL_BOTS          = "/api/admin/bots/"

// Conversation History — session_id is PATH param: /api/history/<session_id>/
export const GET_CONVERSATION_HISTORY    = "/api/history/"