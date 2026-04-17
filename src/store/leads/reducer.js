const initialState = { leads: [], loading: true, error: null };
const leadsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_LEADS_LOADING": return { ...state, loading: action.payload };
    case "SET_LEADS": return { ...state, leads: action.payload, loading: false };
    default: return state;
  }
};
export default leadsReducer;