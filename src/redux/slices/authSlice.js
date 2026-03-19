import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage if available
const storedUser = localStorage.getItem("userData");
const token = localStorage.getItem("adminToken");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: token || null,
  isAuthenticated: !!(storedUser && token),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("adminToken", token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
