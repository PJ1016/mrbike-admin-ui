import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor";

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      // Pull token from Redux state instead of localStorage directly
      const token = getState().auth.token;
      
      if (token) {
        // The existing apiConfig uses the "token" header instead of "Authorization: Bearer"
        headers.set('token', token);
      }
      return headers;
    },
  }),
  // tagTypes are crucial for automated cache invalidation (e.g., refetching lists after a mutation occurs)
  tagTypes: ['Dealer', 'Customer', 'Service', 'AdditionalService', 'Bike', 'Booking', 'Admin', 'Offer', 'Banner'],
  endpoints: () => ({}), // Empty endpoints object. Modules will inject their own endpoints into this base API
});
