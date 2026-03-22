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
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import SaveIcon from "@mui/icons-material/Save";
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
  resetSelection
} from "../../redux/slices/dealerServiceSlice";
import { getCCRangeKey } from "../../constants/bikeConstants";

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
    error 
  } = useSelector((state) => state.dealerService);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });


  useEffect(() => {
    // Master data fetch
    dispatch(fetchCompanies());
    dispatch(fetchBaseServices());
    dispatch(fetchAdditionalServices());

    // Hydrate existing dealer configuration
    const hydrate = async () => {
      try {
        const { getDealerServices } = await import("../../api");
        const res = await getDealerServices(dealer?._id || dealer?.id);

        if (res?.status && Array.isArray(res.pricing)) {
          console.log("BikeDoctor: Hydrating dealer services", res.pricing.length);
          
          const selectedBikesMap = new Map();
          const selectedServices = new Set();
          const selectedAdditionalServices = new Set();
          const servicePricingByCCRange = {};
          const additionalServicePricingByCCRange = {};


          res.pricing.forEach(item => {
            const { type, serviceId, cc, price, variantId, companyName, modelName, bikeName } = item;
            const ccKey = getCCRangeKey(cc);
            
            // Reconstruct bike object for the editor
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
              selectedServices.add(sId);
              if (!servicePricingByCCRange[sId]) servicePricingByCCRange[sId] = {};
              
              if (!servicePricingByCCRange[sId][ccKey]) {
                servicePricingByCCRange[sId][ccKey] = { 
                  price: Number(price), 
                  disabledBikes: [], 
                  bikeOverrides: {} 
                };
              } else if (Number(price) !== servicePricingByCCRange[sId][ccKey].price) {
                // If this price is different from the first one we set for this CC range, it's an override
                servicePricingByCCRange[sId][ccKey].bikeOverrides[variantId] = Number(price);
              }
            } else if (type === "additional") {
              const sId = String(serviceId);
              selectedAdditionalServices.add(sId);
              if (!additionalServicePricingByCCRange[sId]) additionalServicePricingByCCRange[sId] = {};
              
              if (!additionalServicePricingByCCRange[sId][ccKey]) {
                additionalServicePricingByCCRange[sId][ccKey] = { 
                  price: Number(price), 
                  disabledBikes: [], 
                  bikeOverrides: {} 
                };
              } else if (Number(price) !== additionalServicePricingByCCRange[sId][ccKey].price) {
                additionalServicePricingByCCRange[sId][ccKey].bikeOverrides[variantId] = Number(price);
              }
            }
          });

          // Dispatch full state update at once
          dispatch(hydrateDealerState({
            selectedBikes: Array.from(selectedBikesMap.values()),
            selectedCompanies: res.companies || [],
            selectedServices: Array.from(selectedServices),
            selectedAdditionalServices: Array.from(selectedAdditionalServices),
            servicePricingByCCRange,
            additionalServicePricingByCCRange
          }));
        } else {
          // If no services found, clear the state for this dealer
          dispatch(resetSelection());
        }
      } catch (err) {
        console.error("Hydration failed", err);
      }
    };

    if (dealer) hydrate();

    return () => {
      dispatch(resetSelection());
    };
  }, [dispatch, dealer]);

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
      pricing: pricing
    };
    dispatch(submitDealerServices(payload));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 10, position: "relative" }}>
      <Stack spacing={6}>
        {/* Section 1: Supported Bikes */}
        <Box>
          <SupportedBikesSection />
        </Box>

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
          startIcon={isSaving ? null : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
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
