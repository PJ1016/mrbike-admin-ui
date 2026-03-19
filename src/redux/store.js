import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import authReducer from './slices/authSlice';
import { baseApi } from './services/baseApi';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
