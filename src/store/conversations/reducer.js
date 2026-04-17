const initialState = { conversations: [], history: null, historyLoading: false, loading: true };
const conversationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_CONVERSATIONS_LOADING": return { ...state, loading: action.payload };
    case "SET_CONVERSATIONS": return { ...state, conversations: action.payload, loading: false };
    case "FETCH_CONVERSATION_HISTORY": return { ...state, historyLoading: true, history: null };
    case "SET_CONVERSATION_HISTORY": return { ...state, history: action.payload, historyLoading: false };
    default: return state;
  }
};
export default conversationsReducer;