import { api } from "./api";
import type {
  ApiResponse,
  CreateCustomerOrderPaymentRequest,
  Order,
} from "../features/orders/order.types";

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => ({
        url: "/orders",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),

    getOrderById: builder.query<ApiResponse<Order>, number>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Orders", id }],
    }),

    createCustomerOrderPayment: builder.mutation<
      ApiResponse<Order>,
      {
        customerOrderId: number;
        body: CreateCustomerOrderPaymentRequest;
      }
    >({
      query: ({ customerOrderId, body }) => ({
        url: `/customer-orders/${customerOrderId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => {
        const orderId = result?.data?.id;

        return orderId
          ? ["Orders", { type: "Orders", id: orderId }, "Dashboard"]
          : ["Orders", "Dashboard"];
      },
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateCustomerOrderPaymentMutation,
} = ordersApi;