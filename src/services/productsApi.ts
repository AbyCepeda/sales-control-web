import { api } from "./api";
import type { ApiResponse, Product } from "../features/products/product.types";

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiResponse<Product[]>, void>({
      query: () => ({
        url: "/products",
        method: "GET",
      }),
      providesTags: ["Products"],
    }),
  }),
});

export const { useGetProductsQuery } = productsApi;