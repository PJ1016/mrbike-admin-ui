import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBikeCompanies, filterBikesByCompaniesMultiple } from '../../api';

export const fetchCompanies = createAsyncThunk(
  'bike/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBikeCompanies();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBikesByCompany = createAsyncThunk(
  'bike/fetchBikesByCompany',
  async (companyIds, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const currentCompanyIds = state.bike.lastFetchedCompanyIds;
      
      // Check if we already have data for the same company IDs
      if (currentCompanyIds && 
          Array.isArray(currentCompanyIds) && 
          Array.isArray(companyIds) &&
          companyIds.length === currentCompanyIds.length &&
          companyIds.every(id => currentCompanyIds.includes(id))) {
        // Return existing data instead of making a new API call
        return state.bike.bikes;
      }
      
      const response = await filterBikesByCompaniesMultiple([...companyIds]);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const bikeSlice = createSlice({
  name: 'bike',
  initialState: {
    companies: [],
    bikes: [],
    loading: false,
    error: null,
    lastFetchedCompanyIds: null, // Track last fetched company IDs
  },
  reducers: {
    clearBikes: (state) => {
      state.bikes = [];
      state.lastFetchedCompanyIds = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBikesByCompany.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBikesByCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.bikes = action.payload;
        // Store the company IDs that were fetched - create a copy
        state.lastFetchedCompanyIds = Array.isArray(action.meta.arg) ? [...action.meta.arg] : action.meta.arg;
      })
      .addCase(fetchBikesByCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBikes } = bikeSlice.actions;
export default bikeSlice.reducer;
