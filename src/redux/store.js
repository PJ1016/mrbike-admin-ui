import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './slices/searchSlice';
import authReducer from './slices/authSlice';
import bikeReducer from './slices/bikeSlice';
import serviceReducer from './slices/serviceSlice';
import dealerServiceReducer from './slices/dealerServiceSlice';
import { baseApi } from './services/baseApi';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
    bike: bikeReducer,
    service: serviceReducer,
    dealerService: dealerServiceReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
