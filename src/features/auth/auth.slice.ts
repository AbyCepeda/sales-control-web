import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser } from "./auth.types";

type CredentialsPayload = {
  token: string;
  user: AuthUser;
};

const initialState: AuthState = {
  token: localStorage.getItem("sales_control_token"),
  user: localStorage.getItem("sales_control_user")
    ? JSON.parse(localStorage.getItem("sales_control_user") as string)
    : null,
  isAuthenticated: Boolean(localStorage.getItem("sales_control_token")),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<CredentialsPayload>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;

      localStorage.setItem("sales_control_token", action.payload.token);
      localStorage.setItem(
        "sales_control_user",
        JSON.stringify(action.payload.user),
      );
    },

    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;

      localStorage.removeItem("sales_control_token");
      localStorage.removeItem("sales_control_user");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;