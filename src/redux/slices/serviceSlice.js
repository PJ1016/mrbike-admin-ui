import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBaseServiceList, getBaseAdditionalServiceList } from '../../api';

export const fetchBaseServices = createAsyncThunk(
  'service/fetchBaseServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBaseServiceList();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdditionalServices = createAsyncThunk(
  'service/fetchAdditionalServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBaseAdditionalServiceList();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const serviceSlice = createSlice({
  name: 'service',
  initialState: {
    baseServices: [],
    additionalServices: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBaseServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBaseServices.fulfilled, (state, action) => {
        state.loading = false;
        state.baseServices = action.payload;
      })
      .addCase(fetchBaseServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAdditionalServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdditionalServices.fulfilled, (state, action) => {
        state.loading = false;
        state.additionalServices = action.payload;
      })
      .addCase(fetchAdditionalServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default serviceSlice.reducer;
