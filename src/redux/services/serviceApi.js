import { baseApi } from './baseApi';

export const serviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBaseServices: builder.query({
      query: () => '/service/admin/base-services',
      transformResponse: (res) => res.data || res,
      providesTags: ['Service'],
    }),
    getAdminServiceById: builder.query({
      query: (id) => `/service/admin/services/${id}`,
      transformResponse: (res) => res.data || (res.status === true ? res : res),
      providesTags: (result, error, id) => [{ type: 'Service', id }],
    }),
    getBaseAdditionalServices: builder.query({
      query: () => '/base-additional-service',
      transformResponse: (res) => res.data || res,
      providesTags: ['AdditionalService'],
    }),
    getAdminAdditionalServiceById: builder.query({
      query: (id) => `/additional-service/admin/additional-services/${id}`,
      transformResponse: (res) => res.data || res,
      providesTags: (result, error, id) => [{ type: 'AdditionalService', id }],
    }),
    getAdminAdditionalServices: builder.query({
      query: () => '/additional-service/admin/additional-services',
      transformResponse: (res) => res.data || res,
      providesTags: ['AdditionalService'],
    }),
  }),
  overrideExisting: false, // This line is added to ensure proper injection
  // The tagTypes property should ideally be defined in the baseApi itself,
  // but if it's meant to be added to the injected endpoints, it would be here.
  // However, the provided snippet places it incorrectly within providesTags.
  // Assuming the instruction "Add AdditionalService tag to baseApi" means
  // that baseApi's tagTypes should be updated, which cannot be done in this file.
  // If it meant to add tagTypes to this specific injected API, it would look like this:
  // tagTypes: ['Dealer', 'Customer', 'Service', 'AdditionalService', 'Bike', 'Booking', 'Admin', 'Offer', 'Banner'],
});

export const {
  useGetBaseServicesQuery,
  useGetAdminServiceByIdQuery,
  useLazyGetAdminServiceByIdQuery,
  useGetBaseAdditionalServicesQuery,
  useGetAdminAdditionalServiceByIdQuery,
  useGetAdminAdditionalServicesQuery,
} = serviceApi;
