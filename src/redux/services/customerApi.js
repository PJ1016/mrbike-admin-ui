import { baseApi } from './baseApi';

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: () => '/customers/customerlist',
      // Flatten response assuming the server returns { status: 200, data: [...] }
      transformResponse: (response) => response.data || response,
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query({
      query: (id) => `/customers/view/${id}`,
      transformResponse: (response) => response.data || response,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),
    deleteCustomer: builder.mutation({
      query: (customerId) => ({
        url: '/customers/deletecustomer',
        method: 'DELETE',
        body: { customer_id: customerId },
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useDeleteCustomerMutation,
} = customerApi;
