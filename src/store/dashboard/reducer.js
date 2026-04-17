const initialState = {
  stats: null,
  leadsChart: [],
  convsChart: [],
  recentLeads: [],
  loading: true,
  error: null,
};

const dashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_DASHBOARD_LOADING":
      return { ...state, loading: action.payload };
    
    case "SET_DASHBOARD_DATA":
      return {
        ...state,
        stats: action.payload.stats,
        leadsChart: action.payload.leadsChart,
        convsChart: action.payload.convsChart,
        recentLeads: action.payload.recentLeads,
        loading: false,
      };
    
    case "DASHBOARD_ERROR":
      return { ...state, error: action.payload, loading: false };
    
    default:
      return state;
  }
};

export default dashboardReducer;