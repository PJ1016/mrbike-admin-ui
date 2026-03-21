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
  async (companyIds, { rejectWithValue }) => {
    try {
      const response = await filterBikesByCompaniesMultiple(companyIds);
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
  },
  reducers: {},
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
      })
      .addCase(fetchBikesByCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default bikeSlice.reducer;
