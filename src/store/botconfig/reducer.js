const initialState = { config: null, loading: true, saving: false, saveError: null, saveSuccess: false };
const botConfigReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_BOT_CONFIG_LOADING": return { ...state, loading: action.payload };
    case "SET_BOT_CONFIG": return { ...state, config: action.payload, loading: false };
    case "SET_BOT_CONFIG_SAVING": return { ...state, saving: action.payload, saveError: null, saveSuccess: false };
    case "SET_BOT_CONFIG_SAVE_SUCCESS": return { ...state, saving: false, saveSuccess: true, config: { ...state.config, ...action.payload } };
    case "SET_BOT_CONFIG_SAVE_ERROR": return { ...state, saving: false, saveError: action.payload };
    default: return state;
  }
};
export default botConfigReducer;