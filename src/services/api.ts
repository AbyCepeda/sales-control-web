import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../app/store";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  "https://sales-control-api-eta.vercel.app/api";

console.log("API BASE URL:", baseUrl);

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Auth", "Dashboard", "Products", "Customers", "Orders", "Users"],
  endpoints: () => ({}),
});