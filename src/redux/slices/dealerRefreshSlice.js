import { createSlice } from "@reduxjs/toolkit";

const dealerRefreshSlice = createSlice({
  name: "dealerRefresh",
  initialState: { version: 0 },
  reducers: {
    dealerDataChanged: (state) => {
      state.version += 1;
    },
  },
});

export const { dealerDataChanged } = dealerRefreshSlice.actions;
export const selectDealerRefreshVersion = (state) => state.dealerRefresh.version;
export default dealerRefreshSlice.reducer;
