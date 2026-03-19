import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
  },
});

export default store;
