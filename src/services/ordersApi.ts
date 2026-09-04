import { api } from "./api";
import type {
  ApiResponse,
  CreateCustomerOrderPaymentRequest,
  CreateOrderRequest,
  Order,
  UpdateFullOrderRequest,
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

    createOrder: builder.mutation<ApiResponse<Order>, CreateOrderRequest>({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders", "Products", "Dashboard", "Customers"],
    }),

    updateFullOrder: builder.mutation<
      ApiResponse<Order>,
      {
        id: number;
        body: UpdateFullOrderRequest;
      }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/full`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
        "Products",
        "Dashboard",
        "Customers",
      ],
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

    deleteCustomerOrderPayment: builder.mutation<ApiResponse<Order>, number>({
      query: (paymentId) => ({
        url: `/customer-order-payments/${paymentId}`,
        method: "DELETE",
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
  useCreateOrderMutation,
  useUpdateFullOrderMutation,
  useCreateCustomerOrderPaymentMutation,
  useDeleteCustomerOrderPaymentMutation,
} = ordersApi;