import { baseApi } from './baseApi';

export const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBaseServices: builder.query({
      query: () => '/service/adminservices',
      transformResponse: (res) => res.data || res,
      providesTags: ['Service'],
    }),
    getAdminServiceById: builder.query({
      query: (id) => `/service/admin/services/${id}`,
      transformResponse: (res) => res.data || (res.status === true ? res : res),
      providesTags: (result, error, id) => [{ type: 'Service', id }],
    }),
  }),
});

export const {
  useGetBaseServicesQuery,
  useGetAdminServiceByIdQuery,
  useLazyGetAdminServiceByIdQuery,
} = serviceApi;
