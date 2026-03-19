import { baseApi } from './baseApi';

export const bikeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBikeCompanies: builder.query({
      query: () => '/bike/get-bike-companies',
      transformResponse: (res) => res.data || res,
      providesTags: ['Bike'],
    }),
    getBikesByCompanies: builder.query({
      query: (companyIds) => {
        const queryString = companyIds.join(",");
        return `/bike/bikes/filter-by-company?companyIds=${queryString}`;
      },
      transformResponse: (res) => res.data || res,
      providesTags: ['Bike'],
    }),
  }),
});

export const {
  useGetBikeCompaniesQuery,
  useGetBikesByCompaniesLazyQuery,
  useGetBikesByCompaniesQuery,
} = bikeApi;
