import { api } from "./api";
import type { ApiResponse, Order } from "../features/orders/order.types";

export const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => ({
        url: "/orders",
        method: "GET",
      }),
      providesTags: ["Orders"],
    }),
  }),
});

export const { useGetOrdersQuery } = ordersApi;