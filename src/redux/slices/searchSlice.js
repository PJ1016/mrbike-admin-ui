import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCustomerList, getDealerList, getServiceList } from '../../api';

// Async thunk to fetch all data for global search
export const fetchGlobalSearchData = createAsyncThunk(
  'search/fetchAllData',
  async (_, { rejectWithValue }) => {
    try {
      const [customersRes, dealersRes, servicesRes] = await Promise.all([
        getCustomerList(),
        getDealerList(),
        getServiceList()
      ]);

      return {
        users: (customersRes?.data || []).map(u => ({
          ...u,
          id: u.customerId || u.id,
          name: `${u.first_name} ${u.last_name}`.trim(),
          type: 'User',
          targetId: u._id
        })),
        dealers: (dealersRes?.data || []).map(d => ({
          ...d,
          id: d.dealerId || d.id,
          name: d.shopName || d.ownerName,
          type: 'Dealer',
          targetId: d._id
        })),
        services: (servicesRes?.data || []).map(s => ({
          ...s,
          id: s.serviceId || s.id,
          name: s.base_service_id?.name || 'Unknown Service',
          type: 'Service',
          targetId: s._id
        }))
      };
    } catch (error) {
      console.error("Failed to fetch global search data:", error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  dealers: [],
  services: [],
  loading: false,
  error: null,
  lastFetched: null
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSearchData: (state) => {
      state.users = [];
      state.dealers = [];
      state.services = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGlobalSearchData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalSearchData.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.dealers = action.payload.dealers;
        state.services = action.payload.services;
        state.lastFetched = Date.now();
      })
      .addCase(fetchGlobalSearchData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearSearchData } = searchSlice.actions;

// Selectors
export const selectAllSearchOptions = (state) => [
  ...state.search.users,
  ...state.search.dealers,
  ...state.search.services
];

export const selectUserById = (state, id) => 
  state.search.users.find(u => u.targetId === id || u._id === id || u.customerId === id);

export const selectServiceById = (state, id) => 
  state.search.services.find(s => s.targetId === id || s._id === id);

export default searchSlice.reducer;
