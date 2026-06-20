import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import recordsReducer from './recordsSlice';
import chatbotReducer from './chatbotSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    records: recordsReducer,
    chatbot: chatbotReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off serialization warning for Date objects, Firebase refs etc.
    }),
});

export default store;
