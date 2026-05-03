import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Stack,
  Snackbar,
  Alert,
  Skeleton,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import SaveIcon from "@mui/icons-material/Save";
import MopedIcon from "@mui/icons-material/Moped";
import SupportedBikesSection from "./SupportedBikesSection";
import BaseServicesSection from "./BaseServicesSection";
import AdditionalServicesSection from "./AdditionalServicesSection";
import { fetchCompanies } from "../../redux/slices/bikeSlice";
import { fetchBaseServices, fetchAdditionalServices } from "../../redux/slices/serviceSlice";
import { 
  submitDealerServices,
  resetSaveStatus,
  toggleService, 
  toggleAdditionalService,
  hydrateDealerState,
  resetSelection,
  setPickupCharges
} from "../../redux/slices/dealerServiceSlice";
import { getCCRangeKey } from "../../constants/bikeConstants";
import { useDealerServices } from "../../hooks/useDealerServices";

const DealerServicesTab = ({ dealer }) => {
  const dispatch = useDispatch();
  const { 
    selectedBikes, 
    selectedServices, 
    servicePricingByCCRange, 
    selectedAdditionalServices, 
    additionalServicePricingByCCRange,
    isSaving, 
    saveSuccess, 
    error,
    pickupCharges 
  } = useSelector((state) => state.dealerService);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isHydrating, setIsHydrating] = useState(false);
  const [masterDataLoading, setMasterDataLoading] = useState(false);

  // Use custom hook for dealer services with caching
  const { data: dealerServicesData, loading: servicesLoading, refetch } = useDealerServices(
    dealer?._id || dealer?.id,
    {
      enabled: !!(dealer?._id || dealer?.id),
      cacheTime: 3 * 60 * 1000 // 3 minutes cache for dealer services
    }
  );


  const { companies } = useSelector((state) => state.bike);
  const { baseServices, additionalServices } = useSelector((state) => state.service);

  useEffect(() => {
    // Master data fetch - only if not already loaded
    const loadMasterData = async () => {
      setMasterDataLoading(true);
      try {
        const promises = [];
        if (companies.length === 0) promises.push(dispatch(fetchCompanies()));
        if (baseServices.length === 0) promises.push(dispatch(fetchBaseServices()));
        if (additionalServices.length === 0) promises.push(dispatch(fetchAdditionalServices()));
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (error) {
        console.error('Failed to load master data:', error);
      } finally {
        setMasterDataLoading(false);
      }
    };

    // Only load master data once
    if (companies.length === 0 || baseServices.length === 0 || additionalServices.length === 0) {
      loadMasterData();
    }

    // Hydrate existing dealer configuration
    const hydrate = async () => {
      if (!dealerServicesData) return;
      
      setIsHydrating(true);
      try {
        const res = dealerServicesData;
        
        if (res?.status && Array.isArray(res.pricing)) {
          // ... hydration logic ...
          const selectedBikesMap = new Map();
          const selectedServicesSet = new Set();
          const selectedAdditionalServicesSet = new Set();
          const servicePricingByCCRange = {};
          const additionalServicePricingByCCRange = {};

          res.pricing.forEach(item => {
            const { type, serviceId, cc, price, variantId, companyName, modelName, bikeName } = item;
            const ccKey = getCCRangeKey(cc);
            
            if (variantId && !selectedBikesMap.has(variantId)) {
              selectedBikesMap.set(variantId, {
                _id: variantId,
                variant_id: variantId,
                variant_name: bikeName || "Unknown Bike",
                company_name: companyName,
                model_name: modelName,
                cc: cc,
                engine_cc: cc
              });
            }

            if (type === "base") {
              const sId = String(serviceId);
              selectedServicesSet.add(sId);
              if (!servicePricingByCCRange[sId]) servicePricingByCCRange[sId] = {};
              if (!servicePricingByCCRange[sId][ccKey]) {
                servicePricingByCCRange[sId][ccKey] = { price: Number(price), disabledBikes: [], bikeOverrides: {} };
              } else if (Number(price) !== servicePricingByCCRange[sId][ccKey].price) {
                servicePricingByCCRange[sId][ccKey].bikeOverrides[variantId] = Number(price);
              }
            } else if (type === "additional") {
              const sId = String(serviceId);
              selectedAdditionalServicesSet.add(sId);
              if (!additionalServicePricingByCCRange[sId]) additionalServicePricingByCCRange[sId] = {};
              if (!additionalServicePricingByCCRange[sId][ccKey]) {
                additionalServicePricingByCCRange[sId][ccKey] = { price: Number(price), disabledBikes: [], bikeOverrides: {} };
              } else if (Number(price) !== additionalServicePricingByCCRange[sId][ccKey].price) {
                additionalServicePricingByCCRange[sId][ccKey].bikeOverrides[variantId] = Number(price);
              }
            }
          });

          dispatch(hydrateDealerState({
            selectedBikes: Array.from(selectedBikesMap.values()),
            selectedCompanies: res.companies || [],
            selectedServices: Array.from(selectedServicesSet),
            selectedAdditionalServices: Array.from(selectedAdditionalServicesSet),
            servicePricingByCCRange,
            additionalServicePricingByCCRange,
            pickupCharges: res.pickupCharges || 0
          }));
        } else {
          dispatch(resetSelection());
        }
      } catch (err) {
        console.error("BikeDoctor: Hydration failed", err);
      } finally {
        setIsHydrating(false);
      }
    };

    // Only hydrate if we don't have selected bikes or if the dealer changed
    // In a production app, we might want a more robust check (e.g., currentDealerId in state)
    // For now, we'll keep the hydration on dealer change.
    if (dealer && dealerServicesData && !servicesLoading) {
      hydrate();
    }

    // REMOVED: dispatch(resetSelection()) on unmount to persist state when switching tabs
  }, [dispatch, dealer, companies.length, baseServices.length, additionalServices.length, dealerServicesData, servicesLoading]);

  // Initialize General Service only on initial load if no services are configured
  useEffect(() => {
    // Only auto-enable if we have selected bikes, no services, and base services are loaded.
    // To prevent re-enabling when user explicitly disables all services, we should only run it once.
    // However, tracking "has initialized" is better done cleanly. Let's just remove this aggressive auto-toggle,
    // or add a flag so it only runs once per mount.
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      setSnackbar({ open: true, message: "Dealer services updated successfully!", severity: "success" });
      dispatch(resetSaveStatus());
    }
    if (error) {
      setSnackbar({ open: true, message: `Error: ${error}`, severity: "error" });
      dispatch(resetSaveStatus());
    }
  }, [saveSuccess, error, dispatch]);

  const handleSave = () => {

    const pricing = [];

    const processServices = (selectedIds, pricingByCCObj, typeStr) => {
      selectedIds.forEach((svcId) => {
        const svcPricing = pricingByCCObj[svcId] || {};
        
        selectedBikes.forEach((bike) => {
          const variantId = String(bike._id || bike.id || bike.variant_id);
          const rawCC = bike.cc || bike.engine_cc || bike.engine_capacity || 0;
          const parsedCc = typeof rawCC === 'string' ? parseInt(rawCC.replace(/\D/g, ''), 10) : Number(rawCC);
          const bikeCCRange = getCCRangeKey(rawCC);
          const groupData = svcPricing[bikeCCRange] || { price: 0, disabledBikes: [] };

          if (groupData.disabledBikes?.includes(variantId)) return;

          const overridePrice = groupData.bikeOverrides?.[variantId];
          const finalPrice = overridePrice !== undefined ? Number(overridePrice) : Number(groupData.price || 0);

          if (finalPrice > 0) {
            pricing.push({
              type: typeStr,
              serviceId: svcId,
              variantId: variantId,
              cc: isNaN(parsedCc) ? 0 : parsedCc,
              price: finalPrice,
            });
          }
        });
      });
    };

    processServices(selectedServices, servicePricingByCCRange, "base");
    processServices(selectedAdditionalServices, additionalServicePricingByCCRange, "additional");

    const payload = {
      dealerId: dealer?._id,
      pricing: pricing,
      pickupCharges: pickupCharges
    };
    dispatch(submitDealerServices(payload));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 10, position: "relative" }}>
      {(masterDataLoading || isHydrating || servicesLoading) ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            {masterDataLoading ? 'Loading master data...' : 
             servicesLoading ? 'Loading dealer services...' :
             'Loading dealer configuration...'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={6}>
          {/* Section 1: Supported Bikes */}
          <Box>
            <SupportedBikesSection />
          </Box>

          <Divider />

          {/* Section: Global Settings */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "white" }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
              <Box sx={{ p: 1, bgcolor: "primary.light", borderRadius: 2, display: "flex" }}>
                <MopedIcon color="primary" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="800">Logistic Settings</Typography>
                <Typography variant="caption" color="text.secondary">Configure standard charges for vehicle movement</Typography>
              </Box>
            </Stack>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Standard Pickup Charges"
                  variant="outlined"
                  type="number"
                  value={pickupCharges}
                  onChange={(e) => dispatch(setPickupCharges(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  helperText="Standard fee for vehicle pickup and drop"
                />
              </Grid>
            </Grid>
          </Paper>

          <Divider />

          {/* Section 2: Base Services */}
          <Box>
            <BaseServicesSection />
          </Box>

          <Divider />

          {/* Section 3: Additional Services */}
          <Box>
            <AdditionalServicesSection />
          </Box>
        </Stack>
      )}

      {/* Sticky Save Button */}
      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 24,
          p: 2,
          borderRadius: 4,
          bgcolor: "#fcfdfe",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          gap: 2,
          border: "1px solid",
          borderColor: "primary.light",
        }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight="600">
          Ready to update?
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving || masterDataLoading || isHydrating || servicesLoading}
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 3,
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 8px 16px rgba(0,118,255,0.24)",
            "&:hover": {
              boxShadow: "0 12px 20px rgba(0,118,255,0.32)",
            },
          }}
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DealerServicesTab;
