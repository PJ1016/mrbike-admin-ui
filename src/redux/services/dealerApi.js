import { baseApi } from './baseApi';

export const dealerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDealers: builder.query({
      query: () => '/dealer/dealerList',
      transformResponse: (res) => res.data || res,
      providesTags: ['Dealer'],
    }),
  }),
});

export const { useGetDealersQuery } = dealerApi;
