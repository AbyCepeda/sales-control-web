import { api } from "./api";
import type {
  ApiResponse,
  CreateProductRequest,
  Product,
  UpdateProductRequest,
  UpdateProductStatusRequest,
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

    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductRequest>({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products", "Dashboard"],
    }),

    updateProductStatus: builder.mutation<
      ApiResponse<Product>,
      UpdateProductStatusRequest
    >({
      query: ({ id, isActive }) => ({
        url: `/products/${id}/status`,
        method: "PATCH",
        body: {
          isActive,
        },
      }),
      invalidatesTags: ["Products", "Dashboard"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUpdateProductStatusMutation,
} = productsApi;