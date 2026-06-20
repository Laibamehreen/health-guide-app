import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [
    {
      id: 'welcome-msg',
      text: "Hello! I am your AI Health Assistant. Ask me anything about health, diet, or fitness. \n\n*Disclaimer: I provide information for general guidance. I am not a doctor. In case of medical emergencies, please consult a healthcare professional.*",
      sender: 'bot',
      timestamp: new Date().toISOString(),
    },
  ],
  loading: false,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setChatLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearChat: (state) => {
      state.messages = [initialState.messages[0]];
    },
  },
});

export const { addMessage, setMessages, setChatLoading, clearChat } = chatbotSlice.actions;

export default chatbotSlice.reducer;
