import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveDealerServices } from '../../api';

export const submitDealerServices = createAsyncThunk(
  'dealerService/submit',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await saveDealerServices(payload);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const dealerServiceSlice = createSlice({
  name: 'dealerService',
  initialState: {
    selectedBikes: [], // Array of variant objects
    selectedServices: [], // Array of base service IDs
    selectedAdditionalServices: [], // Array of additional service IDs
    // { [serviceId]: { [ccRange]: { price: 0, disabledBikes: [] } } }
    servicePricingByCCRange: {}, 
    // { [serviceId]: { [ccRange]: { price: 0, disabledBikes: [] } } }
    additionalServicePricingByCCRange: {}, 
    isSaving: false,
    saveSuccess: false,
    error: null,
  },
  reducers: {
    setSelectedBikes: (state, action) => {
      state.selectedBikes = action.payload;
    },
    addSelectedBike: (state, action) => {
      const bike = action.payload;
      const bikeId = String(bike._id || bike.id || bike.variant_id);
      if (!state.selectedBikes.find(b => String(b._id || b.id || b.variant_id) === bikeId)) {
        state.selectedBikes.push(bike);
      }
    },
    removeSelectedBike: (state, action) => {
      const bikeId = String(action.payload);
      state.selectedBikes = state.selectedBikes.filter(b => String(b._id || b.id || b.variant_id) !== bikeId);
      
      // Clean up disabledBikes references in all services and CC ranges
      const cleanup = (pricingObj) => {
        Object.keys(pricingObj).forEach(svcId => {
          Object.keys(pricingObj[svcId]).forEach(cc => {
            if (pricingObj[svcId][cc].disabledBikes) {
              pricingObj[svcId][cc].disabledBikes = pricingObj[svcId][cc].disabledBikes.filter(id => id !== bikeId);
            }
          });
        });
      };
      cleanup(state.servicePricingByCCRange);
      cleanup(state.additionalServicePricingByCCRange);
    },
    toggleService: (state, action) => {
      const serviceId = String(action.payload);
      if (!serviceId) return;
      if (state.selectedServices.includes(serviceId)) {
        state.selectedServices = state.selectedServices.filter(id => String(id) !== serviceId);
        delete state.servicePricingByCCRange[serviceId];
      } else {
        state.selectedServices.push(serviceId);
      }
    },
    toggleAdditionalService: (state, action) => {
      const serviceId = String(action.payload);
      if (!serviceId) return;
      if (state.selectedAdditionalServices.includes(serviceId)) {
        state.selectedAdditionalServices = state.selectedAdditionalServices.filter(id => String(id) !== serviceId);
        delete state.additionalServicePricingByCCRange[serviceId];
      } else {
        state.selectedAdditionalServices.push(serviceId);
      }
    },
    setCCRangePrice: (state, action) => {
      const { serviceId, ccRange, price, isAdditional = false } = action.payload;
      const target = isAdditional ? 'additionalServicePricingByCCRange' : 'servicePricingByCCRange';
      
      if (!state[target][serviceId]) {
        state[target][serviceId] = {};
      }
      if (!state[target][serviceId][ccRange]) {
        state[target][serviceId][ccRange] = { price: 0, disabledBikes: [], bikeOverrides: {} };
      }
      state[target][serviceId][ccRange].price = Number(price);
    },
    setBikeOverridePrice: (state, action) => {
      const { serviceId, ccRange, variantId, price, isAdditional = false } = action.payload;
      const target = isAdditional ? 'additionalServicePricingByCCRange' : 'servicePricingByCCRange';
      
      if (!state[target][serviceId]) {
        state[target][serviceId] = {};
      }
      if (!state[target][serviceId][ccRange]) {
        state[target][serviceId][ccRange] = { price: 0, disabledBikes: [], bikeOverrides: {} };
      }
      if (!state[target][serviceId][ccRange].bikeOverrides) {
        state[target][serviceId][ccRange].bikeOverrides = {};
      }
      
      if (price === "" || price === null || price === undefined) {
        delete state[target][serviceId][ccRange].bikeOverrides[variantId];
      } else {
        state[target][serviceId][ccRange].bikeOverrides[variantId] = Number(price);
      }
    },
    toggleBikeInCCRange: (state, action) => {
      const { serviceId, ccRange, variantId, isAdditional = false } = action.payload;
      const target = isAdditional ? 'additionalServicePricingByCCRange' : 'servicePricingByCCRange';
      
      if (!state[target][serviceId]) {
        state[target][serviceId] = {};
      }
      if (!state[target][serviceId][ccRange]) {
        state[target][serviceId][ccRange] = { price: 0, disabledBikes: [], bikeOverrides: {} };
      }
      
      const disabledBikes = state[target][serviceId][ccRange].disabledBikes || [];
      if (disabledBikes.includes(variantId)) {
        state[target][serviceId][ccRange].disabledBikes = disabledBikes.filter(id => id !== variantId);
      } else {
        state[target][serviceId][ccRange].disabledBikes.push(variantId);
      }
    },
    resetSelection: (state) => {
        state.selectedBikes = [];
        state.selectedServices = [];
        state.selectedAdditionalServices = [];
        state.servicePricingByCCRange = {};
        state.additionalServicePricingByCCRange = {};
    },
    resetSaveStatus: (state) => {
      state.saveSuccess = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitDealerServices.pending, (state) => {
        state.isSaving = true;
        state.saveSuccess = false;
        state.error = null;
      })
      .addCase(submitDealerServices.fulfilled, (state) => {
        state.isSaving = false;
        state.saveSuccess = true;
      })
      .addCase(submitDealerServices.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const { 
    setSelectedBikes, 
    addSelectedBike, 
    removeSelectedBike, 
    toggleService, 
    toggleAdditionalService, 
    setCCRangePrice,
    setBikeOverridePrice,
    toggleBikeInCCRange,
    resetSelection,
    resetSaveStatus 
} = dealerServiceSlice.actions;

export default dealerServiceSlice.reducer;
