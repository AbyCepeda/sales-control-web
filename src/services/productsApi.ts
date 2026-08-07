import { api } from "./api";
import type {
  ApiResponse,
  CreateProductRequest,
  Product,
} from "../features/products/product.types";

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ApiResponse<Product[]>, void>({
      query: () => ({
        url: "/products",
        method: "GET",
      }),
      providesTags: ["Products"],
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductRequest>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "Dashboard"],
    }),
  }),
});

export const { useGetProductsQuery, useCreateProductMutation } = productsApi;