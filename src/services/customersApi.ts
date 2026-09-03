import { api } from "./api";
import type {
  ApiResponse,
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
  UpdateCustomerStatusRequest,
} from "../features/customers/customer.types";

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ApiResponse<Customer[]>, void>({
      query: () => ({
        url: "/customers",
        method: "GET",
      }),
      providesTags: ["Customers"],
    }),

    createCustomer: builder.mutation<ApiResponse<Customer>, CreateCustomerRequest>({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),

    updateCustomer: builder.mutation<ApiResponse<Customer>, UpdateCustomerRequest>({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),

    updateCustomerStatus: builder.mutation<
      ApiResponse<Customer>,
      UpdateCustomerStatusRequest
    >({
      query: ({ id, isActive }) => ({
        url: `/customers/${id}/status`,
        method: "PATCH",
        body: {
          isActive,
        },
      }),
      invalidatesTags: ["Customers", "Dashboard"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useUpdateCustomerStatusMutation,
} = customersApi;